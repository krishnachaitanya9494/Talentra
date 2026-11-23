"""
TALENTRA AI Service Package.

Provides a centralized, reusable AI foundation strictly adhering to the
Free AI Model Policy and Zero-Fabrication Policy.
"""

from backend.app.services.ai.ai_service import AIService, FreeModelPolicyError, get_ai_service

__all__ = ["AIService", "FreeModelPolicyError", "get_ai_service"]
