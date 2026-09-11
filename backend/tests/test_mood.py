import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models import MoodAnalysis, CharacterState
from src.mood.mood_analyzer import mood_analyzer, ALLOWED_MOODS
from src.mood.mood_engine import MoodEngine
from src.ai.response_generator import response_generator
from src.services.chat_service import chat_service

class TestMoodAI(unittest.TestCase):
    def test_mood_json_validation_valid(self):
        valid_dict = {
            "mood": "happy",
            "intensity": 0.85,
            "confidence": 0.91,
            "reason": "User shared great news.",
            "responseLength": "long",
            "energy": 0.9,
            "patience": 0.8,
            "shouldIgnore": False,
            "typingStyle": "excited",
            "reaction": "laugh",
        }
        validated = mood_analyzer.validate_and_normalize(valid_dict)
        self.assertIsNotNone(validated)
        self.assertEqual(validated.mood, "happy")
        self.assertEqual(validated.intensity, 0.85)

    def test_mood_json_validation_invalid(self):
        invalid_dict = {
            "mood": "unknown_super_excited",
            "intensity": 0.85,
        }
        validated = mood_analyzer.validate_and_normalize(invalid_dict)
        self.assertIsNone(validated)

    def test_mood_transitions_and_inertia(self):
        engine = MoodEngine()
        initial = engine.get_state()
        self.assertEqual(initial.currentMood, "normal")

        # Transition to happy
        analysis = MoodAnalysis(
            mood="happy",
            intensity=0.9,
            confidence=0.95,
            reason="Exciting announcement",
            responseLength="long",
            energy=0.95,
            patience=0.9,
            shouldIgnore=False,
            typingStyle="excited",
            reaction="laugh",
        )
        updated = engine.update_state(analysis)
        self.assertEqual(updated.currentMood, "happy")
        self.assertEqual(updated.lastMood, "normal")

    def test_angry_behavior_and_persistence(self):
        engine = MoodEngine()
        engine.override_mood("angry", 0.85)
        self.assertGreater(engine.get_state().angerLevel, 0.5)

        # A sudden happy message should NOT jump directly to happy on high anger (emotional inertia)
        happy_analysis = MoodAnalysis(
            mood="happy",
            intensity=0.9,
            confidence=0.8,
            reason="User sent a compliment",
            responseLength="long",
            energy=0.8,
            patience=0.5,
            shouldIgnore=False,
            typingStyle="excited",
            reaction="laugh",
        )
        updated = engine.update_state(happy_analysis)
        self.assertNotEqual(updated.currentMood, "happy", "Inertia must prevent immediate reset to pure happy")

    def test_sad_behavior(self):
        engine = MoodEngine()
        sad_analysis = mood_analyzer.heuristic_analyze(
            "I failed my exam and feel terrible",
            [],
            engine.get_state()
        )
        self.assertEqual(sad_analysis.mood, "sad")
        self.assertEqual(sad_analysis.responseLength, "very_short")
        self.assertLess(sad_analysis.energy, 0.5)

        sad_resp = response_generator.heuristic_generate(
            "why are you quiet?",
            CharacterState(currentMood="sad", moodIntensity=0.8),
            "very_short",
            "Mira"
        )
        self.assertTrue(len(sad_resp.split()) < 15, "Sad response must be very short")

    def test_mother_behavior(self):
        engine = MoodEngine()
        mother_analysis = mood_analyzer.heuristic_analyze(
            "I'm going to study now and skip dinner",
            [],
            engine.get_state()
        )
        self.assertEqual(mother_analysis.mood, "mother")
        self.assertEqual(mother_analysis.reaction, "care")

    def test_drama_behavior(self):
        engine = MoodEngine()
        drama_analysis = mood_analyzer.heuristic_analyze(
            "sorry about that",
            [],
            engine.get_state()
        )
        self.assertEqual(drama_analysis.mood, "drama")

        drama_resp = response_generator.heuristic_generate(
            "sorry",
            CharacterState(currentMood="drama", moodIntensity=0.8),
            "medium",
            "Mira"
        )
        self.assertIn("sorry", drama_resp.lower())

    def test_empty_message_validation(self):
        with self.assertRaises(ValueError):
            chat_service.process_message("   ")

    def test_heuristic_fallback_response(self):
        resp = response_generator.heuristic_generate(
            "guess what happened today!!",
            CharacterState(currentMood="happy", moodIntensity=0.9),
            "long",
            "Mira"
        )
        self.assertGreater(len(resp), 30)

    def test_manglish_and_length_constraint(self):
        for mood in ['happy', 'sad', 'angry', 'mother', 'drama', 'curious', 'tired', 'normal']:
            resp = response_generator.heuristic_generate(
                "test message",
                CharacterState(currentMood=mood, moodIntensity=0.8),
                "long",
                "Mira"
            )
            # Must be strictly 1 or 2 lines
            lines = [l for l in resp.strip().splitlines() if l.strip()]
            self.assertLessEqual(len(lines), 2, f"Response for {mood} exceeded 2 lines")
            # Must not be empty
            self.assertGreater(len(resp.strip()), 0)

    def test_manglish_mood_triggers(self):
        engine = MoodEngine()
        # Happy trigger in Manglish
        analysis = mood_analyzer.heuristic_analyze("ente exam njan pass aayi adipoli!!", [], engine.get_state())
        self.assertEqual(analysis.mood, "happy")

        # Sad trigger in Manglish
        analysis = mood_analyzer.heuristic_analyze("nalla vishamam thonnunu kashtam", [], engine.get_state())
        self.assertEqual(analysis.mood, "sad")

        # Mother trigger in Manglish
        analysis = mood_analyzer.heuristic_analyze("njan padikkuva food onnum kazhichilla", [], engine.get_state())
        self.assertEqual(analysis.mood, "mother")

if __name__ == '__main__':
    unittest.main()
