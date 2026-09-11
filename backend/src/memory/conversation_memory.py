import os
import json
from typing import List, Optional
from ..models import ChatMessage

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data'))
FILE_PATH = os.path.join(DATA_DIR, 'conversation.json')

class ConversationMemory:
    def __init__(self):
        self.messages: List[ChatMessage] = []
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
                    raw = json.load(f)
                    self.messages = [ChatMessage(**m) for m in raw]
        except Exception as e:
            print(f"Could not load conversation from disk: {e}")
            self.messages = []

    def _save(self):
        try:
            with open(FILE_PATH, 'w', encoding='utf-8') as f:
                json.dump([m.model_dump() for m in self.messages], f, indent=2)
        except Exception as e:
            print(f"Could not save conversation to disk: {e}")

    def get_messages(self) -> List[ChatMessage]:
        return list(self.messages)

    def add_message(self, msg: ChatMessage):
        self.messages.append(msg)
        self._save()

    def remove_last_assistant_message(self) -> Optional[ChatMessage]:
        for i in range(len(self.messages) - 1, -1, -1):
            if self.messages[i].role == 'assistant':
                removed = self.messages.pop(i)
                self._save()
                return removed
        return None

    def clear(self):
        self.messages = []
        self._save()

conversation_memory = ConversationMemory()
