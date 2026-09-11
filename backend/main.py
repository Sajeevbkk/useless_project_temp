import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from src.routes.api import router as api_router
from src.ai.gemini_client import gemini_client

app = FastAPI(
    title="MOOD AI — Emotion-Aware AI Chatbot Backend",
    description="FastAPI backend with Google Gemini AI persistent mood engine",
    version="2.0.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "MOOD AI Backend API",
        "docs": "/docs",
        "geminiConfigured": gemini_client.is_configured(),
    }

@app.get("/health")
def read_health():
    return {
        "status": "healthy",
        "geminiConfigured": gemini_client.is_configured(),
        "model": gemini_client.get_model_name(),
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
