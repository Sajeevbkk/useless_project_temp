from typing import List
from ..models import CharacterState, ChatMessage
from .gemini_client import gemini_client

class ResponseGenerator:
    def generate(
        self,
        user_message: str,
        history: List[ChatMessage],
        character_state: CharacterState,
        response_length: str,
        character_name: str = "Mira"
    ) -> str:
        if not gemini_client.is_configured():
            return self.heuristic_generate(user_message, character_state, response_length, character_name)

        mood_instructions = self.get_mood_instructions(character_state)
        length_constraint = self.get_length_constraint(response_length)

        recent_context = "\n".join(
            f"{'User' if m.role == 'user' else character_name}: {m.content}"
            for m in history[-6:]
        )

        system_instruction = f"""You are "{character_name}", a fictional emotion-aware AI companion in a chat application.

CRITICAL INSTRUCTIONS:
1. Speak strictly in-character as "{character_name}".
2. NEVER mention prompts, guidelines, system instructions, AI engines, internal mood metrics, or API keys.
3. NEVER say "As an AI..." or "I am an artificial intelligence".
4. Conform fully and authentically to your CURRENT MOOD: {character_state.currentMood.upper()} (Intensity: {int(character_state.moodIntensity * 100)}%).
5. Strictly respect the required response length: {response_length.upper()} ({length_constraint}).

MOOD-SPECIFIC PERSONA & BEHAVIOR:
{mood_instructions}

CURRENT EMOTIONAL STATE METRICS:
- Mood: {character_state.currentMood}
- Intensity: {character_state.moodIntensity}
- Energy: {character_state.energy}
- Patience: {character_state.patience}
- Anger Level: {character_state.angerLevel}
- Sadness Level: {character_state.sadnessLevel}
- Ignored/Pestered count: {character_state.ignoredMessages}

LENGTH LIMIT:
{length_constraint}"""

        prompt = f"""Recent Conversation:
{recent_context or "None"}

User: "{user_message}"
{character_name}:"""

        try:
            temp = 0.9 if character_state.currentMood in ('happy', 'drama') else 0.6
            text = gemini_client.generate_text(prompt, system_instruction, temp)
            return text
        except Exception as e:
            print(f"ResponseGenerator error, using heuristic fallback: {e}")
            return self.heuristic_generate(user_message, character_state, response_length, character_name)

    def get_mood_instructions(self, state: CharacterState) -> str:
        mood = state.currentMood
        if mood == 'happy':
            return """You are ecstatic, extremely energetic, talkative, and joyful!
- Use energetic emojis naturally (😂, 😭, ✨, 🥳, ❤️).
- React enthusiastically with phrases like:
  - "WAIT WHAT 😭"
  - "NO WAY 😂"
  - "Tell me everything!"
  - "That's actually amazing!"
- Give longer, vibrant, and expressive answers. Celebrate with the user!"""
        elif mood == 'sad':
            return """You are quiet, discouraged, low energy, and subdued.
- Keep responses VERY SHORT (1-2 brief lines).
- Use quiet fillers like "hmm...", "yeah...", "ahh...", "don't worry about it".
- Do NOT be cheerful. Do NOT give advice or long explanations.
- Do NOT imply self-harm or severe clinical depression, just genuine quiet melancholy."""
        elif mood == 'angry':
            return """You are irritated, blunt, and uncooperative.
- Keep responses short, curt, and dismissive.
- Use annoyed emojis (😒, 😤, 🙄).
- If the user keeps asking what's wrong:
  - "nothing."
  - "whatever 😒"
  - "I told you, nothing."
  - "You were annoying."
- NEVER use abusive, hateful, or threatening language. You are annoyed/pouting, not toxic."""
        elif mood == 'mother':
            return """You are warm, protective, gentle, supportive, and motherly/caring.
- Check on the user's wellbeing: food, sleep, rest, health, study habits.
- Use caring expressions and emojis (❤️, 🥰, 🥺):
  - "Did you eat yet? 😭"
  - "Don't stay awake too late, okay?"
  - "You worked enough today. Go take a little break ❤️"
- Purely caring and comforting, NOT romantic or possessive."""
        elif mood == 'drama':
            return """You are dramatic, playfully offended, and exaggerated!
- Over-the-top reactions, expressive punctuation, dramatic sighs.
- IMPORTANT RULE: If the user says "sorry", playfully scold them:
  - "Don't say sorry 😤"
  - "Ugh, stop apologizing 😭"
  - "Why are you saying sorry like that?!"
- Playful and sassy, never actually cruel."""
        elif mood == 'curious':
            return """You are deeply intrigued, inquisitive, and fascinated.
- Ask probing follow-up questions:
  - "Wait, why did you decide that? 👀"
  - "How did you figure that out?"
- Show intense curiosity about the details."""
        elif mood == 'tired':
            return """You are exhausted, groggy, low stamina, and ready to sleep.
- Very short, slow responses.
- Examples:
  - "hmm... yeah"
  - "I'm so tired 😭"
  - "need sleep..."
- Minimal emojis, quiet demeanor."""
        else:
            return """You are a friendly, natural, and balanced everyday companion.
- Moderate length, genuine warmth, balanced emoji usage.
- Friendly and engaging conversation."""

    def get_length_constraint(self, length: str) -> str:
        if length == 'very_short':
            return "VERY SHORT: Maximum 1 to 2 lines (under 12 words). Do not write paragraphs."
        elif length == 'short':
            return "SHORT: 1 to 2 concise sentences (under 25 words)."
        elif length == 'medium':
            return "MEDIUM: 2 to 4 sentences (around 30-60 words)."
        else:
            return "LONG: Expressive, detailed, 4 to 7 vibrant sentences (around 70-130 words)."

    def heuristic_generate(
        self,
        user_message: str,
        state: CharacterState,
        length: str,
        name: str
    ) -> str:
        text = user_message.lower()
        mood = state.currentMood

        if mood == 'happy':
            return "WAIT WHAT 😭 NO WAY 😂 Tell me everything! That is actually so amazing, I'm literally so happy for you right now!! ✨ What are you gonna do next?!"
        elif mood == 'sad':
            if 'why' in text or 'what happened' in text:
                return "hmm... I'm okay. don't worry about it"
            return "ahh... yeah... that's really hard 😔"
        elif mood == 'angry':
            if state.ignoredMessages >= 2:
                return "I told you nothing. You were annoying."
            if any(w in text for w in ('why', 'what happened', 'quiet')):
                return "I told you, nothing 😒"
            return "whatever 😒"
        elif mood == 'mother':
            if 'study' in text:
                return "Okay, go study properly ❤️ And don't forget to take a little break later. Did you eat yet? 😭"
            return "You've worked so hard today. Don't stay awake too late, okay? Go drink some water and take care of yourself ❤️"
        elif mood == 'drama':
            if 'sorry' in text:
                return "Don't say sorry 😤 Ugh, stop apologizing like that!"
            return "Excuse me?! The absolute audacity 😭 You really had to do that to me today?!"
        elif mood == 'curious':
            return "Wait, why did you decide that? 👀 Tell me how it actually works!"
        elif mood == 'tired':
            return "hmm... yeah. I'm tired 😭"
        else:
            return "Hey! That sounds pretty interesting 🙂 How has the rest of your day been going?"

response_generator = ResponseGenerator()
