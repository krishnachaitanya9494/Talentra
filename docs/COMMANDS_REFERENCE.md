# TALENTRA — Developer Commands Reference

A practical, beginner-friendly reference for all everyday development commands in PowerShell on Windows 11.

---

## 1. Quick Launchers (Recommended)

From the project root: `C:\Users\Krishna Chaitanya\Desktop\Talentra`

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Start Backend API** | `.\run_backend.ps1` | Launches FastAPI server at `http://127.0.0.1:8000` with hot-reload |
| **Start Frontend App** | `.\run_frontend.ps1` | Launches React development server at `http://127.0.0.1:5173` |

---

## 2. Backend Commands

### Working Directory: `C:\Users\Krishna Chaitanya\Desktop\Talentra`

#### A. Virtual Environment Activation
```powershell
# Activate virtual environment in current PowerShell session
.\backend\.venv\Scripts\Activate.ps1
```
*Note:* If PowerShell restricts script execution, run Python directly via `.\backend\.venv\Scripts\python.exe` without needing activation.

#### B. Installing Backend Dependencies
```powershell
# Working directory: Project Root
& ".\backend\.venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
```
*Explanation:* Reads `backend/requirements.txt` and installs or updates FastAPI, SQLAlchemy, Uvicorn, Pydantic, and test utilities into the virtual environment.

#### C. Starting FastAPI Development Server
```powershell
# Working directory: Project Root
& ".\backend\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
*Explanation:*
- `-m uvicorn`: Runs Uvicorn as a Python module (bypasses Windows AppLocker executable blocking).
- `backend.app.main:app`: Locates the `app` object in `backend/app/main.py`.
- `--reload`: Automatically restarts the server whenever code changes are saved.
- `--host 127.0.0.1 --port 8000`: Binds the server to localhost on port 8000.

#### D. Running Automated Backend Tests
```powershell
# Working directory: Project Root
& ".\backend\.venv\Scripts\python.exe" -m pytest backend\tests\test_health.py -v
```
*Explanation:* Executes pytest against the test suite, validating endpoints (`GET /` and `GET /health`) and direct database engine queries in verbose (`-v`) mode.

---

## 3. Frontend Commands

### Working Directory: `C:\Users\Krishna Chaitanya\Desktop\Talentra\frontend`

#### A. Installing Frontend Dependencies
```powershell
# Working directory: frontend/
npm.cmd install
```
*Explanation:* Reads `package.json` and installs React, Vite, Tailwind CSS, React Router, Axios, and development build tools into `frontend/node_modules/`.

#### B. Starting the React Vite Development Server
```powershell
# Working directory: frontend/
npm.cmd run dev -- --host 127.0.0.1
```
*Explanation:* Starts the local Vite development server with Hot Module Replacement (HMR) bound to `http://127.0.0.1:5173`.

#### C. Building the Production Bundle
```powershell
# Working directory: frontend/
npm.cmd run build
```
*Explanation:* Compiles JSX and Tailwind CSS into optimized, minified production assets inside `frontend/dist/`.

#### D. Previewing the Production Build
```powershell
# Working directory: frontend/
npm.cmd run preview
```
*Explanation:* Serves the built files from `frontend/dist/` locally to verify production performance and routing before deployment.

---

## 4. Database & Health Verification Commands

### Working Directory: `C:\Users\Krishna Chaitanya\Desktop\Talentra`

#### Direct Python Database Probe
```powershell
& ".\backend\.venv\Scripts\python.exe" -c "from backend.app.database.session import verify_database_connection; print(verify_database_connection())"
```
*Expected Output:*
`{'status': 'connected', 'engine': 'sqlite', 'database_url': './data/talentra_dev.db', 'verified': True}`

#### HTTP API Probe (When Backend is Running)
```powershell
# Test root landing
Invoke-RestMethod -Uri "http://127.0.0.1:8000/"

# Test health diagnostics
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```
