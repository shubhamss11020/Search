# AI Job Search & Application Assistant
**Personal AI-powered Chrome extension with live on-page matching, adaptive workflow detection, context-aware autofill, and unified application tracking.**

---

## 🌟 Key Features

1. **Adaptive Application Workflow Detection**:
   - Detects whether an employer expects a **Website Form**, **Direct Email**, **Recruiter Message**, or **External ATS Portal**.
   - Strictly prioritizes explicit instructions over generic assumptions.
2. **Deterministic & AI Hybrid Matching**:
   - Compares jobs with your verified candidate profile.
   - Computes fit score (0-100%), distinguishes mandatory from preferred skills, and details clear reasoning.
3. **Safe Context-Aware Autofill**:
   - Detects input fields and stages verified facts.
   - **Non-negotiable rule**: The extension never automatically clicks final submission buttons. You review and submit manually.
4. **Email Application Preparation**:
   - Extracts recipient and requested subject.
   - Drafts tailored application email and links your chosen resume version for manual review and sending.
5. **Unified Dashboard & Tracker**:
   - Filter jobs by posting recency (`< 1h`, `< 24h`, `< 3d`, `< 7d`).
   - Distinguishes source posting time from discovery time.
   - Application status pipeline (`NEW`, `SHORTLISTED`, `READY_TO_APPLY`, `DRAFTED`, `APPLIED`, `INTERVIEW`, `OFFER`).
   - One-click CSV export.
6. **Strict Fact Grounding & Privacy**:
   - AI is strictly constrained to verified profile facts and never fabricates credentials.
   - Complete data deletion endpoint for full privacy compliance.

---

## 🛠️ Tech Stack & Cloud Architecture

- **Backend**: Python 3.14 / 3.11, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2.
- **Database**: **Neon PostgreSQL** serverless (with SSL pooling) and SQLite local fallback.
- **Cloud Hosting**: **Render** web service deployment via `render.yaml`.
- **AI Engine**: **Google Gemini Free Tier** (`gemini-1.5-flash`) with optional xAI Grok fallback.
- **Extension**: Chrome Manifest V3, TypeScript, Vite, Vanilla CSS design system.

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend

# 1. Create .env from template
cp .env.example .env

# 2. Add your Neon Database URL and Gemini Free Tier Key in .env:
# DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
# GEMINI_API_KEY="AIzaSy..."

# 3. Start backend locally:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
API Documentation will be live at: `http://127.0.0.1:8000/api/v1/docs`.

### 2. Chrome Extension Setup

```bash
cd extension

# 1. Install dependencies and build
npm install
npm run build
```

To load into Google Chrome:
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select the `extension/` directory (or `extension/dist/` after building).
5. Click the Extension icon in Chrome toolbar to sign in and open the dashboard!

---

## ☁️ Deploying Backend to Render

1. Push this repository to your GitHub account.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select your repository. Render will automatically read `backend/render.yaml`.
4. In the Render environment settings, paste your **Neon PostgreSQL `DATABASE_URL`** and your **`GEMINI_API_KEY`**.
5. Render will deploy the web service with HTTPS!
6. In the Chrome Extension Settings view, update the API Base URL to your Render URL:
   `https://your-service.onrender.com/api/v1`.
