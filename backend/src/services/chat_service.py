import time
import uuid
import random
from datetime import datetime
from typing import Optional, Dict, Any, List

from ..models import (
    ChatResponse,
    AssistantMessage,
    MoodInfo,
    ChatMessage,
    CharacterState,
    MoodAnalysis,
    MOOD_EMOJIS,
)
from ..mood.mood_analyzer import mood_analyzer
from ..mood.mood_engine import mood_engine
from ..ai.response_generator import response_generator
from ..memory.conversation_memory import conversation_memory
from ..memory.character_memory import character_memory
from ..ai.gemini_client import gemini_client

class ChatService:
    def process_message(
        self,
        content: str,
        mode_override: Optional[str] = None,
        custom_character_name: Optional[str] = None
    ) -> ChatResponse:
        trimmed = content.strip()
        if not trimmed:
            raise ValueError("Message content cannot be empty.")

        if custom_character_name:
            character_memory.set_name(custom_character_name)
        character_name = character_memory.get_name()

        # 1. Store User Message
        user_msg = ChatMessage(
            id=f"usr_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}",
            role="user",
            content=trimmed,
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
        conversation_memory.add_message(user_msg)

        history = conversation_memory.get_messages()
        current_state = mood_engine.get_state()

        # 2. Analyze Mood (or Force Override)
        if mode_override and mode_override.lower() in MOOD_EMOJIS:
            forced = mode_override.lower()
            state = mood_engine.override_mood(forced)
            analysis = MoodAnalysis(
                mood=forced,
                intensity=state.moodIntensity,
                confidence=1.0,
                reason="Manually forced mode override by user/developer.",
                responseLength='long' if forced == 'happy' else 'very_short' if forced in ('sad', 'tired') else 'short' if forced == 'angry' else 'medium',
                energy=state.energy,
                patience=state.patience,
                shouldIgnore=False,
                typingStyle=state.typingStyle,
                reaction='laugh' if forced == 'happy' else 'sad' if forced == 'sad' else 'angry' if forced == 'angry' else 'care' if forced == 'mother' else 'dramatic' if forced == 'drama' else 'love',
            )
        else:
            analysis = mood_analyzer.analyze(trimmed, history, current_state, character_name)

        # 3. Update Character State via MoodEngine
        updated_state = mood_engine.update_state(analysis)

        # 4. Generate Response with Mood Persona & Length Control
        if updated_state.currentMood == 'angry' and updated_state.ignoredMessages >= 3 and random.random() < 0.4:
            response_text = "..."
        else:
            response_text = response_generator.generate(
                trimmed,
                history,
                updated_state,
                analysis.responseLength,
                character_name
            )

        # 5. Store Assistant Message
        assistant_msg = ChatMessage(
            id=f"ast_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}",
            role="assistant",
            content=response_text,
            timestamp=datetime.utcnow().isoformat() + "Z",
            mood=updated_state.currentMood,
            moodIntensity=updated_state.moodIntensity,
            reaction=analysis.reaction,
        )
        conversation_memory.add_message(assistant_msg)

        # Light fact extraction
        self._extract_facts(trimmed)

        # 6. Return Structured ChatResponse
        return ChatResponse(
            reply=response_text,
            message=AssistantMessage(
                role="assistant",
                content=response_text
            ),
            assistantMessage=assistant_msg,
            mood=MoodInfo(
                name=updated_state.currentMood,
                intensity=updated_state.moodIntensity,
                emoji=MOOD_EMOJIS.get(updated_state.currentMood, "🙂")
            ),
            typingStyle=updated_state.typingStyle,
            reaction=analysis.reaction,
            characterState=updated_state,
            model=gemini_client.get_model_name(),
            meta={
                "analysisReason": analysis.reason,
                "modelUsed": gemini_client.get_model_name(),
                "characterName": character_name
            }
        )

    def regenerate_last_response(self) -> Optional[ChatResponse]:
        last_assistant = conversation_memory.remove_last_assistant_message()
        if not last_assistant:
            return None

        history = conversation_memory.get_messages()
        last_user = next((m for m in reversed(history) if m.role == 'user'), None)
        if not last_user:
            return None

        character_name = character_memory.get_name()
        current_state = mood_engine.get_state()

        response_len = 'long' if current_state.currentMood == 'happy' else 'very_short' if current_state.currentMood in ('sad', 'tired') else 'medium'
        response_text = response_generator.generate(
            last_user.content,
            history,
            current_state,
            response_len,
            character_name
        )

        assistant_msg = ChatMessage(
            id=f"ast_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}",
            role="assistant",
            content=response_text,
            timestamp=datetime.utcnow().isoformat() + "Z",
            mood=current_state.currentMood,
            moodIntensity=current_state.moodIntensity,
            reaction=last_assistant.reaction or "love",
        )
        conversation_memory.add_message(assistant_msg)

        return ChatResponse(
            reply=response_text,
            message=AssistantMessage(
                role="assistant",
                content=response_text
            ),
            assistantMessage=assistant_msg,
            mood=MoodInfo(
                name=current_state.currentMood,
                intensity=current_state.moodIntensity,
                emoji=MOOD_EMOJIS.get(current_state.currentMood, "🙂")
            ),
            typingStyle=current_state.typingStyle,
            reaction=assistant_msg.reaction or "love",
            characterState=current_state,
            model=gemini_client.get_model_name(),
            meta={
                "analysisReason": "Regenerated response using active mood state.",
                "modelUsed": gemini_client.get_model_name(),
                "characterName": character_name
            }
        )

    def get_state(self) -> Dict[str, Any]:
        return {
            "characterState": mood_engine.get_state().model_dump(),
            "characterName": character_memory.get_name(),
            "messageCount": len(conversation_memory.get_messages()),
        }

    def reset(self) -> CharacterState:
        conversation_memory.clear()
        character_memory.clear()
        return mood_engine.reset_state()

    def reset_mood_only(self) -> CharacterState:
        return mood_engine.reset_state()

    def override_mood(self, mood: str) -> CharacterState:
        return mood_engine.override_mood(mood)

    def get_history(self) -> List[ChatMessage]:
        return conversation_memory.get_messages()

    def clear_history(self):
        conversation_memory.clear()

    def _extract_facts(self, text: str):
        lower = text.lower()
        if "my favorite movie is" in lower:
            part = text.split("my favorite movie is", 1)[1].split(".")[0].strip()
            if part:
                character_memory.remember_fact("favoriteMovie", part)
        if "my favorite game is" in lower:
            part = text.split("my favorite game is", 1)[1].split(".")[0].strip()
            if part:
                character_memory.remember_fact("favoriteGame", part)
        if "i am working on" in lower or "i'm working on" in lower:
            token = "i am working on" if "i am working on" in lower else "i'm working on"
            part = text.split(token, 1)[1].split(".")[0].strip()
            if part:
                character_memory.remember_fact("currentProject", part)

chat_service = ChatService()
