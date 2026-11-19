# TALENTRA — Development Environment Setup Guide

Welcome to **TALENTRA**, a modern Talent Intelligence Platform. This guide is crafted specifically for developers learning full-stack development and AI application engineering. It covers every technology choice, architectural principle, and step required to run, maintain, and troubleshoot your local development environment.

---

## 1. System Prerequisites

The following software was detected and verified on your development workstation:

| Tool | Version | Detected Path | Purpose |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 11 (64-bit) | Workstation OS | Host system environment |
| **Python** | 3.15.2 | `C:\Users\Krishna Chaitanya\AppData\Local\Python\bin\python.exe` | Backend execution engine & package runtime |
| **Node.js** | 26.13.0 | `C:\Program Files\nodejs\node.exe` | JavaScript runtime for Vite build tooling |
| **npm** | 11.20.0 | `C:\Program Files\nodejs\npm.cmd` | Node package manager |
| **Git** | 2.56.0.windows.4 | `C:\Program Files\Git\cmd\git.exe` | Distributed version control |
| **IDE** | VS Code 1.147.0 | `AppData\Local\Programs\Microsoft VS Code` | Primary code editor and debugging interface |
| **Disk Space** | 273+ GB Free | Drive `C:` | Ample storage for dependencies and databases |

---

## 2. Technology Stack & Architecture Decisions

### Frontend Stack

1. **React 18 (JavaScript)**
   - **What it does:** Component-based UI library that manages the Document Object Model (DOM) via an efficient Virtual DOM.
   - **Why selected:** Industry standard, highly declarative, extensive ecosystem, and clean state primitives (`useState`, `useEffect`).
2. **Vite 6**
   - **What it does:** Next-generation frontend build tool that leverages native ES modules during development and Rollup/esbuild for production bundling.
   - **Why selected:** Provides near-instantaneous Hot Module Replacement (HMR) and sub-second build times compared to legacy Webpack.
3. **Tailwind CSS 4**
   - **What it does:** Utility-first CSS framework providing atomic styling classes directly in your markup.
   - **Why selected:** Eliminates stylesheet bloat, prevents CSS naming collisions, and accelerates UI iteration without context switching.
4. **React Router DOM 6**
   - **What it does:** Client-side routing engine enabling seamless page navigation without full browser refreshes.
   - **Why selected:** Standard client router with simple path-to-component mappings (`Routes`, `Route`).
5. **Axios**
   - **What it does:** Promise-based HTTP client for browser and Node.js.
   - **Why selected:** Automatically serializes and deserializes JSON, handles HTTP error status codes cleanly, and supports centralized request/response interceptors.

---

### Backend Stack

1. **Python 3.15**
   - **What it does:** High-level programming language with rich ecosystem for web services, data processing, and machine learning.
   - **Why selected:** The premier language for future AI-powered workforce intelligence and analytics.
2. **FastAPI**
   - **What it does:** High-performance, asynchronous web framework built on Starlette and Pydantic.
   - **Why selected:** Offers automatic interactive OpenAPI documentation (`/docs`), strict type validation, and high throughput.
3. **Uvicorn**
   - **What it does:** Lightning-fast ASGI (Asynchronous Server Gateway Interface) server implementation.
   - **Why selected:** Handles asynchronous requests, WebSockets, and hot-reload during development.
4. **Pydantic 2 & Pydantic Settings**
   - **What it does:** Data validation and parsing library powered by Python type hints.
   - **Why selected:** Guarantees strict request/response payloads and type-safe environment variable parsing with `.env` fallback.
5. **SQLAlchemy 2.0 (ORM & Engine)**
   - **What it does:** Comprehensive Object Relational Mapper and SQL toolkit.
   - **Why selected:** Abstract database dialects, providing a unified Pythonic interface for queries and connection pooling.
6. **SQLite**
   - **What it does:** Serverless, zero-configuration, self-contained relational database stored in a single disk file (`data/talentra_dev.db`).
   - **Why selected:** Perfect for local development and rapid prototyping; zero daemon management required.
7. **Pytest & HTTPX**
   - **What it does:** Python testing framework with asynchronous and synchronous HTTP testing capabilities.
   - **Why selected:** Enables automated endpoint testing and continuous verification.

---

## 3. Directory Layout & Folder Responsibilities

```
TALENTRA/
│
├── frontend/                       # Client application root
│   ├── src/                        # React application source code
│   │   ├── components/             # Reusable UI widgets and layout modules
│   │   │   ├── layout/             # Shell components: Sidebar.jsx, Header.jsx, AppLayout.jsx
│   │   │   └── ui/                 # Atomic UI primitives (.gitkeep)
│   │   ├── pages/                  # Top-level route pages (HomePage.jsx)
│   │   ├── services/               # External API client logic (api.js with Axios)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── App.jsx                 # Client router definition and AppLayout wrapper
│   │   ├── index.css               # Global Tailwind CSS directives
│   │   └── main.jsx                # DOM mounting entry point
│   ├── public/                     # Unprocessed public assets (favicons, robots.txt)
│   ├── package.json                # Frontend dependencies, build scripts, overrides
│   ├── vite.config.js              # Vite server & Tailwind plugin configuration
│   └── index.html                  # HTML template hosting the React root container
│
├── backend/                        # Server application root
│   ├── app/                        # Python backend application package
│   │   ├── core/                   # Global configuration and settings (config.py)
│   │   ├── routers/                # API route handlers (/health, future /candidates)
│   │   ├── services/               # Core business logic and calculations
│   │   ├── models/                 # SQLAlchemy database schema models
│   │   ├── schemas/                # Pydantic request/response data contracts
│   │   ├── database/               # Database engine, sessionmaker, and connectivity (session.py)
│   │   └── main.py                 # FastAPI application instance & CORS middleware
│   ├── tests/                      # Automated test suite (test_health.py)
│   ├── requirements.txt            # Python dependencies with pinned version constraints
│   └── .venv/                      # Isolated Python virtual environment
│
├── data/                           # Local database storage directory
│   ├── .gitkeep                    # Keeps directory tracked in Git while ignoring .db files
│   └── talentra_dev.db             # Local SQLite database file (ignored by Git)
│
├── docs/                           # Architectural and operational documentation
│   ├── ENVIRONMENT_SETUP.md        # Comprehensive setup and troubleshooting guide (this file)
│   ├── ARCHITECTURE.md             # System design, data flow, and separation of concerns
│   └── COMMANDS_REFERENCE.md       # Quick command reference with directory indicators
│
├── run_backend.ps1                 # Single-click PowerShell launcher for FastAPI
├── run_frontend.ps1                # Single-click PowerShell launcher for React Vite
├── .env                            # Active local environment variables (never committed)
├── .env.example                    # Template environment variables for onboarding
├── .gitignore                      # Git exclusion rules for node_modules, venvs, DBs
└── README.md                       # Project overview and quickstart guide
```

---

## 4. How the Systems Communicate

### Data Flow Diagram

```
+-------------------------------------------------------------------+
|                        TALENTRA Application                       |
+-------------------------------------------------------------------+
|                                                                   |
|   [ Browser / Client ]                                            |
|   http://127.0.0.1:5173                                           |
|            │                                                      |
|            ▼                                                      |
|   [ React 18 + Vite ]                                             |
|   • HomePage Component                                            |
|   • useEffect Hook initiates probe                                |
|            │                                                      |
|            ▼                                                      |
|   [ Axios API Service ] (frontend/src/services/api.js)            |
|   • HTTP GET http://127.0.0.1:8000/health                         |
|            │                                                      |
|            ▼ (CORS validation: Origin Allowed)                    |
|   [ FastAPI Backend ] (backend/app/main.py)                       |
|   • CORSMiddleware approves localhost:5173 origin                 |
|   • Router: backend/app/routers/health.py                         |
|            │                                                      |
|            ▼                                                      |
|   [ Database Session ] (backend/app/database/session.py)          |
|   • verify_database_connection()                                  |
|   • Executes low-overhead diagnostic: "SELECT 1"                  |
|            │                                                      |
|            ▼                                                      |
|   [ SQLite Engine ] (data/talentra_dev.db)                        |
|   • Reads/writes isolated development file                        |
|            │                                                      |
|            ▼ (Response bubbles back up as JSON)                   |
|   [ React State Update ]                                          |
|   • Displays live operational badge and connection metrics        |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## 5. Step-by-Step Quickstart

### Method 1: Using the PowerShell Helper Scripts (Recommended)

1. Open **Terminal 1** in VS Code:
   ```powershell
   .\run_backend.ps1
   ```
   *FastAPI launches at `http://127.0.0.1:8000`.*

2. Open **Terminal 2** in VS Code:
   ```powershell
   .\run_frontend.ps1
   ```
   *React launches at `http://127.0.0.1:5173`.*

3. Open your browser and navigate to `http://127.0.0.1:5173`. You will see the starter page with the live green "operational" backend probe badge.

---

### Method 2: Manual Step-by-Step Execution

#### Backend Server
1. Open PowerShell and navigate to the project root:
   ```powershell
   cd "c:\Users\Krishna Chaitanya\Desktop\Talentra"
   ```
2. Activate the virtual environment:
   ```powershell
   .\backend\.venv\Scripts\Activate.ps1
   ```
   *(Or run directly via `.\backend\.venv\Scripts\python.exe`)*
3. Start the FastAPI development server:
   ```powershell
   & ".\backend\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```

#### Frontend Server
1. Open a second PowerShell terminal and navigate to the `frontend/` directory:
   ```powershell
   cd "c:\Users\Krishna Chaitanya\Desktop\Talentra\frontend"
   ```
2. Start the Vite development server:
   ```powershell
   npm.cmd run dev -- --host 127.0.0.1
   ```

---

## 6. How SQLite and SQLAlchemy Operate

1. **Engine Creation (`create_engine`):**
   SQLAlchemy connects to SQLite via Python's built-in `sqlite3` driver using the connection string:
   `sqlite:///./data/talentra_dev.db`
   Because SQLite is a file on disk, `check_same_thread=False` is set to allow FastAPI's asynchronous thread pool to access database connections safely.

2. **Session Lifecycle (`get_db`):**
   A session represents an active conversation with the database. We use a Python generator with `try ... finally` to guarantee that every session opened for an API request is automatically closed when the response is returned, preventing file locks and memory leaks:
   ```python
   def get_db():
       db = SessionLocal()
       try:
           yield db
       finally:
           db.close()
   ```

3. **Strict Isolation:**
   TALENTRA's database is completely isolated in `data/talentra_dev.db`. It has zero connections, dependencies, or overlap with any external projects or databases (such as CompanyAI).

---

## 7. Troubleshooting & Common Questions

### Q1: `Program 'python.exe' failed to run: The file cannot be accessed by the system`
- **Cause:** Windows 10/11 includes a zero-byte placeholder for Python in `C:\Users\<user>\AppData\Local\Microsoft\WindowsApps`. If Windows App Execution Aliases are active, PowerShell may call the Store stub instead of the real Python executable.
- **Solution:** Always invoke Python using the virtual environment interpreter:
  `& ".\backend\.venv\Scripts\python.exe"`
  or disable the "App execution alias" for Python in Windows Settings (`Manage app execution aliases`).

### Q2: `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled`
- **Cause:** PowerShell default execution policy restricts `.ps1` script execution.
- **Solution:** Invoke `npm.cmd` directly:
  `npm.cmd install` or `npm.cmd run dev`

### Q3: `An Application Control policy has blocked this file`
- **Cause:** Windows Defender Application Control (WDAC) or Software Restriction Policies block unsigned `.pyd` or `.node` native binary DLLs in user profile folders (`AppData` or `Desktop`).
- **Solution:**
  - For Rollup/Vite: We configured `@rollup/wasm-node` (pure WebAssembly) in `package.json`, which runs without any native DLL loading.
  - For SQLAlchemy: We pinned the stable `sqlalchemy>=2.0.35,<2.1.0` pure-Python wheel (`py3-none-any.whl`).
  - For Uvicorn: Always launch via `python -m uvicorn` rather than the generated `uvicorn.exe` shim.
