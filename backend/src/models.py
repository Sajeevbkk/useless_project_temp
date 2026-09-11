from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field

MoodType = Literal[
    'happy',
    'sad',
    'angry',
    'mother',
    'drama',
    'normal',
    'curious',
    'tired'
]

ResponseLength = Literal['very_short', 'short', 'medium', 'long']
TypingStyle = Literal['normal', 'excited', 'slow', 'dramatic', 'playful']
ReactionType = Literal[
    'laugh',
    'love',
    'sad',
    'angry',
    'eye_roll',
    'shock',
    'thinking',
    'sleepy',
    'care',
    'dramatic'
]

MOOD_EMOJIS: Dict[str, str] = {
    'happy': '😊',
    'sad': '😔',
    'angry': '😤',
    'mother': '🥰',
    'drama': '🙄',
    'normal': '🙂',
    'curious': '🤔',
    'tired': '😴',
}

REACTION_EMOJIS: Dict[str, str] = {
    'laugh': '😂',
    'love': '❤️',
    'sad': '😢',
    'angry': '💢',
    'eye_roll': '🙄',
    'shock': '😱',
    'thinking': '💡',
    'sleepy': '💤',
    'care': '🫂',
    'dramatic': '🎭',
}

class CharacterState(BaseModel):
    currentMood: str = "normal"
    moodIntensity: float = Field(default=0.5, ge=0.0, le=1.0)
    energy: float = Field(default=0.7, ge=0.0, le=1.0)
    patience: float = Field(default=0.85, ge=0.0, le=1.0)
    conversationEnergy: float = Field(default=0.7, ge=0.0, le=1.0)
    angerLevel: float = Field(default=0.0, ge=0.0, le=1.0)
    sadnessLevel: float = Field(default=0.0, ge=0.0, le=1.0)
    lastMood: str = "normal"
    messageCount: int = 0
    ignoredMessages: int = 0
    typingStyle: str = "normal"

class MoodAnalysis(BaseModel):
    mood: str
    intensity: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    responseLength: str
    energy: float = Field(ge=0.0, le=1.0)
    patience: float = Field(ge=0.0, le=1.0)
    shouldIgnore: bool = False
    typingStyle: str
    reaction: str

class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    mood: Optional[str] = None
    moodIntensity: Optional[float] = None
    reaction: Optional[str] = None

class AssistantMessage(BaseModel):
    role: str = "assistant"
    content: str

class MoodInfo(BaseModel):
    name: str
    intensity: float
    emoji: str

class ChatResponse(BaseModel):
    reply: Optional[str] = None
    message: AssistantMessage
    assistantMessage: Optional[ChatMessage] = None
    mood: MoodInfo
    typingStyle: str
    reaction: str
    characterState: CharacterState
    model: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    modeOverride: Optional[str] = None
    characterName: Optional[str] = "Mira"
