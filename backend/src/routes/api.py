from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..models import ChatRequest, ChatResponse, CharacterState
from ..services.chat_service import chat_service
from ..memory.character_memory import character_memory
from ..ai.gemini_client import gemini_client

router = APIRouter(prefix="/api")

class MoodOverrideRequest(BaseModel):
    mood: str

class NameUpdateRequest(BaseModel):
    name: str

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "MOOD AI FastAPI Server",
        "geminiConfigured": gemini_client.is_configured(),
        "model": gemini_client.get_model_name(),
    }

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response = chat_service.process_message(
            request.message,
            request.modeOverride,
            request.characterName
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/state")
def get_state():
    return chat_service.get_state()

@router.post("/reset")
def reset_all():
    state = chat_service.reset()
    return {"message": "Character state and conversation history reset.", "state": state.model_dump()}

@router.post("/reset-mood")
def reset_mood():
    state = chat_service.reset_mood_only()
    return {"message": "Character mood reset to normal.", "state": state.model_dump()}

@router.post("/regenerate", response_model=ChatResponse)
def regenerate():
    res = chat_service.regenerate_last_response()
    if not res:
        raise HTTPException(status_code=400, detail="No prior message to regenerate.")
    return res

@router.get("/history")
def get_history():
    return {"history": [m.model_dump() for m in chat_service.get_history()]}

@router.delete("/history")
def clear_history():
    chat_service.clear_history()
    return {"message": "Conversation history cleared."}

@router.post("/mood/override")
def override_mood(req: MoodOverrideRequest):
    valid_moods = {'happy', 'sad', 'angry', 'mother', 'drama', 'normal', 'curious', 'tired'}
    if req.mood.lower() not in valid_moods:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Allowed: {sorted(list(valid_moods))}")

    state = chat_service.override_mood(req.mood.lower())
    return {"message": f"Mood forced to {req.mood}", "state": state.model_dump()}

@router.post("/settings/name")
def update_name(req: NameUpdateRequest):
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    character_memory.set_name(req.name)
    return {"message": "Character name updated.", "name": character_memory.get_name()}
