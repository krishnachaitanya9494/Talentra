"""
Pydantic Schemas for System Diagnostics and Health Checks.

Defines strongly-typed request and response schemas for infrastructure endpoints,
facilitating OpenAPI documentation and type validation.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class DatabaseStatus(BaseModel):
    """Schema representing the operational status of the primary database."""
    status: str = Field(..., description="Connection status indicator ('connected' or 'disconnected')")
    engine: str = Field(..., description="Underlying database dialect/engine (e.g. 'sqlite')")
    database_url: Optional[str] = Field(None, description="Sanitized relative location of the database file")
    verified: bool = Field(..., description="Boolean flag confirming successful execution of diagnostic query")
    error: Optional[str] = Field(None, description="Error message if the connection probe failed")


class HealthResponse(BaseModel):
    """Schema for the GET /health system diagnostic endpoint."""
    status: str = Field(..., description="Overall system health status ('operational' or 'degraded')")
    app_name: str = Field(..., description="Official registered application name")
    environment: str = Field(..., description="Active runtime environment ('development', 'staging', 'production')")
    version: str = Field(..., description="Semantic version of the application")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the diagnostic check"
    )
    database: DatabaseStatus = Field(..., description="Detailed status of the database connectivity probe")


class RootResponse(BaseModel):
    """Schema for the GET / root landing endpoint."""
    message: str = Field(..., description="Friendly introductory welcome message")
    platform: str = Field(..., description="Platform identifier")
    status: str = Field(..., description="Platform status indicator")
    environment: str = Field(..., description="Active runtime environment")
    documentation_url: str = Field(..., description="Interactive OpenAPI documentation URL")
