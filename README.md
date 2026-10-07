# InterviewPilot

InterviewPilot is an AI-powered technical career preparation platform that bridges the gap between candidate resumes and target engineering roles. It analyzes skill gaps against job descriptions, builds personalized multi-week learning roadmaps, conducts turn-by-turn adaptive mock interviews, and delivers continuous coaching using retrieval-augmented generation (RAG) and autonomous agent workflows.

---

## Live Demo

- **Frontend Application**: [https://interviewpilot-one.vercel.app](https://interviewpilot-one.vercel.app)
- **Backend API**: [https://interviewpilot-production-0ff9.up.railway.app](https://interviewpilot-production-0ff9.up.railway.app)

---

## Features

- **Resume & ATS Diagnostics**: Parses PDF resumes via PyMuPDF, extracts skill taxonomies, and evaluates format, density, and keyword alignment against ATS benchmarks.
- **Job Matching & Skill Gap Analysis**: Compares candidate competencies against target job descriptions to identify missing technical requirements.
- **Personalized Roadmaps**: Generates dynamic week-by-week study milestones, curated resources, and practical projects calibrated to candidate study hours.
- **RAG-Powered Contextual Retrieval**: Semantic vector search over candidate resumes, job descriptions, and past feedback to ground interview questions and eliminate hallucinations.
- **Agentic AI Coaching**: Tool-calling decision engine that evaluates candidate state, tracks momentum, and recommends the next best preparation action.
- **Adaptive Mock Interviews**: Turn-by-turn conversational technical and behavioral interviews with dynamic difficulty adjustment and targeted follow-up questions.
- **Algorithmic Code Studio**: Browser-based coding IDE with automated Big-O time/space complexity analysis and edge-case verification.
- **Progress Tracking & Analytics**: Chronological coaching timelines, placement readiness scoring, and practice history persistence.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Framer Motion |
| **Backend** | Python 3.11+, Flask 3.0, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Limiter |
| **Database** | PostgreSQL (Neon / Supabase) with `pgvector`; SQLite local fallback |
| **AI / LLM** | Groq Cloud SDK (`qwen/qwen3.8-27b`, `openai/gpt-oss-120b`) |
| **RAG / Embeddings** | FastEmbed (`BAAI/bge-small-en-v1.5`), Dense Vector Search, PyMuPDF |
| **Authentication** | JWT Bearer Tokens, Passlib / Bcrypt password hashing |
| **Deployment** | Vercel (Frontend), Railway / Gunicorn (Backend) |

---

## Architecture

```mermaid
graph TD
    User([Candidate]) --> Frontend[React SPA / Vite]
    Frontend -->|REST API + JWT| API[Flask Gateway]
    API --> Services[Application Services<br/>Resume · Roles · Roadmap · Code · Practice]
    Services --> AgentRAG[AI Agent & RAG Engine]
    AgentRAG --> VectorDB[(PostgreSQL + pgvector)]
    Services --> RelDB[(PostgreSQL Relational DB)]
    AgentRAG --> LLM[Groq Inference API]
```

---

## Project Structure

```
interviewpilot/
├── backend/
│   ├── app.py                  # Flask app factory and blueprint registration
│   ├── config.py               # Database and environment configuration
│   ├── wsgi.py                 # Production WSGI entrypoint
│   ├── requirements.txt        # Backend dependencies
│   ├── database/               # DB initialization and role/company seed data
│   ├── models/                 # SQLAlchemy models (User, Candidate, Interview, Document)
│   ├── routes/                 # Flask REST API blueprints (auth, resume, roles, interview, etc.)
│   └── services/               # Core AI logic (agent, RAG, retrieval, adaptive interview)
└── frontend/
    ├── index.html              # HTML entrypoint
    ├── vite.config.js          # Vite config & API proxy
    ├── package.json            # Frontend dependencies
    └── src/
        ├── App.jsx             # Router and layout configuration
        ├── components/         # Reusable UI (Navbar, CommandPalette, ReadinessRadar)
        ├── context/            # AuthContext for session management
        ├── pages/              # Core pages (Dashboard, Resume, Roadmap, MockInterview, Code)
        └── utils/              # Axios API client with JWT interceptor
```

---

## AI Architecture

- **RAG Grounding**: Semantically indexes resumes, job descriptions, and past interview feedback into dense vector embeddings to ground questions and prevent hallucinations.
- **Canonical Candidate State**: Maintains a unified, single source of truth containing verified skills, active job targets, identified skill gaps, and practice scores.
- **Tool-Calling Agent**: Autonomous agent leverages schema-validated tools to inspect profiles, calculate gaps, and determine coaching recommendations.
- **Next-Best-Action Engine**: Evaluates candidate readiness velocity and bottlenecks to prescribe the most impactful next task on the dashboard.
- **Adaptive Interviewing**: Generates one question per turn, dynamically adjusting difficulty (Easy/Medium/Hard) and probing weak answers with follow-ups.
- **Continuous Feedback Loop**: Turn evaluations, code reviews, and practice results feed back into vector memory and update candidate readiness signals.
- **Deterministic Fallbacks**: Structured rule-based fallbacks guarantee seamless operation if LLM or embedding providers experience transient latency.

---

## API

| Area | Base Path | Purpose |
|---|---|---|
| **Authentication** | `/api/auth` | User registration, login, profile management, and onboarding |
| **Resume** | `/api/resume` | PDF resume parsing, ATS scoring, and bullet point enhancement |
| **Roles & Jobs** | `/api/roles` | Role taxonomy matching, job description ingestion, and skill gaps |
| **Roadmap** | `/api/roadmap` | Personalized multi-week learning curriculum generation |
| **Practice & Code** | `/api/code` | Algorithmic code review, Big-O complexity analysis, and practice logging |
| **Company Tracks** | `/api/companies` | Target company interview patterns, rounds, and prep strategies |
| **Semantic RAG** | `/api/rag` | Document vector chunking, indexing, and contextual search |
| **AI Coach** | `/api/agent` | Candidate state, next-best-action generation, and progress signals |
| **Adaptive Interview** | `/api/interview` | Turn-by-turn adaptive mock interviews and rubric evaluations |

---

## Local Development

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
python database/seed.py

# Run development server (Port 5000)
flask run --host 127.0.0.1 --port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Run development server (Port 5173)
npm run dev
```

---

## Environment Variables

Create a `backend/.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/interviewpilot
# Local SQLite fallback: sqlite:///./interviewpilot.db

# Authentication
JWT_SECRET_KEY=your_jwt_secret_key_here
FLASK_ENV=development

# LLM & Embeddings (Groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
EMBEDDING_PROVIDER=fastembed
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```