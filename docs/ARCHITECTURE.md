# TALENTRA — Software Architecture & Design Blueprint

## 1. Architectural Philosophy

**TALENTRA** is architected as a clean, decoupled, enterprise-ready full-stack platform. Even though the application currently implements foundational infrastructure validation, the directory layout and code organization strictly adhere to **Separation of Concerns (SoC)**, **Single Responsibility Principle (SRP)**, and **Clean Architecture**.

```
+---------------------------------------------------------------------------------+
|                               TALENTRA Architecture                             |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [ Presentation Layer ] (React 18 + Vite + Tailwind CSS)                       |
|  ├── User Interface Components (Reusable atomic elements)                       |
|  ├── Page Views (Routed top-level views)                                        |
|  └── Client-Side State Management & Reactive Hooks                              |
|                                                                                 |
|  [ API Client Layer ] (Axios)                                                   |
|  └── Abstracted HTTP client with environment-aware endpoints                    |
|                                                                                 |
|  ============================== Network Boundary =============================  |
|                                                                                 |
|  [ API Gateway / Interface Layer ] (FastAPI + Pydantic)                         |
|  ├── CORS Middleware & Request Validation                                       |
|  └── REST API Routers (/health, future /analytics, /candidates)                 |
|                                                                                 |
|  [ Domain & Business Services Layer ] (Python)                                  |
|  └── Business logic, orchestrations, and future AI talent intelligence          |
|                                                                                 |
|  [ Data Access & Persistence Layer ] (SQLAlchemy 2.0 ORM)                       |
|  ├── Declarative Models & Schema Definitions                                    |
|  ├── Engine Connection Pooling & Session Lifecycle Management                   |
|  └── Database Driver Interface                                                  |
|                                                                                 |
|  [ Storage Layer ]                                                              |
|  └── Isolated Local SQLite Database (data/talentra_dev.db)                      |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

---

## 2. Frontend Architectural Layers

### A. Presentation Layer (`frontend/src/pages/` & `components/`)
- **Pages:** Top-level route views that map to user journeys. In the baseline setup, `HomePage.jsx` provides platform status and real-time connectivity diagnostics.
- **Components:** Modular, encapsulated UI components that accept props and emit events. This structure prevents spaghetti code and facilitates unit testing.

### B. Client Routing (`frontend/src/App.jsx`)
- Powered by `react-router-dom`. Client-side routing intercepts URL transitions in the browser, swapping UI trees without issuing full-page HTTP reloads to the server.

### C. Services & API Abstraction (`frontend/src/services/`)
- Direct `fetch` or raw `axios` calls are strictly prohibited inside presentation components.
- All HTTP interactions are encapsulated inside `services/api.js`. This ensures:
  1. Base URLs and headers are configured in one place.
  2. Components interact with strongly-named domain functions (`getHealthStatus()`).
  3. API payload schema changes require updating only the service layer, not dozens of UI views.

---

## 3. Backend Layered Architecture

### A. Core Configuration (`backend/app/core/`)
- Manages application-wide settings using `pydantic-settings`.
- Reads from environment variables with graceful fallback to `.env` file values.
- Centralizes CORS origins, database connection strings, and platform identifiers.

### B. Interface Layer (`backend/app/routers/`)
- FastAPI routers declare REST endpoints, HTTP methods, and status codes.
- Relies on Pydantic schemas for automated input parsing, schema enforcement, and interactive Swagger documentation (`/docs`).

### C. Business Services (`backend/app/services/`)
- Encapsulates pure business rules and data transformations.
- Keeps routers lightweight and focused purely on HTTP serialization.

### D. Data Modeling (`backend/app/models/` & `backend/app/schemas/`)
- **Pydantic Schemas (`schemas/`):** Define the *shape of data across the network* (request and response payloads).
- **SQLAlchemy Models (`models/`):** Define the *shape of data on disk* (tables, columns, foreign keys).
- This separation prevents internal database schema details from inadvertently leaking into external API responses.

### E. Database Layer (`backend/app/database/`)
- Configures the SQLAlchemy `Engine` and `SessionLocal` factory.
- Employs a Python dependency generator (`get_db`) to guarantee clean session cleanup per request.

---

## 4. Database Strategy & CompanyAI Isolation

### A. SQLite for Local Development
- Database file: `data/talentra_dev.db`.
- SQLite provides immediate, file-based relational capabilities with zero installation overhead.
- Because SQLAlchemy abstracts SQL dialects, transitioning to PostgreSQL or enterprise databases in future phases requires changing only the `DATABASE_URL` connection string without rewriting application queries.

### B. Isolation Guarantee
- **Strict Independence:** TALENTRA operates on its own dedicated database.
- **CompanyAI Protection:** TALENTRA has no connection string, credentials, or filesystem path pointing to CompanyAI or any pre-existing database. All database tables and data remain strictly within the `data/` directory.

---

## 5. Security & Environment Principles

1. **Secrets Isolation:** No passwords, tokens, or private credentials are hardcoded. `.env` is excluded in `.gitignore`.
2. **CORS Hardening:** FastAPI explicitly restricts origins to trusted development hosts (`http://localhost:5173` and `http://127.0.0.1:5173`).
3. **Frontend Variable Scope:** Only variables prefixed with `VITE_` (such as `VITE_API_BASE_URL`) are exposed to the client bundle by Vite. Backend secrets remain inaccessible to the browser.
