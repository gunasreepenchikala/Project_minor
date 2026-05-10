from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import select
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os, re, json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "complyai-secret-2024")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///complyai.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_PATH"] = "/"

CORS(app, supports_credentials=True, origins=re.compile(r"http://localhost:\d+"))

db = SQLAlchemy(app)
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
print("OpenAI Key Loaded:", bool(OPENAI_KEY))


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ComplianceReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    query = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False)
    risk_level = db.Column(db.String(50), nullable=False)
    explanation = db.Column(db.Text, nullable=False)
    recommendations = db.Column(db.Text, nullable=False)
    regulations_violated = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


HIGH_RISK_KEYWORDS = [
    "without consent", "no consent", "plain text", "plaintext", "no encryption",
    "no privacy policy", "selling user data", "sell user data", "track.*without",
    "no authentication", "no auth", "publicly share", "public.*medical",
    "no option.*delete", "store.*password.*plain", "cookies without", "no gdpr",
    "no security", "retain.*indefinitely", "biased ai", "no audit",
    "without informing", "insecure", "unencrypted", "share.*without"
]

MEDIUM_RISK_KEYWORDS = [
    "unclear purpose", "hard to understand", "not clearly informed", "unclear.*policy",
    "partial encryption", "limited transparency", "assumed.*consent",
    "not explainable", "weak password", "partial.*compliance", "vague policy",
    "difficult to find", "ambiguous", "no clear"
]

LOW_RISK_KEYWORDS = [
    "encrypt all", "full encryption", "explicit consent", "clear privacy policy",
    "users can delete", "data minimization", "regular audit", "gdpr compliant",
    "multi-factor", "mfa", "two-factor", "2fa", "anonymized", "hashed password",
    "bcrypt", "argon2", "secure payment", "tls", "role-based", "privacy-first",
    "data breach notification", "right to erasure", "transparent", "informed consent"
]


def rule_based_analyze(query):
    q = query.lower()
    for pattern in HIGH_RISK_KEYWORDS:
        if re.search(pattern, q):
            return {
                "status": "Non-Compliant", "riskLevel": "High",
                "explanation": "The described practice contains significant non-compliance issues that violate core data protection regulations such as GDPR and CCPA. Immediate corrective action is required to avoid regulatory penalties and data breaches.",
                "recommendations": "\u2022 Conduct a full compliance audit of your data practices\n\u2022 Implement explicit user consent mechanisms\n\u2022 Engage a Data Protection Officer (DPO)\n\u2022 Review and update your privacy policy immediately",
                "regulationsViolated": "GDPR Art.5, GDPR Art.6, CCPA"
            }
    for pattern in MEDIUM_RISK_KEYWORDS:
        if re.search(pattern, q):
            return {
                "status": "Partial", "riskLevel": "Medium",
                "explanation": "The practice shows partial compliance efforts but falls short of full regulatory requirements. Some protective measures may be in place, but lack of clarity or completeness creates legal and reputational risk.",
                "recommendations": "\u2022 Clarify data usage purposes in plain, accessible language\n\u2022 Strengthen consent mechanisms to be explicit\n\u2022 Provide users with clear options to manage their data\n\u2022 Conduct a gap analysis against GDPR requirements",
                "regulationsViolated": "GDPR Art.5, GDPR Art.13"
            }
    for pattern in LOW_RISK_KEYWORDS:
        if re.search(pattern, q):
            return {
                "status": "Compliant", "riskLevel": "Low",
                "explanation": "The described practice follows established data protection and privacy best practices. It aligns with GDPR principles of data minimization, transparency, and user rights.",
                "recommendations": "None required - already compliant",
                "regulationsViolated": "None"
            }
    return {
        "status": "Partial", "riskLevel": "Medium",
        "explanation": "The described practice could not be definitively classified without additional context. Based on available information, there appear to be compliance considerations that should be reviewed against applicable regulations.",
        "recommendations": "\u2022 Review your data practices against GDPR Art.5 principles\n\u2022 Consult with a Data Protection Officer\n\u2022 Conduct a privacy impact assessment\n\u2022 Document all data flows and processing activities",
        "regulationsViolated": "GDPR Art.5 (requires review)"
    }


def get_json_data():
    return request.get_json(force=True, silent=True) or {}


def report_to_dict(r):
    return {
        "id": r.id, "query": r.query, "status": r.status,
        "riskLevel": r.risk_level, "explanation": r.explanation,
        "recommendations": r.recommendations,
        "regulationsViolated": r.regulations_violated,
        "createdAt": r.created_at.isoformat()
    }


with app.app_context():
    db.create_all()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = get_json_data()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    existing = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        return jsonify({"error": "Email already registered"}), 409
    user = User(email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"id": user.id, "email": user.email}), 201


@app.route("/api/auth/signin", methods=["POST"])
def signin():
    data = get_json_data()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401
    session["user_id"] = user.id
    return jsonify({"id": user.id, "email": user.email})


@app.route("/api/auth/signout", methods=["POST"])
def signout():
    session.clear()
    return jsonify({"message": "Signed out"})


@app.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user.id, "email": user.email})


@app.route("/api/compliance/analyze", methods=["POST"])
def analyze():
    data = get_json_data()
    query = str(data.get("query", "")).strip()
    if not query or len(query) < 5:
        return jsonify({"error": "Query is too short"}), 400
    try:
        if OPENAI_KEY:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_KEY)
            completion = client.chat.completions.create(
                model="gpt-4o", max_tokens=512,
                messages=[
                    {"role": "system", "content": 'Analyze compliance and respond ONLY with JSON: {"status":"Compliant"|"Partial"|"Non-Compliant","riskLevel":"Low"|"Medium"|"High","explanation":"...","recommendations":"bullet points with \u2022","regulationsViolated":"...or None"}'},
                    {"role": "user", "content": f'Analyze: "{query}"'}
                ]
            )
            content = completion.choices[0].message.content
            match = re.search(r"\{[\s\S]*\}", content)
            result = json.loads(match.group())
        else:
            result = rule_based_analyze(query)
    except Exception:
        result = rule_based_analyze(query)

    user_id = session.get("user_id")
    report = ComplianceReport(
        user_id=user_id, query=query,
        status=result["status"], risk_level=result["riskLevel"],
        explanation=result["explanation"], recommendations=result["recommendations"],
        regulations_violated=result.get("regulationsViolated", "None")
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report_to_dict(report))


@app.route("/api/compliance/reports", methods=["GET"])
def list_reports():
    user_id = session.get("user_id")
    stmt = select(ComplianceReport).order_by(ComplianceReport.created_at.desc())
    if user_id:
        stmt = stmt.where(ComplianceReport.user_id == user_id)
    reports = db.session.execute(stmt).scalars().all()
    return jsonify([report_to_dict(r) for r in reports])


@app.route("/api/compliance/reports/<int:report_id>", methods=["GET"])
def get_report(report_id):
    report = db.session.get(ComplianceReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    return jsonify(report_to_dict(report))


@app.route("/api/compliance/reports/<int:report_id>", methods=["DELETE"])
def delete_report(report_id):
    report = db.session.get(ComplianceReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    db.session.delete(report)
    db.session.commit()
    return "", 204


@app.route("/api/compliance/stats", methods=["GET"])
def stats():
    user_id = session.get("user_id")
    stmt = select(ComplianceReport)
    if user_id:
        stmt = stmt.where(ComplianceReport.user_id == user_id)
    reports = db.session.execute(stmt).scalars().all()
    return jsonify({
        "total": len(reports),
        "compliant": sum(1 for r in reports if r.status == "Compliant"),
        "partial": sum(1 for r in reports if r.status == "Partial"),
        "nonCompliant": sum(1 for r in reports if r.status == "Non-Compliant"),
        "highRisk": sum(1 for r in reports if r.risk_level == "High"),
        "mediumRisk": sum(1 for r in reports if r.risk_level == "Medium"),
        "lowRisk": sum(1 for r in reports if r.risk_level == "Low"),
    })


if __name__ == "__main__":
    mode = "AI-Based" if OPENAI_KEY else "Rule-Based"

    print("OpenAI Key Loaded:", bool(OPENAI_KEY))
    print("ComplyAI Backend running!")
    print("API: http://localhost:5000")
    print(f"Mode: {mode}")

    app.run(debug=True, host="0.0.0.0", port=5000)