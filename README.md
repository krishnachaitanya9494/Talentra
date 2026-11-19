# TALENTRA — Talent Intelligence Platform

> **An intelligent platform designed for recruitment analytics, candidate intelligence, talent operations, and future AI-powered workforce capabilities.**

---

## Overview

TALENTRA is currently in **Phase 1: Development Environment & Infrastructure Baseline**. This repository contains a clean, verified, and decoupled full-stack architecture ready for enterprise talent intelligence application development.

---

## Technology Stack

- **Frontend:** React 18, JavaScript, Vite 6, Tailwind CSS 4, React Router 6, Axios
- **Backend:** Python 3.15, FastAPI, Uvicorn, Pydantic 2, Pydantic Settings
- **Database:** SQLite (isolated at `data/talentra_dev.db`), SQLAlchemy 2.0 ORM
- **Testing:** Pytest, HTTPX

---

## Project Structure

```
TALENTRA/
├── frontend/             # React 18 + Vite + Tailwind CSS application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Top-level route pages (HomePage.jsx)
│   │   ├── services/     # Axios client configuration (api.js)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── assets/       # Static assets
│   │   ├── App.jsx       # Client router
│   │   └── main.jsx      # React mount entry
│   ├── public/           # Static public assets
│   ├── package.json      # Dependencies and scripts
│   └── vite.config.js    # Vite configuration
│
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── core/         # Settings and environment config (config.py)
│   │   ├── routers/      # API route handlers (/health)
│   │   ├── services/     # Business logic layer
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic data schemas (health.py)
│   │   ├── database/     # SQLite connection & session management (session.py)
│   │   └── main.py       # FastAPI application entry & CORS middleware
│   ├── tests/            # Automated test suite (test_health.py)
│   ├── requirements.txt  # Python backend dependencies
│   └── .venv/            # Isolated Python virtual environment
│
├── data/
│   ├── .gitkeep
│   └── talentra_dev.db   # Isolated local SQLite development database
│
├── docs/                 # Detailed architectural and setup guides
│   ├── ENVIRONMENT_SETUP.md
│   ├── ARCHITECTURE.md
│   └── COMMANDS_REFERENCE.md
│
├── run_backend.ps1       # One-click backend launcher
├── run_frontend.ps1      # One-click frontend launcher
├── .env.example          # Environment variables template
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation (this file)
```

---

## Quickstart

### 1. Launch the Backend Server
```powershell
.\run_backend.ps1
```
- **API URL:** `http://127.0.0.1:8000`
- **Interactive Documentation:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

### 2. Launch the Frontend Development Server
```powershell
.\run_frontend.ps1
```
- **Web App URL:** `http://127.0.0.1:5173`

---

## Documentation Index

- [Environment Setup Guide](file:///c:/Users/Krishna%20Chaitanya/Desktop/Talentra/docs/ENVIRONMENT_SETUP.md)
- [Architecture & Design Blueprint](file:///c:/Users/Krishna%20Chaitanya/Desktop/Talentra/docs/ARCHITECTURE.md)
- [Developer Commands Reference](file:///c:/Users/Krishna%20Chaitanya/Desktop/Talentra/docs/COMMANDS_REFERENCE.md)
