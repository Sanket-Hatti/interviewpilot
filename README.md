# InterviewPilot — AI Placement Coach

An AI-powered full-stack platform to help students analyze resumes, generate personalized learning roadmaps, prepare for interviews, and track placement readiness.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend   | Flask, SQLAlchemy, Flask-JWT-Extended           |
| AI        | Google Gemini API                               |
| Database  | PostgreSQL (Neon)                               |
| Deploy    | Vercel (frontend) + Render (backend)            |

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (local or Neon free tier)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Copy env file and fill in values
copy .env.example .env

# Run the server
python app.py
```

Backend runs at: http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

### Seed Database

After starting the backend (which auto-creates tables):

```bash
cd backend
python database/seed.py
```

## API Endpoints

| Method | Endpoint              | Description          | Auth |
|--------|-----------------------|----------------------|------|
| POST   | /api/auth/register    | Create account       | No   |
| POST   | /api/auth/login       | Login                | No   |
| GET    | /api/auth/me          | Get current user     | Yes  |
| POST   | /api/auth/logout      | Logout               | Yes  |
| GET    | /api/health           | Health check         | No   |

More endpoints added in Phase 2+.

## Project Structure

```
interviewpilot/
├── backend/
│   ├── app.py              # App factory
│   ├── config.py           # Config classes
│   ├── models/             # SQLAlchemy models
│   ├── routes/             # Flask blueprints
│   ├── services/           # Business logic (Phase 2+)
│   ├── utils/              # Helpers
│   ├── database/           # DB init + seed scripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route-level components
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # React context (Auth)
│   │   └── utils/          # API client
│   └── package.json
└── README.md
```

## License

MIT
