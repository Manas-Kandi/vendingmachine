"""Shared LLM interface used by Zen and Store agents."""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

from openai import AsyncOpenAI, OpenAIError

logger = logging.getLogger(__name__)


def _load_env_float(name: str, default: float) -> float:
    """Parse float environment variables safely."""
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        logger.warning("Invalid float for %s: %s (using default %s)", name, value, default)
        return default


def _load_env_int(name: str, default: int) -> int:
    """Parse integer environment variables safely."""
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        logger.warning("Invalid integer for %s: %s (using default %s)", name, value, default)
        return default


class UnifiedLLMInterface:
    """Thin wrapper around the OpenAI-compatible API for async LLM calls."""

    def __init__(
        self,
        *,
        system_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.15,
        max_tokens: int = 600,
    ) -> None:
        api_key = (
            os.getenv("NVIDIA_API_KEY")
            or os.getenv("ZEN_MACHINE_LLM_API_KEY")
            or os.getenv("OPENAI_API_KEY")
        )
        if not api_key:
            raise RuntimeError(
                "Missing API key for LLM. Set NVIDIA_API_KEY or ZEN_MACHINE_LLM_API_KEY."
            )

        base_url = os.getenv(
            "ZEN_MACHINE_LLM_BASE_URL",
            "https://integrate.api.nvidia.com/v1",
        ).rstrip("/")

        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )

        self.system_prompt = system_prompt.strip()
        self.model = model or os.getenv(
            "ZEN_MACHINE_LLM_MODEL",
            "meta/llama3-70b-instruct",
        )
        self.temperature = _load_env_float(
            "ZEN_MACHINE_LLM_TEMPERATURE",
            temperature,
        )
        self.max_tokens = _load_env_int(
            "ZEN_MACHINE_LLM_MAX_TOKENS",
            max_tokens,
        )

    async def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a structured decision/response from the LLM."""
        prompt = self._create_prompt(context)
        raw_text = await self._call_llm(prompt)
        parsed = self._parse_json_payload(raw_text)

        validated = None
        try:
            validated = self._validate_decision(parsed, context)
        except Exception as exc:  # pragma: no cover - safety net
            logger.exception("Validation failed: %s", exc)

        if validated is None:
            # Fallback: return parsed dict or raw text for downstream heuristics
            if isinstance(parsed, dict):
                parsed.setdefault("raw_response", raw_text)
                return parsed
            return {"raw_response": raw_text, "reason": raw_text, "confidence": 0.5}

        validated["raw_response"] = raw_text
        return validated

    async def generate_quote_reasoning(
        self,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Alias used by the Store agent."""
        return await self.generate_decision(context)

    async def _call_llm(self, prompt: str) -> str:
        """Invoke the underlying LLM endpoint and return the raw text."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
        except OpenAIError as exc:  # pragma: no cover - network/HTTP failure
            logger.exception("LLM request failed: %s", exc)
            raise

        try:
            return response.choices[0].message.content or ""
        except (IndexError, AttributeError) as exc:  # pragma: no cover
            logger.error("Malformed LLM response structure: %s", exc)
            return ""

    def _parse_json_payload(self, content: str) -> Dict[str, Any]:
        """Extract a JSON object from the model's response."""
        if not content:
            return {}

        content = content.strip()
        start = content.find("{")
        end = content.rfind("}")

        if start != -1 and end != -1 and end > start:
            content = content[start : end + 1]

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            logger.debug("Unable to parse JSON from LLM response: %s", content)
            return {"reason": content, "confidence": 0.4}

    # Methods expected to be provided by subclasses ---------------------------------
    def _create_prompt(self, context: Dict[str, Any]) -> str:  # pragma: no cover
        raise NotImplementedError

    def _validate_decision(  # pragma: no cover
        self,
        decision: Dict[str, Any],
        context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        raise NotImplementedError
