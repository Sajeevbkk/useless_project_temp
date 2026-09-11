from ..models import CharacterState, MoodAnalysis

class MoodEngine:
    def __init__(self):
        self.state = self.get_initial_state()

    def get_initial_state(self) -> CharacterState:
        return CharacterState(
            currentMood="normal",
            moodIntensity=0.5,
            energy=0.7,
            patience=0.85,
            conversationEnergy=0.7,
            angerLevel=0.0,
            sadnessLevel=0.0,
            lastMood="normal",
            messageCount=0,
            ignoredMessages=0,
            typingStyle="normal",
        )

    def get_state(self) -> CharacterState:
        return self.state.model_copy()

    def reset_state(self) -> CharacterState:
        self.state = self.get_initial_state()
        return self.get_state()

    def override_mood(self, mood: str, intensity: float = 0.85) -> CharacterState:
        self.state.lastMood = self.state.currentMood
        self.state.currentMood = mood
        self.state.moodIntensity = min(1.0, max(0.1, intensity))

        if mood == 'happy':
            self.state.energy = 0.95
            self.state.patience = 0.9
            self.state.angerLevel = 0.0
            self.state.sadnessLevel = 0.0
            self.state.typingStyle = 'excited'
        elif mood == 'sad':
            self.state.energy = 0.25
            self.state.sadnessLevel = 0.85
            self.state.angerLevel = 0.0
            self.state.typingStyle = 'slow'
        elif mood == 'angry':
            self.state.energy = 0.4
            self.state.patience = 0.2
            self.state.angerLevel = 0.85
            self.state.typingStyle = 'slow'
        elif mood == 'mother':
            self.state.energy = 0.75
            self.state.patience = 0.95
            self.state.angerLevel = 0.0
            self.state.typingStyle = 'normal'
        elif mood == 'drama':
            self.state.energy = 0.85
            self.state.patience = 0.6
            self.state.typingStyle = 'dramatic'
        elif mood == 'curious':
            self.state.energy = 0.8
            self.state.patience = 0.85
            self.state.typingStyle = 'normal'
        elif mood == 'tired':
            self.state.energy = 0.2
            self.state.patience = 0.4
            self.state.typingStyle = 'slow'
        else:
            self.state.energy = 0.7
            self.state.patience = 0.85
            self.state.typingStyle = 'normal'

        return self.get_state()

    def update_state(self, analysis: MoodAnalysis) -> CharacterState:
        prev = self.state
        target_mood = analysis.mood
        message_count = prev.messageCount + 1

        new_mood = target_mood
        anger_level = prev.angerLevel
        sadness_level = prev.sadnessLevel
        ignored_messages = prev.ignoredMessages

        # Emotional inertia: if high anger, do not snap instantly to happy
        if prev.currentMood == 'angry' and anger_level > 0.6:
            if target_mood == 'happy':
                new_mood = 'drama'
                anger_level = max(0.2, anger_level - 0.35)
            elif target_mood == 'angry':
                anger_level = min(1.0, anger_level + 0.15)
                ignored_messages += 1
            else:
                anger_level = max(0.1, anger_level - 0.2)
        elif target_mood == 'angry':
            anger_level = min(1.0, (anger_level or 0.4) + 0.3)
            if analysis.shouldIgnore:
                ignored_messages += 1
        else:
            anger_level = max(0.0, anger_level - 0.25)
            if anger_level == 0:
                ignored_messages = 0

        # Sadness inertia
        if target_mood == 'sad':
            sadness_level = min(1.0, analysis.intensity)
        else:
            sadness_level = max(0.0, sadness_level - 0.3)

        # Smooth intensity, energy, patience
        smoothed_intensity = round(min(1.0, max(0.1, prev.moodIntensity * 0.3 + analysis.intensity * 0.7)), 2)
        energy = round(min(1.0, max(0.1, prev.energy * 0.3 + analysis.energy * 0.7)), 2)
        patience = round(min(1.0, max(0.1, prev.patience * 0.4 + analysis.patience * 0.6)), 2)

        # Typing style
        typing_style = analysis.typingStyle
        if new_mood == 'happy' and smoothed_intensity > 0.8:
            typing_style = 'excited'
        elif new_mood in ('sad', 'tired', 'angry'):
            typing_style = 'slow'
        elif new_mood == 'drama':
            typing_style = 'dramatic'

        self.state = CharacterState(
            currentMood=new_mood,
            moodIntensity=smoothed_intensity,
            energy=energy,
            patience=patience,
            conversationEnergy=round(analysis.energy, 2),
            angerLevel=round(anger_level, 2),
            sadnessLevel=round(sadness_level, 2),
            lastMood=prev.currentMood,
            messageCount=message_count,
            ignoredMessages=ignored_messages,
            typingStyle=typing_style,
        )

        return self.get_state()

mood_engine = MoodEngine()
