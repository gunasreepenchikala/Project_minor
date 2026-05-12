# ComplyAI - Compliance Analysis Tool

AI-powered compliance analysis for GDPR, data privacy laws, and AI ethics.

## Quick Start (Windows - VS Code)

1. Open the project folder in VS Code
2. Double-click `START.bat` to launch both servers
3. Open http://localhost:5173 in your browser
4. Create an account and start analyzing

## Manual Start

### Backend (Terminal 1)
```bash
pip install -r requirements.txt
python app.py
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

## How It Works

- **Backend** runs on http://localhost:5000 (Flask + SQLite)
- **Frontend** runs on http://localhost:5173 (React + Vite)
- The frontend proxies API requests to the backend automatically via Vite

## Features

- **Analyzer** - Enter a data practice description and get instant compliance feedback
- **Reports** - View, filter, and download all past compliance analyses
- **Dashboard** - See compliance statistics and risk breakdowns at a glance

## Optional: AI Mode

By default, ComplyAI uses rule-based analysis (no API key needed).
To enable AI-powered analysis with OpenAI:

1. Create a `.env` file in the project root
2. Add: `OPENAI_API_KEY=your-key-here`
3. Restart the backend

## Requirements

- Python 3.8+
- Node.js 16+
- npm
