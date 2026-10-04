from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException

from config import settings
from database.db import init_db
from routes.auth import router as auth_router
from routes.resume import router as resume_router
from routes.roles import router as roles_router
from routes.roadmap import router as roadmap_router
from routes.interview import router as interview_router
from routes.companies import router as companies_router
from routes.code import router as code_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield

app = FastAPI(
    title="InterviewPilot API",
    description="Production-grade AI Placement Coach API powered by FastAPI and Groq",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global validation error handler matching the frontend's expected { "success": False, "errors": [...] }
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        msg = err.get("msg", "Invalid value")
        errors.append(f"{field}: {msg}" if field else msg)
    return JSONResponse(
        status_code=422,
        content={"success": False, "errors": errors}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "errors" in exc.detail:
        content = exc.detail
    elif isinstance(exc.detail, list):
        content = {"success": False, "errors": exc.detail}
    elif isinstance(exc.detail, str):
        content = {"success": False, "errors": [exc.detail]}
    else:
        content = {"success": False, "errors": [str(exc.detail)]}
    return JSONResponse(status_code=exc.status_code, content=content)

# Register API Routers
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(roles_router)
app.include_router(roadmap_router)
app.include_router(interview_router)
app.include_router(companies_router)
app.include_router(code_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "InterviewPilot API",
        "version": "3.0.0",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "3.0.0", "framework": "FastAPI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
