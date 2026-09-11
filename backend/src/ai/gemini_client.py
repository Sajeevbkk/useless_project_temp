import os
import json
from typing import Optional, Any, Dict
from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.default_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
        self.client = None
        if self.api_key and genai:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing Gemini client: {e}")

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def get_model_name(self) -> str:
        return self.default_model

    def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured in backend.")

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.3,
        )

        candidate_models = [
            self.default_model,
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-flash-latest",
        ]
        # Remove duplicates while preserving order
        seen = set()
        models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

        last_error = None
        for model in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                raw = response.text or "{}"
                # If markdown backticks around json, strip them
                if "```json" in raw:
                    raw = raw.split("```json")[1].split("```")[0].strip()
                elif "```" in raw:
                    raw = raw.split("```")[1].split("```")[0].strip()
                return json.loads(raw)
            except Exception as e:
                last_error = e
                continue

        raise RuntimeError(f"All Gemini JSON model attempts failed. Last error: {last_error}")

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None, temperature: float = 0.8) -> str:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured in backend.")

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
        )

        candidate_models = [
            self.default_model,
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-flash-latest",
        ]
        seen = set()
        models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

        last_error = None
        for model in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                return (response.text or "").strip()
            except Exception as e:
                last_error = e
                continue

        raise RuntimeError(f"All Gemini Text model attempts failed. Last error: {last_error}")

gemini_client = GeminiClient()
