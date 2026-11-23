"""
2,048-Dimensional Vector Embedding & Semantic Cosine Similarity Service for TALENTRA.

Adheres strictly to:
- OpenRouter free embedding endpoint: nvidia/nemotron-3-embed-1b:free
- Fallback Transparency: Clear distinction between genuine neural embeddings and deterministic projections
- Circuit Breaker: Prevents repeating failed network requests in tight loops
- Strict Cache Invalidation: Lookup incorporates model_name, dimension, and provider
- Zero Semantic Contribution Policy: When fallback vectors are active, semantic score is strictly 0.0
"""

import re
import json
import math
import time
import hashlib
import logging
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.models.agent import ResumeEmbedding, JobEmbedding
from backend.app.models.candidate import Candidate
from backend.app.models.job_requirement import JobRequirement

logger = logging.getLogger("talentra.embedding")
logger.setLevel(logging.INFO)

EMBEDDING_DIMENSION = 2048
EMBEDDING_MODEL_NAME = settings.OPENROUTER_EMBEDDING_MODEL or "nvidia/nemotron-3-embed-1b:free"


@dataclass
class EmbeddingResult:
    """Explicit embedding container carrying vector data and provenance metadata."""
    vector: List[float]
    provider: str
    model_name: str
    is_fallback: bool
    embedding_status: str  # 'genuine' | 'fallback_projection' | 'missing' | 'error'
    dimension: int = 2048

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model_name": self.model_name,
            "is_fallback": self.is_fallback,
            "embedding_status": self.embedding_status,
            "dimension": self.dimension,
            "vector_preview": self.vector[:5] if self.vector else [],
        }


def normalize_text_for_embedding(text: str) -> str:
    """Normalize text by removing markdown artifacts and collapsing whitespace."""
    if not text:
        return ""
    cleaned = re.sub(r"[#*`_~>[\]()]+", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.lower()


def compute_content_sha256(text: str) -> str:
    """Deterministic SHA-256 hash of normalized text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def deterministic_2048_projection(text: str) -> List[float]:
    """
    Generate a deterministic, unit-normalized 2,048-dimensional float vector.
    Used for local testing, offline workflows, or fallback when API is unreachable.
    """
    words = re.findall(r"\w+", text.lower())
    vec = [0.0] * EMBEDDING_DIMENSION
    if not words:
        return vec

    for i, word in enumerate(words):
        h = int(hashlib.md5(f"{word}:{i % 32}".encode("utf-8")).hexdigest(), 16)
        idx = h % EMBEDDING_DIMENSION
        sign = 1.0 if (h >> 16) % 2 == 0 else -1.0
        vec[idx] += sign * (1.0 + (len(word) % 5) * 0.1)

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 1e-9:
        vec = [round(v / norm, 6) for v in vec]
    return vec


def cosine_similarity(vec_a: Optional[List[float]], vec_b: Optional[List[float]]) -> float:
    """Compute unscaled cosine similarity between two vectors, mapped to [0.0, 1.0]."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b) or len(vec_a) != EMBEDDING_DIMENSION:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a, b in zip(vec_a, vec_b)))
    norm_b = math.sqrt(sum(b * b for a, b in zip(vec_a, vec_b)))
    if norm_a < 1e-9 or norm_b < 1e-9:
        return 0.0
    cos = dot / (norm_a * norm_b)
    return max(0.0, min(1.0, (cos + 1.0) / 2.0))


class EmbeddingProvider:
    """Manages 2,048-dim vector embeddings with DB caching, circuit breaking, and cosine similarity."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL.rstrip("/")
        self.model = model or EMBEDDING_MODEL_NAME
        self._memory_cache: Dict[str, EmbeddingResult] = {}
        # Circuit breaker state: when remote endpoint fails, prevent tight-loop retries
        self._circuit_broken_until: float = 0.0
        self._circuit_cooldown_seconds: float = 120.0

    def embed_text_with_metadata(self, text: str) -> EmbeddingResult:
        """
        Generate a 2,048-dimensional vector embedding for the input text,
        returning full provenance metadata (genuine vs fallback).
        """
        normalized = normalize_text_for_embedding(text)
        if not normalized:
            return EmbeddingResult(
                vector=[0.0] * EMBEDDING_DIMENSION,
                provider="none",
                model_name=self.model,
                is_fallback=True,
                embedding_status="missing",
                dimension=EMBEDDING_DIMENSION,
            )

        content_hash = compute_content_sha256(normalized)
        cache_key = f"{self.model}:{content_hash}"
        if cache_key in self._memory_cache:
            return self._memory_cache[cache_key]

        # Check circuit breaker before making remote network call
        now = time.time()
        if self.api_key and now >= self._circuit_broken_until:
            try:
                vec = self._call_remote_embed(normalized)
                if len(vec) == EMBEDDING_DIMENSION:
                    res = EmbeddingResult(
                        vector=vec,
                        provider="openrouter",
                        model_name=self.model,
                        is_fallback=False,
                        embedding_status="genuine",
                        dimension=EMBEDDING_DIMENSION,
                    )
                    self._memory_cache[cache_key] = res
                    return res
            except urllib.error.HTTPError as e:
                # Trip circuit breaker on 410 Gone, 429 Rate Limit, or 5xx server errors
                self._circuit_broken_until = now + self._circuit_cooldown_seconds
                logger.warning(
                    "Remote embedding API returned HTTP %s (%s). Circuit breaker active for %ss.",
                    e.code,
                    e.reason,
                    self._circuit_cooldown_seconds,
                )
            except Exception as e:
                self._circuit_broken_until = now + self._circuit_cooldown_seconds
                logger.warning("Remote embedding call exception: %s. Circuit breaker active.", e)

        # Fallback to deterministic projection
        fallback_vec = deterministic_2048_projection(normalized)
        res = EmbeddingResult(
            vector=fallback_vec,
            provider="deterministic_projection",
            model_name=self.model,
            is_fallback=True,
            embedding_status="fallback_projection",
            dimension=EMBEDDING_DIMENSION,
        )
        self._memory_cache[cache_key] = res
        return res

    def embed_text(self, text: str) -> List[float]:
        """Backward-compatible helper returning raw vector list."""
        return self.embed_text_with_metadata(text).vector

    def _call_remote_embed(self, text: str) -> List[float]:
        """Call OpenRouter embedding API endpoint."""
        url = f"{self.base_url}/embeddings"
        payload = json.dumps({"model": self.model, "input": text[:8000]}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            embedding = data["data"][0]["embedding"]
            if len(embedding) < EMBEDDING_DIMENSION:
                embedding = embedding + [0.0] * (EMBEDDING_DIMENSION - len(embedding))
            return [round(float(v), 6) for v in embedding[:EMBEDDING_DIMENSION]]

    def get_or_create_candidate_embedding(self, db: Session, candidate: Candidate) -> EmbeddingResult:
        """
        Fetch cached candidate embedding matching model identity and dimension,
        or generate, tag provenance, and persist.
        """
        cand_title = getattr(candidate, "current_title", "") or ""
        cand_skills = getattr(candidate, "skills", "") or ""
        cand_notes = getattr(candidate, "notes", "") or ""
        text = f"{cand_title} {cand_skills} {cand_notes}"
        normalized = normalize_text_for_embedding(text)
        content_hash = compute_content_sha256(normalized)
        mem_key = f"cand:{candidate.id}:{self.model}:{EMBEDDING_DIMENSION}:{content_hash}"
        if mem_key in self._memory_cache:
            return self._memory_cache[mem_key]

        # Cache lookup explicitly incorporating model_name and dimension (Task 3)
        cached = db.execute(
            select(ResumeEmbedding).where(
                ResumeEmbedding.candidate_id == candidate.id,
                ResumeEmbedding.content_hash == content_hash,
                ResumeEmbedding.model_name == self.model,
                ResumeEmbedding.dimension == EMBEDDING_DIMENSION,
            )
        ).scalar_one_or_none()

        if cached and cached.embedding_json:
            try:
                vec = json.loads(cached.embedding_json)
                is_fb = getattr(cached, "is_fallback", True)
                prov = "deterministic_projection" if is_fb else getattr(cached, "provider", "openrouter")
                res = EmbeddingResult(
                    vector=vec,
                    provider=prov,
                    model_name=cached.model_name,
                    is_fallback=is_fb,
                    embedding_status="genuine" if not is_fb else "fallback_projection",
                    dimension=cached.dimension,
                )
                self._memory_cache[mem_key] = res
                return res
            except Exception:
                pass

        # Generate fresh embedding with provenance metadata
        result = self.embed_text_with_metadata(normalized)
        self._memory_cache[mem_key] = result

        record = ResumeEmbedding(
            candidate_id=candidate.id,
            content_hash=content_hash,
            embedding_json=json.dumps(result.vector),
            dimension=EMBEDDING_DIMENSION,
            model_name=self.model,
            provider=result.provider,
            is_fallback=result.is_fallback,
        )
        db.add(record)
        try:
            db.commit()
        except Exception:
            db.rollback()
        return result

    def get_or_create_job_embedding(self, db: Session, job: Any) -> EmbeddingResult:
        """
        Fetch cached job embedding matching model identity and dimension,
        or generate, tag provenance, and persist.
        """
        j_id = getattr(job, "id", None)
        j_title = getattr(job, "title", None) or getattr(job, "job_title", "")
        j_req = getattr(job, "required_skills", None) or getattr(job, "primary_skills", "") or ""
        j_pref = getattr(job, "preferred_skills", "") or ""
        j_desc = getattr(job, "description", None) or getattr(job, "job_description", "") or ""
        text = f"{j_title} {j_req} {j_pref} {j_desc}"
        normalized = normalize_text_for_embedding(text)
        content_hash = compute_content_sha256(normalized)
        mem_key = f"job:{j_id}:{self.model}:{EMBEDDING_DIMENSION}:{content_hash}"
        if mem_key in self._memory_cache:
            return self._memory_cache[mem_key]

        # Cache lookup explicitly incorporating model_name and dimension (Task 3)
        if j_id is not None:
            cached = db.execute(
                select(JobEmbedding).where(
                    JobEmbedding.job_id == j_id,
                    JobEmbedding.content_hash == content_hash,
                    JobEmbedding.model_name == self.model,
                    JobEmbedding.dimension == EMBEDDING_DIMENSION,
                )
            ).scalar_one_or_none()

            if cached and cached.embedding_json:
                try:
                    vec = json.loads(cached.embedding_json)
                    is_fb = getattr(cached, "is_fallback", True)
                    prov = "deterministic_projection" if is_fb else getattr(cached, "provider", "openrouter")
                    res = EmbeddingResult(
                        vector=vec,
                        provider=prov,
                        model_name=cached.model_name,
                        is_fallback=is_fb,
                        embedding_status="genuine" if not is_fb else "fallback_projection",
                        dimension=cached.dimension,
                    )
                    self._memory_cache[mem_key] = res
                    return res
                except Exception:
                    pass

        # Generate fresh embedding with provenance metadata
        result = self.embed_text_with_metadata(normalized)
        self._memory_cache[mem_key] = result

        if j_id is not None:
            record = JobEmbedding(
                job_id=j_id,
                content_hash=content_hash,
                embedding_json=json.dumps(result.vector),
                dimension=EMBEDDING_DIMENSION,
                model_name=self.model,
                provider=result.provider,
                is_fallback=result.is_fallback,
            )
            db.add(record)
            try:
                db.commit()
            except Exception:
                db.rollback()
        return result

    def compute_semantic_score(
        self, db: Session, candidate: Candidate, job: Any
    ) -> Dict[str, Any]:
        """
        Compute semantic similarity with strict Fallback Transparency Policy.
        If either side uses a fallback or is missing, semantic score is STRICTLY 0.0.
        """
        cand_emb = self.get_or_create_candidate_embedding(db, candidate)
        job_emb = self.get_or_create_job_embedding(db, job)

        # Non-negotiable policy: fallback vectors CANNOT contribute semantic weight
        if cand_emb.is_fallback or job_emb.is_fallback:
            return {
                "semantic_score": 0.0,
                "is_fallback": True,
                "semantic_available": False,
                "semantic_status": "Semantic matching unavailable — score calculated using verified structured criteria.",
                "candidate_status": cand_emb.embedding_status,
                "job_status": job_emb.embedding_status,
            }

        sim = cosine_similarity(cand_emb.vector, job_emb.vector)
        return {
            "semantic_score": round(sim * 100.0, 1),
            "is_fallback": False,
            "semantic_available": True,
            "semantic_status": "Grounded neural vector cosine similarity (2,048 dimensions).",
            "candidate_status": "genuine",
            "job_status": "genuine",
        }


_embedding_provider_instance: Optional[EmbeddingProvider] = None


def get_embedding_provider() -> EmbeddingProvider:
    """Singleton getter for the EmbeddingProvider."""
    global _embedding_provider_instance
    if _embedding_provider_instance is None:
        _embedding_provider_instance = EmbeddingProvider()
    return _embedding_provider_instance
