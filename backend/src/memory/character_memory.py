import os
import json
from typing import Dict

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data'))
FILE_PATH = os.path.join(DATA_DIR, 'character.json')

class CharacterMemory:
    def __init__(self):
        self.name: str = "Mira"
        self.user_facts: Dict[str, str] = {}
        self._ensure_data_dir()
        self._load()

    def _ensure_data_dir(self):
        try:
            if not os.path.exists(DATA_DIR):
                os.makedirs(DATA_DIR, exist_ok=True)
        except Exception as e:
            print(f"Could not create data dir: {e}")

    def _load(self):
        try:
            if os.path.exists(FILE_PATH):
                with open(FILE_PATH, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.name = data.get("name", "Mira")
                    self.user_facts = data.get("user_facts", {})
        except Exception as e:
            print(f"Could not load character data from disk: {e}")

    def _save(self):
        try:
            with open(FILE_PATH, 'w', encoding='utf-8') as f:
                json.dump({"name": self.name, "user_facts": self.user_facts}, f, indent=2)
        except Exception as e:
            print(f"Could not save character data to disk: {e}")

    def get_name(self) -> str:
        return self.name

    def set_name(self, name: str):
        self.name = name.strip() or "Mira"
        self._save()

    def remember_fact(self, key: str, value: str):
        self.user_facts[key] = value
        self._save()

    def clear(self):
        self.name = "Mira"
        self.user_facts = {}
        self._save()

character_memory = CharacterMemory()
