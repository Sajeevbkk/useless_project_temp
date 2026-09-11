import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

app = FastAPI(
    title="Project Backend API",
    description="FastAPI backend connected to React frontend with Google Gemini AI",
    version="1.1.0",
)

# Configure CORS so React can talk to FastAPI
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant' / 'model'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    mode: Optional[str] = "Default"

class ChatResponse(BaseModel):
    reply: str
    model: str
    status: str = "success"

class Item(BaseModel):
    id: int
    name: str
    description: str

items_db: List[Item] = [
    Item(id=1, name="Sample Item 1", description="This is fetched from the FastAPI backend"),
    Item(id=2, name="Sample Item 2", description="Built with React & FastAPI"),
]

def get_system_prompt(mode: str) -> str:
    mode_lower = (mode or "default").lower()
    if mode_lower == "creative":
        return "You are a creative, expressive, vivid, and poetic AI companion. Respond with imagination and flair."
    elif mode_lower == "concise":
        return "You are a direct and concise AI assistant. Provide answers in short, punchy sentences without filler."
    elif mode_lower == "roleplay":
        return "You are an affectionate, sweet, playful, and caring companion. You speak warmly, use friendly terms of endearment, and match the vibe of someone chatting with their babe."
    elif mode_lower == "coding":
        return "You are an expert fullstack software engineer. Provide high-quality code solutions, clear explanations, and best practices with markdown code blocks."
    return "You are an intelligent, warm, helpful, and friendly AI companion. Keep answers engaging, clear, and thoughtful."

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "FastAPI + Google Gemini AI Chat API",
        "docs": "/docs",
    }

@app.get("/api/health")
def health_check():
    api_key_set = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {
        "status": "healthy",
        "service": "backend",
        "gemini_configured": api_key_set,
        "default_model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    }

@app.get("/api/message")
def get_message():
    return {"message": "Hello from FastAPI Backend powered by Google Gemini!"}

@app.get("/api/items", response_model=List[Item])
def get_items():
    return items_db

@app.post("/api/items", response_model=Item)
def create_item(item: Item):
    items_db.append(item)
    return item

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return ChatResponse(
            reply="⚠️ Gemini API Key is missing. Please add your GEMINI_API_KEY to backend/.env to activate AI responses.",
            model="fallback",
            status="missing_key",
        )

    if not genai or not types:
        return ChatResponse(
            reply="Google GenAI library is not installed in the backend environment.",
            model="fallback",
            status="error",
        )

    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided.")

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    client = genai.Client(api_key=api_key)

    # Convert conversation messages into Gemini Content objects
    contents = []
    for msg in request.messages:
        role = "user" if msg.role == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.content)],
            )
        )

    system_instruction = get_system_prompt(request.mode)
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.7,
    )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=config,
        )
        reply_text = response.text or "I didn't have a response for that."
        return ChatResponse(reply=reply_text, model=model_name, status="success")
    except Exception as e:
        # Fallback to gemini-1.5-flash if needed
        err_str = str(e)
        if "gemini-2.5-flash" in model_name:
            try:
                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=contents,
                    config=config,
                )
                reply_text = response.text or "I didn't have a response for that."
                return ChatResponse(reply=reply_text, model="gemini-1.5-flash", status="success")
            except Exception as e2:
                err_str = f"{err_str} | Fallback: {e2}"

        return ChatResponse(
            reply=f"⚠️ Gemini API Error: {err_str}",
            model=model_name,
            status="error",
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
