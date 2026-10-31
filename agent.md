# TaskFlow Assessment Work Plan

## Source and scope

This checklist follows the original source of truth, `Nanoheal Assignment.md`, shared at the start of the conversation. The assignment improves an Express + MongoDB (Mongoose) API and React (Vite) task app through small, reviewable parts.

The brief estimates 3–4 focused hours and allows 72 hours for submission. AI tools are allowed and expected; the submission must still describe actual AI use honestly.

## Non-negotiables

- Keep the existing app runnable with the documented Node.js, MongoDB, backend, and frontend setup.
- For every planted bug fixed, include a nearby `// FIX: ...` comment that states the defect and why the fix addresses it.
- Make and document reasonable assumptions for ambiguous saved-view behavior; do not seek clarification from the assessor.
- Preserve a concise `NOTES.md` (around half a page) covering bugs fixed, feature assumptions and reasons, AI assistance including one specific incorrect/incomplete suggestion that was overridden (or say honestly if none occurred), and what would be improved with another day.
- Keep `README.md` usable: retain prerequisites and startup/database/seed instructions, and update it if routes, environment variables, feature behavior, or setup steps change.
- Final deliverables are a 3–5 minute video of the working implementation and a zip of the final code that includes `NOTES.md`.
- Do not claim an unverified behavior as working. Record any known limitations in `NOTES.md`.

## Work checklist

### Part 1 — Find and fix the four planted bugs

- [x] Race condition: task completion used a read/modify/save counter update; use a single atomic database update.
- [x] Authentication/session: access tokens expired without the frontend using the stored refresh token; refresh and retry authorized requests, and clear client session state if refresh fails.
- [x] Data-layer performance: task listing queried each assignee separately; populate assignee fields in the task query.
- [x] Frontend state: polling lacked cleanup and could let older results overwrite newer filter results; clean up the timer and ignore stale responses.
- [x] Review these fixes against `Nanoheal Assignment.md`, then verify them against MongoDB with seeded data.
- [x] Start the application with its documented `.env` configuration and verify login, refresh, filters, and saved-view API flows live.

### Part 2 — Task filtering and saved views

- [x] Add task filters for status, assignee, due-date range, and existing title search.
- [x] Let a user save a named combination of filters and reload it.
- [x] Persist private per-user saved views in MongoDB across refreshes and new sessions.
- [x] Decide and document same-name replacement, deleted assignee behavior, and inclusive UTC calendar-day date ranges.
- [x] Update the README with feature behavior and API routes.

### Part 3 — Submission notes and packaging

- [x] Add `NOTES.md` with bugs, assumptions, AI use/override, and future work.
- [x] Record the saved-view assumptions and one specific incomplete AI assessment in `NOTES.md`.
- [ ] Prepare and review a 3–5 minute demo outline showing the working implementation.
- [ ] Create the final source zip and confirm it includes `NOTES.md` and the files needed to run the app.

- [ ] Exclude `backend/.env` and dependency folders from the final archive; include `backend/.env.example` instead.

## Current project map

- `backend/src/server.js`: loads environment configuration, connects to MongoDB, and mounts `/api/auth` and `/api/tasks`.
- `backend/src/routes/auth.js`: registration, login, and refresh-token endpoints.
- `backend/src/routes/tasks.js`: authenticated task CRUD and completion endpoints.
- `backend/src/models/`: Mongoose User and Task schemas.
- `frontend/src/context/AuthContext.jsx`: client login, registration, and session state.
- `frontend/src/api.js`: shared Axios client and token handling.
- `frontend/src/components/TaskList.jsx`: task loading, polling, and current search/status filters.
- `README.md`: prerequisites, environment setup, seed users, start commands, structure, and API overview.

## Running the app

1. Use Node.js 18+ and a MongoDB instance.
2. In `backend/`, install dependencies, copy `.env.example` to `.env`, and set `MONGO_URI`, `JWT_SECRET`, and `REFRESH_SECRET`.
3. Run `npm run seed`, then `npm run dev` in `backend/` (API on port 4000 by default).
4. In a second terminal, install dependencies and run `npm run dev` in `frontend/` (Vite on port 5173 by default; `/api` proxies to the backend).
