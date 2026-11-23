# Next.js App Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate TALENTRA's frontend build tool and runtime from Vite to Next.js (App Router), enabling Next.js server features and proxy rewrites while preserving all 12 platform modules and routes.

**Architecture:** Replace Vite with Next.js App Router. Set up `next.config.mjs` with reverse proxy rewrites to FastAPI on port 8001. Use a client-side shell mounted via Next.js App Router (`src/app/`) so all existing dashboards, modals, and navigation continue working seamlessly without route disruption or hydration errors.

**Tech Stack:** Next.js 15+, React 18, Tailwind CSS, Lucide React, Axios, FastAPI backend.

---

## Global Constraints

- Do not alter or break FastAPI backend endpoints or database schemas.
- Ensure reverse proxy for `/api/*` and `/health` routes to `http://127.0.0.1:8001`.
- Preserve existing Tailwind styling, theme toggle (dark mode), and Lucide icons.
- Build command (`npm run build`) and dev command (`npm run dev`) must pass cleanly.

## Review Focus

1. **Hydration safety**: Ensure browser APIs (e.g. `window`, `document`, canvas color parsing in `ShinyText.jsx`) do not throw SSR mismatch errors during initial server render.
2. **Reverse Proxy Rewrites**: Confirm `/api/v1/interviews/candidates` and `/api/v1/jds` resolve properly via Next.js to FastAPI port 8001 without CORS errors.
3. **Routing parity**: Verify all routes (`/`, `/jds`, `/resumes`, `/matching`, `/comparison`, `/assignments`, `/campaigns`, `/analytics`, `/sourcing`, `/clients`, `/interview-timetable`, `/profile-scraper`) resolve accurately.
4. **Environment variable availability**: Ensure API client layers resolve the base URL under Next.js without crashing.
5. **Asset bundling & production build**: Verify `next build` generates valid production bundles with zero compilation errors.

---

### Task 1: Update Frontend Package Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] Add `next` to dependencies in `frontend/package.json`.
- [ ] Update scripts:
  - `"dev": "next dev"`
  - `"build": "next build"`
  - `"start": "next start"`
- [ ] Remove Vite dev dependencies (`@vitejs/plugin-react`, `vite`).
- [ ] Run `npm.cmd install` in `frontend/` and confirm clean dependency resolution.

---

### Task 2: Configure Next.js Reverse Proxy and Compiler

**Files:**
- Create: `frontend/next.config.mjs`
- Delete: `frontend/vite.config.js`

- [ ] Create `frontend/next.config.mjs` configuring:
  - `async rewrites()` to proxy `/api/:path*` to `http://127.0.0.1:8001/api/:path*` and `/health` to `http://127.0.0.1:8001/health`.
  - Transpile packages if needed.
- [ ] Safely remove `frontend/vite.config.js`.

---

### Task 3: Establish Next.js App Router Root Layout & Client Catch-All

**Files:**
- Create: `frontend/src/app/layout.jsx`
- Create: `frontend/src/app/[[...slug]]/page.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/services/api.js`

- [ ] Create `frontend/src/app/layout.jsx` with root `<html>`, `<body>`, importing `../index.css`.
- [ ] Create client wrapper component in `frontend/src/app/[[...slug]]/page.jsx` with `'use client';` and dynamic client-side mount of `App.jsx` (disabling SSR to prevent browser-specific canvas/DOM hydration mismatches).
- [ ] Update `frontend/src/services/api.js` and `feature-modules/06-interview-scheduling/frontend/api.js` to support `process.env.NEXT_PUBLIC_API_BASE_URL` alongside existing fallbacks.

---

### Task 4: Update Launcher Scripts & Environment Config

**Files:**
- Modify: `run_frontend.ps1`
- Modify: `.env`

- [ ] Update `run_frontend.ps1` to execute `npm.cmd run dev -- -p 5173 -H 127.0.0.1`.
- [ ] Add `NEXT_PUBLIC_API_BASE_URL=` in root `.env` and `frontend/.env`.

---

### Task 5: Build Verification and Live Integration Testing

**Files:**
- Test: Production build `npm.cmd run build`
- Test: Next.js dev server endpoint testing

- [ ] Run `npm.cmd run build` inside `frontend/` to confirm static export / build compiles without errors.
- [ ] Start Next.js dev server on port `5173` and verify home dashboard loads.
- [ ] Verify `/interview-timetable` renders and the "Schedule Candidate Interview" modal populates candidates and requisitions through the Next.js proxy rewrite.
