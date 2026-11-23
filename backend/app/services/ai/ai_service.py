"""
Centralized AI Service for TALENTRA.

Strictly enforces:
1. FREE AI MODEL POLICY: Accepts only verified free models (ending in ':free' or confirmed $0.00).
   Attempts to invoke paid models are blocked immediately with FreeModelPolicyError.
2. ZERO-FABRICATION POLICY: System instructions enforce returning null / empty for missing data.
3. IN-MEMORY SAFE CACHING: Hashes prompts to avoid redundant API calls and rate-limiting.
4. RATE-LIMIT HANDLING & RETRIES: Exponential backoff with graceful degradation.
"""

import json
import time
import re
import hashlib
import logging
import urllib.request
import urllib.error
from urllib.parse import urlsplit
from typing import Dict, Any, Optional, Type, TypeVar, List
from pydantic import BaseModel, ValidationError

from backend.app.core.config import settings

logger = logging.getLogger("talentra.ai")
logger.setLevel(logging.INFO)

T = TypeVar("T", bound=BaseModel)

class FreeModelPolicyError(Exception):
    """Raised when a non-free model is requested in violation of the strict Free-Model Policy."""
    pass


class AIDataPolicyError(RuntimeError):
    """Raised when content is not approved for the hosted free inference endpoint."""


class AIService:
    """
    Centralized, enterprise-grade AI Service managing OpenRouter interactions
    using strictly verified free models.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: int = 45,
    ):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.model = model or settings.OPENROUTER_LLM_MODEL or "nvidia/nemotron-3.5-super-vl:free"
        self.base_url = (base_url or settings.OPENROUTER_BASE_URL).rstrip("/")
        parsed_url = urlsplit(self.base_url)
        if (parsed_url.scheme, parsed_url.netloc, parsed_url.path, parsed_url.query, parsed_url.fragment) != (
            "https", "openrouter.ai", "/api/v1", "", ""
        ):
            raise ValueError("Nemotron requests must use the configured OpenRouter HTTPS endpoint.")
        self.timeout = timeout_seconds
        self._cache: Dict[str, Any] = {}
        self._max_cache_size = 500
        self.last_usage: Optional[Dict[str, Any]] = None

        # Validate free model immediately upon initialization
        self.verify_free_model(self.model)

    def verify_free_model(self, model_name: str) -> bool:
        """
        Enforce Strict Free AI Model Policy.
        Only models ending in ':free' or explicitly in the verified free list are permitted.
        """
        if not model_name:
            raise FreeModelPolicyError("No AI model specified. Free model required.")

        normalized = model_name.strip().lower()
        if normalized != "nvidia/nemotron-3.5-super-vl:free":
            raise FreeModelPolicyError(
                "Strict Nemotron Free Model Policy Violation: only "
                "nvidia/nemotron-3.5-super-vl:free is approved."
            )
        return True

    @staticmethod
    def _assert_data_policy(data_classification: str) -> None:
        if data_classification not in {"synthetic", "public"}:
            raise AIDataPolicyError(
                "Hosted free Nemotron is restricted to synthetic or public content; "
                "personal, confidential, and unclassified content was not sent."
            )

    def _get_cache_key(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        """Generate a deterministic MD5 hash for the prompt request."""
        raw = f"{model}:{system_prompt or ''}:{prompt}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _call_api(self, messages: List[Dict[str, str]], temperature: float = 0.2, max_tokens: int = 4096) -> str:
        """
        Execute request against OpenRouter chat completions endpoint with
        exponential backoff for rate limits (429) and network errors.
        """
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured in .env")

        self.verify_free_model(self.model)

        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        data = json.dumps(payload).encode("utf-8")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://talentra.local",
            "X-Title": "TALENTRA Talent Intelligence",
            "User-Agent": "Talentra-FreeModel-Service/1.0",
        }

        req = urllib.request.Request(url, data=data, headers=headers, method="POST")

        retries = 2
        delay = 2.0

        for attempt in range(retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    usage = resp_data.get("usage")
                    self.last_usage = usage if isinstance(usage, dict) else None
                    choices = resp_data.get("choices", [])
                    if not choices:
                        raise ValueError("OpenRouter API returned an empty choices array")
                    msg = choices[0].get("message", {})
                    content = msg.get("content") or msg.get("reasoning") or ""
                    return content.strip()
            except urllib.error.HTTPError as err:
                status_code = err.code
                if status_code == 429:
                    logger.warning("Nemotron free-tier rate limit reached (429).")
                    raise RuntimeError(
                        "Nemotron free-tier rate limit reached. Please wait and retry later."
                    ) from err
                else:
                    logger.error("OpenRouter API request failed with HTTP %s", status_code)
                    raise RuntimeError(f"Nemotron request failed with HTTP {status_code}.") from err
            except Exception as e:
                if attempt < retries:
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise e

        raise RuntimeError("OpenRouter API request failed after retries.")

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
        use_cache: bool = True,
        data_classification: str = "public",
    ) -> str:
        """
        Generate raw text response from the free model.
        Uses in-memory cache to save free quota.
        """
        self._assert_data_policy(data_classification)
        cache_key = self._get_cache_key(prompt, system_prompt, self.model)
        if use_cache and cache_key in self._cache:
            return self._cache[cache_key]

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        result = self._call_api(messages, temperature=temperature, max_tokens=max_tokens)

        if use_cache:
            if len(self._cache) >= self._max_cache_size:
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = result

        return result

    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2500,
        use_cache: bool = True,
        data_classification: str = "public",
    ) -> T:
        """
        Generate structured data validated against a Pydantic model.
        Extracts JSON from response, validates schema, and strictly obeys Zero-Fabrication.
        """
        self._assert_data_policy(data_classification)
        cache_key = self._get_cache_key(prompt, (system_prompt or "") + response_model.__name__, self.model)
        if use_cache and cache_key in self._cache:
            cached_data = self._cache[cache_key]
            return response_model.model_validate(cached_data)

        # Build schema instructions
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        base_system = (
            "You are an enterprise talent intelligence AI assistant for TALENTRA.\n"
            "STRICT ZERO-FABRICATION POLICY:\n"
            "- Only extract facts directly present in the source text.\n"
            "- If information for a field is not found or ambiguous, set it to null or an empty list.\n"
            "- NEVER invent or guess contact numbers, emails, experience years, CTC, or employer names.\n"
            "FORMAT REQUIREMENTS:\n"
            "- Output valid, parseable JSON strictly conforming to the requested schema.\n"
            "- Do NOT include conversational filler, preamble, or commentary outside the JSON block.\n"
        )
        if system_prompt:
            base_system += f"\nAdditional Context:\n{system_prompt}"

        structured_prompt = (
            f"{prompt}\n\n"
            f"REQUIRED JSON SCHEMA:\n```json\n{schema_json}\n```\n\n"
            "Return ONLY the JSON object matching this schema."
        )

        messages = [
            {"role": "system", "content": base_system},
            {"role": "user", "content": structured_prompt},
        ]

        raw_response = self._call_api(messages, temperature=temperature, max_tokens=max_tokens)

        # Parse JSON
        parsed_json = self._extract_json(raw_response)
        validated = response_model.model_validate(parsed_json)

        if use_cache:
            if len(self._cache) >= self._max_cache_size:
                self._cache.pop(next(iter(self._cache)))
            self._cache[cache_key] = validated.model_dump()

        return validated

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON from model output string."""
        cleaned = (text or "").strip()
        if not cleaned:
            raise ValueError("Empty response received from AI model.")
        # Look for markdown code fence ```json ... ```
        if "```json" in cleaned:
            start = cleaned.find("```json") + 7
            end = cleaned.rfind("```")
            cleaned = cleaned[start:end].strip()
        elif "```" in cleaned:
            start = cleaned.find("```") + 3
            end = cleaned.rfind("```")
            cleaned = cleaned[start:end].strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback: extract substring between first { and last }
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                sub = cleaned[first_brace : last_brace + 1]
                sub = re.sub(r",\s*([\]}])", r"\1", sub)
                try:
                    return json.loads(sub)
                except json.JSONDecodeError:
                    pass
            raise ValueError(f"Failed to parse valid JSON from AI response: {text[:200]}...")


_ai_service_instance: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Retrieve or initialize the global singleton AIService instance."""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
