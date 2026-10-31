# TaskFlow — Starter App

A small MERN task-management app: Express + MongoDB backend, React (Vite) frontend, JWT auth.

The app supports task search and filtering by status, assignee, and due-date range. Users can save named, private filter views to their account and reload them later.

## Prerequisites

- Node.js 18+
- A MongoDB instance (local install, Docker, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB connection string,
# and set JWT_SECRET / REFRESH_SECRET to any random strings
npm run seed   # creates 5 users and 20 tasks
npm run dev    # starts the API on http://localhost:4000
```

`backend/.env` contains local credentials and is ignored by Git. Keep it out of
the source repository and submission archive; use `.env.example` as the
configuration template.

Seed users (all share the password `password123`):
- asha@taskflow.dev (admin)
- ben@taskflow.dev
- chen@taskflow.dev
- dina@taskflow.dev
- elan@taskflow.dev

## Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev    # starts the app on http://localhost:5173
```

The frontend dev server proxies `/api` requests to `http://localhost:4000`, so make sure the backend is running first.

## Project structure

```
backend/
  src/
    models/       Mongoose schemas (User, Task)
    routes/       auth.js, tasks.js
    middleware/   auth.js (JWT verification)
    seed.js       seed script
    server.js     entrypoint
frontend/
  src/
    context/      AuthContext (login/register/logout, token storage)
    pages/        Login, Register, Dashboard
    components/   Navbar, TaskList, TaskItem
```

## API overview

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Log in |
| POST | `/api/auth/refresh` | No | Exchange a refresh token for a new access token |
| GET | `/api/tasks` | Yes | List tasks; supports `search`, `status`, `assignee`, `dueDateFrom`, and `dueDateTo` query parameters |
| GET | `/api/tasks/assignees` | Yes | List users available in the assignee filter |
| GET | `/api/tasks/views` | Yes | List the signed-in user's saved views |
| POST | `/api/tasks/views` | Yes | Save or replace a named view; body: `{ "name": "...", "filters": { "search": "", "status": "", "assignee": "", "dueDateFrom": "", "dueDateTo": "" } }` |
| DELETE | `/api/tasks/views/:viewId` | Yes | Delete one of the signed-in user's saved views |
| POST | `/api/tasks` | Yes | Create a task |
| PATCH | `/api/tasks/:id` | Yes | Update a task |
| PATCH | `/api/tasks/:id/complete` | Yes | Mark a task done |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |

### Filter and saved-view behavior

- Saved views belong to the signed-in user and are stored in MongoDB, so they are available after refreshes and on another device after signing in.
- Saving another view with the same name for the same user replaces its filters.
- Date inputs use UTC calendar dates. Both endpoints are inclusive: the start begins at 00:00 UTC and the end includes the full selected UTC day.
- If an assignee is later deleted, a saved view keeps the assignee ID. The filter continues matching tasks that still reference that ID, and the UI shows the assignee as unavailable.

Good luck!
