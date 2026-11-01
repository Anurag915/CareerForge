# CareerForge

CareerForge is an AI-assisted resume analysis and candidate comparison platform. It combines deterministic ATS scoring with Google Gemini, semantic retrieval, background processing, and a React dashboard to help candidates and hiring teams evaluate resumes against real job descriptions.

> CareerForge currently uses **Google Gemini (`gemini-flash-latest`)** for generated analysis and chat responses. Ollama is no longer part of the active application path.

## What CareerForge Does

- Scores resumes against a target job description.
- Identifies matched and missing skills.
- Produces focused AI recommendations and resume critiques.
- Compares multiple resumes and ranks candidates.
- Provides resume-aware AI chat using semantic retrieval.
- Stores resumes, analysis history, comparisons, jobs, and notifications.
- Processes long-running analysis through Celery and Redis.
- Streams job progress and notifications through Socket.IO.
- Supports candidate and hiring-manager accounts.
- Includes email verification, password recovery, and rotating refresh tokens.

## Product Preview

| Dashboard | Resume Upload |
|:---:|:---:|
| ![Dashboard](Outputs/Screenshot%202026-05-05%20161711.png) | ![Upload](Outputs/Screenshot%202026-05-05%20161728.png) |

| Analysis | AI Copilot |
|:---:|:---:|
| ![Analysis](Outputs/Screenshot%202026-05-05%20161928.png) | ![Chat](Outputs/Screenshot%202026-05-05%20162008.png) |

| Resume Comparison | Job History |
|:---:|:---:|
| ![Comparison](Outputs/Screenshot%202026-05-05%20162304.png) | ![History](Outputs/Screenshot%202026-05-05%20162335.png) |

## Architecture

```text
React 19 + Vite
       |
       | REST + Socket.IO
       v
Flask API
  |-- PostgreSQL: users, resumes, jobs, analyses, chat, notifications
  |-- Redis: Celery broker and Socket.IO message queue
  |-- Celery: background analysis and comparison jobs
  |-- Gemini: resume critique, comparisons, and chat responses
  |-- Sentence Transformers + FAISS: semantic resume retrieval
  |-- Cloudinary: optional persistent PDF storage
  `-- SMTP: verification and password-reset email
```

## Technology Stack

### Frontend

- React 19
- Vite 8
- React Router
- TanStack Query
- Tailwind CSS 4
- Framer Motion
- Socket.IO Client
- Axios
- React PDF Viewer
- Lucide icons

### Backend

- Python and Flask
- Flask-SocketIO
- PostgreSQL with `psycopg2`
- Celery and Redis
- Google Gen AI SDK
- Sentence Transformers
- FAISS
- `pdfplumber` and PyPDF2
- JWT and bcrypt authentication
- Cloudinary
- Gunicorn and Gevent for Linux production

## AI and Scoring Pipeline

CareerForge deliberately separates deterministic scoring from generated feedback.

1. The uploaded PDF is parsed into text and resume sections.
2. Rule-based logic calculates ATS compatibility, skill matches, experience, and project signals.
3. `all-MiniLM-L6-v2` creates local embeddings for FAISS retrieval.
4. Gemini generates critiques, comparisons, suggestions, and chat responses.
5. Validation and cleanup utilities normalize model output before it reaches the UI.

The active Gemini model is configured through `GEMINI_MODEL` and defaults in [`server/config.py`](server/config.py):

```python
GEMINI_MODEL=gemini-flash-latest
```

## Repository Structure

```text
CareerForge/
|-- frontend/
|   |-- src/
|   |   |-- api/             # React Query hooks and mutations
|   |   |-- components/      # Pages and reusable UI
|   |   |-- context/         # Authentication, chat, and theme state
|   |   `-- services/        # Axios API client
|   |-- public/              # Logos and public assets
|   `-- Dockerfile
|-- server/
|   |-- api.py               # Flask routes and Socket.IO server
|   |-- config.py            # Validated environment configuration
|   |-- observability.py     # JSON logging and request tracing
|   |-- job_dispatcher.py    # Background-job dispatch policy
|   |-- auth_utils.py        # JWT, refresh tokens, and email delivery
|   |-- db.py                # PostgreSQL persistence
|   |-- tasks.py             # Celery analysis jobs
|   |-- llm.py               # Active Gemini integration
|   |-- rag.py               # Sentence Transformer and FAISS retrieval
|   |-- comparison.py        # Candidate comparison pipeline
|   |-- utils.py             # Parsing and deterministic ATS scoring
|   |-- validation.py        # Model-output validation
|   `-- Dockerfile
|-- Outputs/                 # Product screenshots
|-- docker-compose.yml
`-- README.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js 20 or newer
- PostgreSQL database, local or hosted
- Redis, local or hosted
- Google Gemini API key
- Optional Cloudinary account for persistent PDF previews
- SMTP credentials for account verification and password recovery

The embedding model is downloaded from Hugging Face on the first backend start. Later starts use the local cache.

## Environment Configuration

Copy the example file and fill in your credentials:

```powershell
cd server
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cd server
cp .env.example .env
```

Required variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Google Gemini API access |
| `GEMINI_MODEL` | Gemini model name; defaults to `gemini-flash-latest` |
| `EMBEDDING_MODEL` | Sentence Transformer model name |
| `JWT_SECRET` | Secret used to sign access tokens |
| `REDIS_URL` | Celery broker and Socket.IO message queue |
| `FRONTEND_URL` | Frontend origin used in email links and CORS |
| `CORS_ORIGINS` | Comma-separated list of trusted browser origins |
| `MAX_UPLOAD_MB` | Maximum request size for uploaded PDFs |
| `MAX_PDF_PAGES` | Maximum pages parsed from one PDF |
| `PDF_PROCESSING_TIMEOUT_SECONDS` | PDF parsing time budget |

Optional or feature-specific variables:

| Variable | Purpose |
|---|---|
| `HF_TOKEN` | Higher Hugging Face download limits |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP host; defaults to `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port; defaults to `465` |
| `SMTP_USER` | Verification-email sender |
| `SMTP_PASSWORD` | SMTP password or app password |

Generate a strong JWT secret, for example:

```powershell
python -c "import secrets; print(secrets.token_hex(64))"
```

Never commit `server/.env` or place secrets in frontend environment variables.

## Local Installation

### Backend

Windows:

```powershell
cd server
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

macOS or Linux:

```bash
cd server
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Running Locally

Use four terminals for the complete stack.

### 1. Start Redis

With Docker:

```bash
docker run --name careerforge-redis -p 6379:6379 redis:alpine
```

Or start your existing Redis service.

### 2. Start the Flask API

Windows:

```powershell
cd server
.\venv\Scripts\python.exe -u api.py
```

macOS or Linux:

```bash
cd server
source venv/bin/activate
python -u api.py
```

The API runs at `http://127.0.0.1:5000`.

On Windows, the development server uses Flask-SocketIO's threading backend to avoid the Python 3.13, Gevent, and Windows SSL recursion issue. Linux production continues to use Gevent.

If the embedding model is already cached and Hugging Face is temporarily unavailable:

```powershell
$env:HF_HUB_OFFLINE="1"
.\venv\Scripts\python.exe -u api.py
```

### 3. Start the Celery Worker

Windows:

```powershell
cd server
.\venv\Scripts\celery.exe -A tasks worker --loglevel=info -P solo
```

macOS or Linux:

```bash
cd server
celery -A tasks worker --loglevel=info
```

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Docker Compose

Create `server/.env` before starting the stack. Docker Compose loads this file at container runtime for backend and Celery services.

```bash
docker compose up --build
```

| Service | Address |
|---|---|
| Frontend | `http://localhost` |
| Backend | `http://localhost:5000` |
| Redis | `localhost:6379` |

Stop the stack:

```bash
docker compose down
```

Remove containers and persisted backend data:

```bash
docker compose down -v
```

## Authentication

- Access tokens expire after 15 minutes.
- Refresh tokens are random, hashed in PostgreSQL, rotated on use, and stored in an HTTP-only cookie.
- New accounts must verify their email before signing in.
- Password reset links expire after one hour.
- Candidate and hiring-manager roles are available during registration.

For local cross-origin development, the frontend and backend must use compatible origins and cookie settings. Secure cookies may require HTTPS depending on the browser and environment.

## API Overview

Major endpoint groups include:

- `/signup`, `/login`, `/refresh`, `/logout`
- `/verify-email`, `/forgot-password`, `/reset-password`
- `/upload`, `/analyze-advanced`, `/analyze/<resume_id>`
- `/resumes`, `/history`
- `/compare`, `/compare-my-resumes`
- `/api/jobs`, `/api/job/<job_id>`
- `/api/comparisons`
- `/api/chat/sessions`
- `/api/notifications`

Protected endpoints expect:

```http
Authorization: Bearer <access-token>
```

## Frontend Design

The current interface uses a dark, violet-first visual system:

- Primary accent: `#8A4CEF`
- Application background: `#08070E`
- Surface background: `#111018`
- Typography: Inter-first system font stack
- Responsive, fixed-height authentication screens
- Fixed landing-page navigation

Shared design tokens live in [`frontend/src/index.css`](frontend/src/index.css).

## Build and Quality Checks

Frontend production build:

```bash
cd frontend
npm run build
```

Frontend lint:

```bash
npm run lint
```

Python syntax check:

```powershell
cd server
.\venv\Scripts\python.exe -m compileall -q -x "venv" .
```

## Data and Privacy Notes

- Resume text and job descriptions are sent to Google Gemini for AI-generated feedback.
- Persisted PDFs may be uploaded to Cloudinary when Cloudinary is configured.
- Parsed resume data, authentication data, analysis history, and chat messages are stored in PostgreSQL.
- FAISS indexes are stored under `server/data/vector_store` and excluded from Git.

Do not describe the current system as fully local or offline. Only deterministic scoring and embedding generation run locally; generated feedback uses Gemini.

## Current Limitations

- The frontend bundle is large and should be code-split.
- Automated backend and end-to-end tests still need to be added.
- Database schema creation still needs to move to versioned migrations.
- Authenticated, user-scoped Socket.IO job subscriptions require the corresponding frontend socket-token update.
- Multi-host FAISS writers should be replaced with a managed vector store or coordinated through a distributed lock.
- Production deployments should use managed secrets, HTTPS, persistent storage, and production Redis.

## License

Add the intended project license before distributing CareerForge publicly.
