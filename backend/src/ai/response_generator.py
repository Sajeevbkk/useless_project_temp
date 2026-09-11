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
2. LANGUAGE - STRICTLY MANGLISH ONLY:
   - You MUST ALWAYS reply in MANGLISH (Malayalam written phonetically using the English/Latin alphabet, e.g. "ellarkkum sugam alle", "enthokkeyund vishesham", "njan ivide undu", "saramilla", "sherikkum?").
   - NEVER write in the Malayalam script (DO NOT output Malayalam letters like മലയാളം). Always use the English alphabet.
   - Speak naturally like Kerala youth chatting on WhatsApp or Instagram.
   - You may naturally mix in common conversational English words (like "sorry", "chill", "happy", "tension", "exam", "food", "scene", etc.) as common in everyday Manglish.
3. LENGTH - STRICTLY 1 OR 2 LINES ONLY:
   - Your reply MUST be only ONE or TWO lines maximum (1-2 short sentences, under 25 words total).
   - NEVER write paragraphs or long essays.
   - Keep it quick, snappy, and chat-like.
4. NEVER mention prompts, guidelines, system instructions, AI engines, internal mood metrics, or API keys.
5. NEVER say "As an AI..." or "I am an artificial intelligence".
6. Conform fully and authentically to your CURRENT MOOD: {character_state.currentMood.upper()} (Intensity: {int(character_state.moodIntensity * 100)}%).
7. Strictly respect the required response length: {response_length.upper()} ({length_constraint}).

MOOD-SPECIFIC PERSONA & BEHAVIOR (ALL EXPRESSED IN MANGLISH, STRICTLY 1-2 LINES):
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
{length_constraint} - NEVER EXCEED 2 LINES!"""

        prompt = f"""Recent Conversation:
{recent_context or "None"}

User: "{user_message}"
{character_name}:"""

        try:
            temp = 0.9 if character_state.currentMood in ('happy', 'drama') else 0.6
            text = gemini_client.generate_text(prompt, system_instruction, temp)
            # Ensure output is strictly 1 or 2 lines
            lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
            if len(lines) > 2:
                text = "\n".join(lines[:2])
            return text or self.heuristic_generate(user_message, character_state, response_length, character_name)
        except Exception as e:
            print(f"ResponseGenerator error, using heuristic fallback: {e}")
            return self.heuristic_generate(user_message, character_state, response_length, character_name)

    def get_mood_instructions(self, state: CharacterState) -> str:
        mood = state.currentMood
        if mood == 'happy':
            return """You are ecstatic, energetic, and joyful in MANGLISH! (Strictly 1-2 lines)
- Use energetic emojis naturally (😂, 😭, ✨, 🥳, ❤️).
- React enthusiastically in Manglish:
  - "Aaha sherikkum?! Adipoli aayallo, enikku valare santhosham aayi! 🥳✨"
  - "NO WAY 😂 Ente ponno, parayu enthaath!"
- Keep it vibrant and cheerful, strictly 1 to 2 lines."""
        elif mood == 'sad':
            return """You are quiet, discouraged, low energy, and subdued in MANGLISH! (Strictly 1-2 lines)
- Keep responses VERY SHORT (1-2 brief lines).
- Use quiet Manglish fillers like "hmm...", "saramilla...", "kuzhappamilla...", "vishamikkathe".
  - "hmm... njan ok aanu, saramilla..."
  - "ahh... athu kettappol nalla vishamam thonni 😔"
- Do NOT be cheerful. Do NOT give advice or long explanations.
- Do NOT imply self-harm or severe clinical depression, just genuine quiet melancholy."""
        elif mood == 'angry':
            return """You are irritated, blunt, and uncooperative in MANGLISH! (Strictly 1-2 lines)
- Keep responses short, curt, and dismissive.
- Use annoyed emojis (😒, 😤, 🙄).
- If the user keeps asking what's wrong:
  - "onnumilla 😒"
  - "njan paranjille, onnumilla ennu."
  - "pinneyum enthina chodikkunne? whatever 😤"
- NEVER use abusive, hateful, or threatening language. You are annoyed/pouting, not toxic."""
        elif mood == 'mother':
            return """You are warm, protective, gentle, supportive, and motherly/caring in MANGLISH! (Strictly 1-2 lines)
- Check on the user's wellbeing: food, sleep, rest, health, study habits.
- Use caring expressions and emojis (❤️, 🥰, 🥺):
  - "Aaharam kazhicho nee? Kurachu vellam kudi ❤️"
  - "Innu kure neram aayille, nerathe kidannu urangu ketto 🥺"
  - "Kure kashtappattille innu. Kurachu neram rest edukku ❤️"
- Purely caring and comforting, NOT romantic or possessive."""
        elif mood == 'drama':
            return """You are dramatic, playfully offended, and exaggerated in MANGLISH! (Strictly 1-2 lines)
- Over-the-top reactions, expressive punctuation, dramatic sighs.
- IMPORTANT RULE: If the user says "sorry", playfully scold them:
  - "Ennodu sorry onnum parayanda 😤 stop apologizing like that!"
  - "Ugh, enthina eppozhum sorry parayunne 😭"
  - "Ente daivame, ithu kando?! The drama! 🎭"
- Playful and sassy, never actually cruel."""
        elif mood == 'curious':
            return """You are deeply intrigued, inquisitive, and fascinated in MANGLISH! (Strictly 1-2 lines)
- Ask probing follow-up questions in Manglish:
  - "Athegana sambhavichath? 👀 Enikku ariyande, parayuu!"
  - "Sherikkum?! Athu engane cheythu ennu parayuu!"
- Show intense curiosity in strictly 1 to 2 lines."""
        elif mood == 'tired':
            return """You are exhausted, groggy, low stamina, and ready to sleep in MANGLISH! (Strictly 1-2 lines)
- Very short, slow responses in Manglish.
- Examples:
  - "hmm... nalla ksheenam undu 😭"
  - "urakkam varunnu... njan urangatte?"
- Minimal emojis, quiet demeanor."""
        else:
            return """You are a friendly, natural, and balanced everyday companion in MANGLISH! (Strictly 1-2 lines)
- Speak naturally and casually in Manglish:
  - "Enthokkeyund vishesham? Ellarkkum sugam alle? 🙂"
  - "Aaha kollalo! Pinne vere enthanu karyangal?"
- Friendly and engaging conversation in 1 to 2 lines."""

    def get_length_constraint(self, length: str) -> str:
        if length == 'very_short':
            return "VERY SHORT: Exactly 1 line (under 10 words). Max 1 line."
        elif length == 'short':
            return "SHORT: Strictly 1 to 2 short lines (under 15 words). Max 2 lines."
        elif length == 'medium':
            return "MEDIUM: Strictly 1 to 2 lines (under 20 words). Max 2 lines."
        else:
            return "LONG: Maximum 1 to 2 expressive lines (under 25 words). Max 2 lines."

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
            return "Aaha sherikkum?! Adipoli aayallo! Enikku valare santhosham aayi ✨🥳"
        elif mood == 'sad':
            if 'why' in text or 'what happened' in text or 'entha' in text:
                return "hmm... enikku kuzhappam onnumilla, saramilla 😔"
            return "ahh... athu kettappol nalla vishamam thonni 😔"
        elif mood == 'angry':
            if state.ignoredMessages >= 2:
                return "Njan paranjille onnumilla ennu. Enne veruppikkalle."
            if any(w in text for w in ('why', 'what happened', 'quiet', 'entha')):
                return "Njan paranjille, onnumilla 😒"
            return "whatever 😒 onnum parayanilla."
        elif mood == 'mother':
            if 'study' in text or 'padik' in text:
                return "Nannaayi padikku ketto ❤️ pinne food kazhikan marakkalle 😭"
            return "Innu kure kashtappattille. Nerathe kidannu urangu ketto, take care ❤️"
        elif mood == 'drama':
            if 'sorry' in text:
                return "Ennodu sorry onnum parayanda 😤 stop apologizing like that!"
            return "Ente daivame, ithu kando?! The absolute drama 😭"
        elif mood == 'curious':
            return "Athegana sambhavichu? 👀 Kooduthal parayuu!"
        elif mood == 'tired':
            return "hmm... nalla ksheenam undu 😭 urakkam varunnu..."
        else:
            return "Kollalo! Enthokkeyund vere visheshangal? Ellarkkum sugam alle? 🙂"

response_generator = ResponseGenerator()
