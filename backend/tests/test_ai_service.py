"""
Unit Tests for Centralized AIService.

Tests:
1. Strict Free Model Policy enforcement (rejecting non-free models).
2. JSON extraction and schema validation.
3. In-memory caching logic.
"""

import pytest
from pydantic import BaseModel
from backend.app.services.ai.ai_service import AIService, FreeModelPolicyError


class SampleExtractionSchema(BaseModel):
    title: str
    skills: list[str]
    years_exp: int | None = None


def test_strict_free_model_policy_blocks_paid_models():
    """Ensure any model lacking the ':free' suffix raises FreeModelPolicyError immediately."""
    with pytest.raises(FreeModelPolicyError) as exc_info:
        AIService(api_key="mock-key", model="openai/gpt-4o")
    assert "Strict Nemotron Free Model Policy Violation" in str(exc_info.value)

    with pytest.raises(FreeModelPolicyError) as exc_info2:
        AIService(api_key="mock-key", model="anthropic/claude-3.5-sonnet")
    assert "Strict Nemotron Free Model Policy Violation" in str(exc_info2.value)


def test_strict_free_model_policy_permits_free_models():
    """Only the configured NVIDIA Nemotron free model is permitted."""
    svc = AIService(api_key="mock-key", model="nvidia/nemotron-3.5-super-vl:free")
    assert svc.model == "nvidia/nemotron-3.5-super-vl:free"

    with pytest.raises(FreeModelPolicyError):
        AIService(api_key="mock-key", model="meta-llama/llama-3.3-70b-instruct:free")


def test_unclassified_prompt_is_blocked_before_api_call(monkeypatch):
    svc = AIService(api_key="mock-key", model="nvidia/nemotron-3.5-super-vl:free")
    monkeypatch.setattr(svc, "_call_api", lambda *args, **kwargs: "should not be returned")
    with pytest.raises(RuntimeError, match="synthetic or public"):
        svc.generate_text("candidate resume text", use_cache=False)


def test_resume_parser_reports_when_hosted_ai_is_blocked():
    from backend.app.services.extraction.resume_parser import ResumeParser

    result = ResumeParser.parse_with_ai("Built React applications for customer support teams.")

    assert result["ai_status"] == "blocked"
    assert "was not sent" in result["ai_message"]


def test_extract_json_markdown_blocks():
    """Verify that JSON markdown blocks and raw strings are properly parsed."""
    svc = AIService(api_key="mock-key", model="nvidia/nemotron-3.5-super-vl:free")

    raw_markdown = """
    Here is the requested analysis:
    ```json
    {
      "title": "Lead Software Engineer",
      "skills": ["Python", "FastAPI", "React"],
      "years_exp": 7
    }
    ```
    """
    parsed = svc._extract_json(raw_markdown)
    assert parsed["title"] == "Lead Software Engineer"
    assert parsed["skills"] == ["Python", "FastAPI", "React"]
    assert parsed["years_exp"] == 7


def test_cache_deduplication():
    """Verify that identical prompt requests hit the memory cache."""
    svc = AIService(api_key="mock-key", model="nvidia/nemotron-3.5-super-vl:free")
    prompt = "Analyze job requirements"
    cache_key = svc._get_cache_key(prompt, None, svc.model)

    # Prepopulate cache
    svc._cache[cache_key] = "Pre-computed analysis result"

    # Call generate_text; should return cached result without network call
    res = svc.generate_text(prompt, use_cache=True, data_classification="synthetic")
    assert res == "Pre-computed analysis result"
