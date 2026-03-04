# 🔴 QTest Platform

> An enterprise-grade Test Management System built with React, TypeScript, Python Flask, and SQLite — inspired by OpenText ALM / HP Quality Center.

![Platform](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)
![Backend](https://img.shields.io/badge/Backend-Render-purple?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-TypeScript-61dafb?style=flat-square&logo=react)

## 🌐 Live Demo

👉 **[qtest-platform.vercel.app](https://qtest-platform.vercel.app)**

| Access | Credentials |
|--------|-------------|
| Preview Mode | Click **"Preview Mode"** on login — no backend required |
| Admin Login | `admin` / `Admin@123` |

---

## ✨ Features

- **Requirements Management** — Create, track and link requirements with test coverage
- **Test Plan** — Build manual and automated test cases with step definitions
- **Test Lab** — Organize test suites, assign instances, track execution
- **Defect Tracking** — Log, link and manage defects across test runs
- **Execution Console** — Real-time streaming logs for automated test runs
- **Local Execution Agent** — Run Selenium scripts from the browser via a local agent on your PC
- **AI Code Assistant** — Generate automation code using Claude AI
- **Role-Based Access** — Viewer / Tester / Lead / Admin permission levels
- **Site Admin** — User management, DB explorer, system stats
- **Preview / Demo Mode** — Full platform tour without any backend

---

## 🏗️ Architecture

```
Browser (Vercel) ──────► Render Backend (Flask + SQLite)
                                  │
                          Agent Job Queue (DB)
                                  │
                    ◄─── Local Execution Agent (PC)
                                  │
                          Selenium opens Edge/Chrome
                          Results stream back to browser
```

This mirrors real enterprise tools like HP ALM and Tricentis — the execution agent runs locally on the tester's machine where browsers are installed, while the platform manages everything centrally in the cloud.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.11, Flask, SQLite |
| Hosting | Vercel (frontend) + Render (backend) |
| Auth | UUID session tokens stored in SQLite |
| AI | Anthropic Claude API (code generation) |
| Automation | Selenium WebDriver via local agent |

---

## 🤖 Local Execution Agent

The QTest Agent runs on your local PC and picks up test execution jobs queued from the browser. This allows real Selenium browser automation to be triggered from anywhere in the world via the web UI.

### How it works

```
Click Execute (browser) → Job queued in Render DB → Agent polls every 3s
→ Agent claims job → Runs Selenium on local PC → Streams results back to browser
```

### Setup (One Time)

**1. Install dependencies**
```cmd
pip install requests pystray pillow
```

**2. Run the agent**
```cmd
cd path\to\qtest
python qtest_agent_tray.py
```

Wait for the 🟢 green dot in your system tray (bottom-right taskbar). This means the agent is connected and ready.

**3. Execute from browser**

Go to `qtest-platform.vercel.app` → Test Lab → open any automated test instance → click **Execute**. The agent picks up the job within 3 seconds, opens Edge/Chrome on your PC, runs the script, and streams results back to the console.

---

### Auto-Start with Windows (Recommended)

To have the agent start automatically every time Windows boots:

**Step 1** — Press `Win + R`, type `shell:startup`, press Enter

**Step 2** — Create a file called `QTest Agent.bat` in that folder with this content:

```bat
@echo off
cd C:\path\to\your\qtest
start "" pythonw.exe qtest_agent_tray.py
```

Replace `C:\path\to\your\qtest` with your actual project path, e.g.:
```
C:\Users\YourName\Desktop\qtest
```

**Step 3** — Save the file. Done!

From now on, every time Windows starts, the agent starts silently in the background with no terminal window — just the 🟢 green dot in the system tray.

### Tray Icon Colors

| Color | Meaning |
|-------|---------|
| 🟢 Green | Connected and waiting for jobs |
| 🟡 Yellow | Currently running a test |
| 🔴 Red | Disconnected from backend |

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Microsoft Edge + EdgeDriver (for Selenium tests)

### Frontend

```cmd
cd qtest
npm install
npm run dev
```

Runs at `http://localhost:5173`

### Backend

```cmd
cd backend
pip install -r requirements.txt
python app.py
```

Runs at `http://localhost:8080`

### Agent (optional for local execution)

```cmd
python qtest_agent_tray.py
```

---

## ☁️ Deployment

| Service | URL |
|---------|-----|
| Frontend | [qtest-platform.vercel.app](https://qtest-platform.vercel.app) |
| Backend | [qtest-platform.onrender.com](https://qtest-platform.onrender.com) |

### Environment Variables

**Vercel (Frontend)**
```
VITE_API_BASE_URL = https://qtest-platform.onrender.com/api
```

**Render (Backend)**
```
RENDER = true
FRONTEND_URL = https://qtest-platform.vercel.app
```

### Persistent Storage (Render)

The backend uses a 1GB persistent disk mounted at `/opt/render/project/data` to store:
- `qtest.db` — SQLite database
- `attachments/` — uploaded files
- `run_logs/` — execution log files

---

## 📁 Project Structure

```
qtest/
├── src/
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── requirements/
│   │   ├── testplan/
│   │   ├── testlab/
│   │   └── defects/
│   ├── components/
│   ├── services/
│   │   └── api.ts
│   ├── demo/
│   │   ├── demoData.ts
│   │   └── DemoContext.tsx
│   └── contexts/
│       └── AuthContext.tsx
├── backend/
│   ├── app.py
│   └── requirements.txt
├── qtest_agent_tray.py       ← Local execution agent
├── qtest_agent.py            ← Terminal-mode agent
├── render.yaml               ← Render deployment config
└── README.md
```

---

## 🔒 Security

- Passwords hashed with SHA-256
- Session tokens stored in DB with 7-day expiry
- Role-based route protection (viewer / tester / lead / admin)
- CORS restricted to Vercel frontend origin only

---

## 👤 Author

**Pongowtham Kumar**
Enterprise Automation & ALM Integration Engineer

[![GitHub](https://img.shields.io/badge/GitHub-pongowthamkumar4209--svg-black?style=flat-square&logo=github)](https://github.com/pongowthamkumar4209-svg)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://linkedin.com/in/pongowthamkumar)

---

*Built as a portfolio project demonstrating enterprise test management concepts, full-stack development, cloud deployment, and automation architecture.*
