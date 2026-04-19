# Deployment Guide

## Important note
I cannot publish a public website URL from this local workspace because it does not have access to an external hosting account or Docker deployment environment.

This guide prepares your app for deployment and explains how to get a final shareable link.

---

## Project structure
- `frontend/` — Vite + React UI
- `backend/` — FastAPI API
- `backend/Dockerfile` — Docker image for the backend
- `frontend/.env.example` — example env var for production backend URL

---

## Option 1: Deploy backend with Render (recommended for Python + RDKit)

1. Push the repo to GitHub.
2. Create a Render account and link your GitHub repository.
3. Add a new Web Service.
4. Set the root directory to `backend` and use the `Dockerfile` already included.
5. Set the build and start command if required:
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy.

Render will provide a public backend URL, e.g. `https://your-backend.onrender.com`.

---

## Option 2: Deploy frontend with Vercel or Netlify

### Vercel
1. Link the same GitHub repo.
2. Set the root path to `frontend`.
3. Configure build command: `npm install && npm run build`.
4. Configure output directory: `dist`.
5. Add environment variable:
   - `VITE_API_BASE_URL=https://your-backend.example.com`
6. Deploy.

### Netlify
1. Link GitHub repo.
2. Set base directory to `frontend`.
3. Build command: `npm install && npm run build`.
4. Publish directory: `dist`.
5. Add env var `VITE_API_BASE_URL`.

Netlify/Vercel will give you the public website URL.

---

## Option 3: Deploy full stack locally with Docker Compose

This is for local testing only, not public hosting.

1. Install Docker on your machine.
2. Run:
   ```bash
   docker compose up --build
   ```
3. Open `http://localhost:4173`.

---

## Required production environment variable
Set this in the frontend host environment:

```text
VITE_API_BASE_URL=https://your-backend.example.com
```

If you deploy the backend to Render or another host, use the exact URL given by the host.

---

## If you want me to continue
I can help you complete a deployment if you provide one of these:
- a hosting account connected to this repo (e.g. Render, Vercel, Fly.io)
- a GitHub repo link and permission to use it
- a cloud provider where I can create the service for you

Without an external hosting account or Docker environment here, I cannot produce the final public link directly.
