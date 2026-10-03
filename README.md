# InterviewPilot — AI Placement Coach

> An AI-powered full-stack platform that helps students analyze resumes, match roles, generate personalized learning roadmaps, and practice mock interviews.

![Status](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Python](https://img.shields.io/badge/Python-3.14-blue) ![React](https://img.shields.io/badge/React-18-61dafb)

---

## 🚀 Live Demo

| Service  | URL |
|----------|-----|
| Frontend | https://interviewpilot-one.vercel.app |
| Backend  | https://interviewpilot-1m0t.onrender.com |

---

## ✨ Features

### 📄 Resume Analyzer
- Upload PDF resume
- Extracts skills, experience, education, and projects using **PyMuPDF + spaCy**
- Generates a resume score (0–100) with strengths and weaknesses
- AI-powered bullet point improver using **Groq (Llama 3)**

### 🎯 Role Matching
- Match your skill set against 9 tech roles
- See match percentage, matched skills, and missing skills
- Roles: Software Engineer, Backend Developer, Frontend Developer, Full Stack Developer, Data Analyst, Data Scientist, ML Engineer, DevOps Engineer, Cloud Engineer

### 🗺️ AI Roadmap Generator
- Select target role + skills to learn + study hours/week
- Generates a 4, 8, or 12-week personalized study plan
- Each week includes topics, resources, practice tasks, and a mini project
- Powered by **Groq AI (Llama 3.3 70B)**

### 🎤 Mock Interview
- Select role and difficulty (Easy / Medium / Hard)
- AI generates 11 questions: 5 Technical + 3 Behavioral + 3 HR
- Submit answers and get scored on Technical Accuracy, Communication, and Completeness
- Detailed feedback and improvement suggestions

---

## 🛠️ Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 18, Tailwind CSS, Framer Motion, Recharts     |
| Backend    | FastAPI, SQLAlchemy 2.0, Uvicorn, Pydantic v2       |
| AI         | Groq API (High-speed Llama / GPT models)            |
| NLP        | spaCy, PyMuPDF                                      |
| Database   | PostgreSQL (Neon) or SQLite (Local)                 |
| Auth       | JWT (PyJWT) + bcrypt                                |
| API Docs   | Interactive Swagger UI at `/docs`                   |
| Deploy     | Vercel (frontend) + Render / Railway (backend)      |

---

## 📁 Project Structure

```
interviewpilot/
├── backend/
│   ├── main.py                 # FastAPI app entry point & CORS
│   ├── config.py               # Environment & Settings
│   ├── models/                 # SQLAlchemy 2.0 models
│   │   ├── user.py
│   │   ├── resume.py
│   │   ├── role.py
│   │   ├── roadmap.py
│   │   ├── interview.py
│   │   ├── dsa.py
│   │   ├── company.py
│   │   └── chat.py
│   ├── routes/                 # FastAPI APIRouters
│   │   ├── auth.py             # Register / Login / JWT / Me
│   │   ├── resume.py           # PDF upload + analysis
│   │   ├── roles.py            # Role matching
│   │   ├── roadmap.py          # AI roadmap generation
│   │   └── interview.py        # Mock interview + SSE streaming
│   ├── schemas/                # Pydantic validation schemas
│   │   ├── auth.py
│   │   ├── interview.py
│   │   ├── roadmap.py
│   │   ├── roles.py
│   │   └── resume.py
│   ├── services/
│   │   ├── ai_service.py       # Groq AI async streaming & completions
│   │   ├── resume_service.py   # PDF parsing + scoring
│   │   └── role_service.py     # Skill matching algorithm
│   ├── database/
│   │   ├── db.py               # SQLAlchemy 2.0 Session & Base
│   │   └── seed.py             # Seed roles and companies
│   ├── utils/
│   │   ├── auth.py             # JWT dependencies & password utils
│   │   └── file_utils.py       # UploadFile helpers
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ResumeAnalyzer.jsx
    │   │   ├── RoleMatch.jsx
    │   │   ├── Roadmap.jsx
    │   │   └── MockInterview.jsx
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   └── utils/
    │       └── api.js
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or Neon free tier) / SQLite

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Setup environment
copy .env.example .env         # Windows
# cp .env.example .env         # Mac/Linux
```

Edit `.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key-here
CORS_ORIGINS=http://localhost:5173
```

```bash
# Seed database (first time only)
python database/seed.py

# Start FastAPI backend
uvicorn main:app --reload --port 5000
```

Backend runs at: `http://localhost:5000`
Interactive API Docs (Swagger UI): `http://localhost:5000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout | Yes |

### Resume
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/resume/analyze` | Upload + analyze PDF | Yes |
| POST | `/api/resume/improve` | Improve bullet point | Yes |
| GET | `/api/resume/history` | Past analyses | Yes |

### Roles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/roles/` | List all roles | Yes |
| POST | `/api/roles/match` | Match skills to roles | Yes |

### Roadmap
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/roadmap/generate` | Generate AI roadmap | Yes |
| GET | `/api/roadmap/history` | Past roadmaps | Yes |

### Interview
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/interview/generate` | Generate questions | Yes |
| POST | `/api/interview/submit` | Submit + get feedback | Yes |
| POST | `/api/interview/chat-stream` | Real-time AI streaming (SSE) | Yes |
| GET | `/api/interview/history` | Past interviews | Yes |

---

## 🚢 Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Framework: Vite — Build: `npm run build` — Output: `dist`
4. Add env var: `VITE_API_URL=https://your-render-url.onrender.com`

### Backend → Render / Railway
1. Connect GitHub repo to Render
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (DATABASE_URL, JWT_SECRET_KEY, GROQ_API_KEY, CORS_ORIGINS)

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `JWT_SECRET_KEY` | Secret key for JWT tokens |
| `GROQ_API_KEY` | Groq API key from console.groq.com |
| `CORS_ORIGINS` | Frontend URL (comma-separated) |
| `FLASK_ENV` | `development` or `production` |

---

## 👨‍💻 Author

**Sanket Hatti**
- GitHub: [@Sanket-Hatti](https://github.com/Sanket-Hatti)
- Project: [InterviewPilot](https://github.com/Sanket-Hatti/interviewpilot)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.