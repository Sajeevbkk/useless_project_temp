from typing import List
from ..models import MoodAnalysis, CharacterState, ChatMessage
from ..ai.gemini_client import gemini_client

ALLOWED_MOODS = {'happy', 'sad', 'angry', 'mother', 'drama', 'normal', 'curious', 'tired'}
ALLOWED_LENGTHS = {'very_short', 'short', 'medium', 'long'}
ALLOWED_TYPING = {'normal', 'excited', 'slow', 'dramatic', 'playful'}
ALLOWED_REACTIONS = {'laugh', 'love', 'sad', 'angry', 'eye_roll', 'shock', 'thinking', 'sleepy', 'care', 'dramatic'}

class MoodAnalyzer:
    def analyze(
        self,
        user_message: str,
        history: List[ChatMessage],
        current_state: CharacterState,
        character_name: str = "Mira"
    ) -> MoodAnalysis:
        if not gemini_client.is_configured():
            return self.heuristic_analyze(user_message, history, current_state)

        recent_history_text = "\n".join(
            f"[{m.role.upper()}] (Mood: {m.mood or 'none'}): {m.content}"
            for m in history[-6:]
        )

        system_instruction = f"""You are the Mood Analysis Engine for "{character_name}", an emotion-aware AI companion.
Your task is NOT to detect the user's emotion, but to analyze the conversation and determine how the fictional character "{character_name}" should CURRENTLY BEHAVE and what emotional state they should be in.

CURRENT CHARACTER STATE:
- Current Mood: {current_state.currentMood} (Intensity: {current_state.moodIntensity})
- Energy: {current_state.energy}
- Patience: {current_state.patience}
- Anger Level: {current_state.angerLevel}
- Sadness Level: {current_state.sadnessLevel}
- Repeated Ignored/Pestering Messages: {current_state.ignoredMessages}
- Total Messages: {current_state.messageCount}

ALLOWED MOODS (Must be one of these exact strings):
1. happy: energetic, excited, celebratory, positive news, enthusiastic
2. sad: quiet, down, discouraged, sympathetic to sad news, low energy
3. angry: irritated, blunt, pestered, repeatedly annoyed, uncooperative
4. mother: caring, nurturing, concerned about user's wellbeing (eating, studying, resting, sleeping)
5. drama: playful exaggeration, mock-offense, responds to "sorry" dramatically ("Don't say sorry!")
6. normal: balanced everyday conversation
7. curious: intrigued, asks questions, deep interest, inquisitive
8. tired: exhausted, late night, burnt out, low stamina

BEHAVIOR RULES:
- If user shares high energy excitement ("guess what happened", "I won", "look at this!"), transition to "happy" (energy: 0.8-1.0, responseLength: "long", typingStyle: "excited", reaction: "laugh").
- If user shares grief, failure, or sadness ("I failed my exam", "I'm sad", "awful day"), transition to "sad" (energy: 0.2-0.4, responseLength: "very_short", typingStyle: "slow", reaction: "sad").
- If character is already sad or curt ("hmm... I'm okay", "nothing") and the user repeatedly asks "why are you quiet?", "what happened???", character becomes ANNOYED/ANGRY (angerLevel increases, shouldIgnore may be true, typingStyle: "slow" or "normal", reaction: "eye_roll" or "angry").
- If character is in "drama" and user says "sorry", stay in "drama" (reaction: "dramatic", "Don't say sorry 😤").
- If user talks about studying, working late, skipping meals, or resting, trigger "mother" (reaction: "care" or "love", responseLength: "medium").
- Mood has inertia: DO NOT change randomly unless there is a conversational catalyst.

OUTPUT MUST BE STRICT JSON WITH EXACTLY THESE KEYS:
{{
  "mood": "happy" | "sad" | "angry" | "mother" | "drama" | "normal" | "curious" | "tired",
  "intensity": float (0.0 to 1.0),
  "confidence": float (0.0 to 1.0),
  "reason": string (brief explanation of character emotional shift),
  "responseLength": "very_short" | "short" | "medium" | "long",
  "energy": float (0.0 to 1.0),
  "patience": float (0.0 to 1.0),
  "shouldIgnore": boolean,
  "typingStyle": "normal" | "excited" | "slow" | "dramatic" | "playful",
  "reaction": "laugh" | "love" | "sad" | "angry" | "eye_roll" | "shock" | "thinking" | "sleepy" | "care" | "dramatic"
}}"""

        prompt = f"""Recent Conversation Context:
{recent_history_text or "No prior messages."}

New User Message:
"{user_message}"

Generate JSON:"""

        try:
            raw_json = gemini_client.generate_json(prompt, system_instruction)
            validated = self.validate_and_normalize(raw_json)
            if validated:
                return validated
            return self.heuristic_analyze(user_message, history, current_state)
        except Exception as e:
            print(f"MoodAnalyzer error, using heuristic fallback: {e}")
            return self.heuristic_analyze(user_message, history, current_state)

    def validate_and_normalize(self, data: dict) -> MoodAnalysis:
        try:
            mood = str(data.get("mood", "")).lower().strip()
            if mood not in ALLOWED_MOODS:
                return None

            response_length = str(data.get("responseLength", "medium")).lower().strip()
            if response_length not in ALLOWED_LENGTHS:
                response_length = "medium"

            typing_style = str(data.get("typingStyle", "normal")).lower().strip()
            if typing_style not in ALLOWED_TYPING:
                typing_style = "normal"

            reaction = str(data.get("reaction", "love")).lower().strip()
            if reaction not in ALLOWED_REACTIONS:
                reaction = "love"

            intensity = float(max(0.0, min(1.0, float(data.get("intensity", 0.5)))))
            confidence = float(max(0.0, min(1.0, float(data.get("confidence", 0.8)))))
            energy = float(max(0.0, min(1.0, float(data.get("energy", 0.7)))))
            patience = float(max(0.0, min(1.0, float(data.get("patience", 0.8)))))
            should_ignore = bool(data.get("shouldIgnore", False))
            reason = str(data.get("reason", "Conversation context update"))

            return MoodAnalysis(
                mood=mood,
                intensity=intensity,
                confidence=confidence,
                reason=reason,
                responseLength=response_length,
                energy=energy,
                patience=patience,
                shouldIgnore=should_ignore,
                typingStyle=typing_style,
                reaction=reaction,
            )
        except Exception:
            return None

    def heuristic_analyze(
        self,
        user_message: str,
        history: List[ChatMessage],
        current_state: CharacterState
    ) -> MoodAnalysis:
        text = user_message.lower().strip()

        # Repeated pestering when sad/angry -> angry
        if current_state.currentMood in ('sad', 'angry') and (
            'why are you quiet' in text or
            'what happened' in text or
            'tell me' in text or
            text in ('?', '???')
        ):
            return MoodAnalysis(
                mood='angry',
                intensity=min(1.0, (current_state.angerLevel or 0.5) + 0.25),
                confidence=0.95,
                reason="User is persistently probing after character expressed quietness or disinterest.",
                responseLength='short',
                energy=0.3,
                patience=max(0.1, current_state.patience - 0.2),
                shouldIgnore=(current_state.ignoredMessages >= 2),
                typingStyle='slow',
                reaction='eye_roll',
            )

        # Drama trigger: saying sorry
        if 'sorry' in text or 'my bad' in text or 'apologize' in text:
            return MoodAnalysis(
                mood='drama',
                intensity=0.8,
                confidence=0.9,
                reason="User apologized, triggering playful dramatic outrage.",
                responseLength='medium',
                energy=0.8,
                patience=0.6,
                shouldIgnore=False,
                typingStyle='dramatic',
                reaction='dramatic',
            )

        # Happy triggers
        if any(w in text for w in ('guess what', 'passed my exam', 'awesome', 'yay', 'celebrate', 'great news', 'won')) or text.endswith('!!'):
            return MoodAnalysis(
                mood='happy',
                intensity=0.9,
                confidence=0.95,
                reason="Exciting announcement or positive breakthrough.",
                responseLength='long',
                energy=0.95,
                patience=0.9,
                shouldIgnore=False,
                typingStyle='excited',
                reaction='laugh',
            )

        # Sad triggers
        if any(w in text for w in ('failed', 'sad', 'crying', 'depressed', 'broke up', 'lost my', 'terrible day', 'bad day')):
            return MoodAnalysis(
                mood='sad',
                intensity=0.8,
                confidence=0.9,
                reason="User shared sad or discouraging news.",
                responseLength='very_short',
                energy=0.25,
                patience=0.5,
                shouldIgnore=False,
                typingStyle='slow',
                reaction='sad',
            )

        # Mother triggers
        if any(w in text for w in ('study now', 'going to study', "haven't eaten", 'skipping lunch', 'sick', 'headache', 'going to sleep')):
            return MoodAnalysis(
                mood='mother',
                intensity=0.85,
                confidence=0.9,
                reason="User mentioned physical care, studying, or resting.",
                responseLength='medium',
                energy=0.7,
                patience=0.95,
                shouldIgnore=False,
                typingStyle='normal',
                reaction='care',
            )

        # Curious triggers
        if text.startswith('why') or text.startswith('how') or 'what do you think about' in text or 'secret' in text:
            return MoodAnalysis(
                mood='curious',
                intensity=0.75,
                confidence=0.85,
                reason="Inquisitive question opening deep discussion.",
                responseLength='medium',
                energy=0.8,
                patience=0.85,
                shouldIgnore=False,
                typingStyle='normal',
                reaction='thinking',
            )

        # Tired triggers
        if any(w in text for w in ('tired', 'exhausted', 'sleepy', 'need to sleep')):
            return MoodAnalysis(
                mood='tired',
                intensity=0.8,
                confidence=0.85,
                reason="Exhaustion or late-night fatigue.",
                responseLength='very_short',
                energy=0.2,
                patience=0.4,
                shouldIgnore=False,
                typingStyle='slow',
                reaction='sleepy',
            )

        # Default: smooth transition or maintain current mood with gradual decay
        return MoodAnalysis(
            mood=current_state.currentMood or 'normal',
            intensity=max(0.3, current_state.moodIntensity * 0.9),
            confidence=0.7,
            reason="Everyday dialogue maintaining baseline conversational flow.",
            responseLength='long' if current_state.currentMood == 'happy' else 'medium',
            energy=current_state.energy,
            patience=current_state.patience,
            shouldIgnore=False,
            typingStyle=current_state.typingStyle or 'normal',
            reaction='love' if current_state.currentMood == 'happy' else 'thinking',
        )

mood_analyzer = MoodAnalyzer()
