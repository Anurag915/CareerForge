# CareerForge Backend

The backend is a Flask, Socket.IO, Celery, PostgreSQL, Redis, Gemini, and FAISS service. HTTP processes remain lightweight; expensive analysis runs in independently scalable Celery workers.

## Runtime Architecture

```text
Load balancer
    |
    +-- API container(s) ---- PostgreSQL
    |       |                Redis / Socket.IO
    |       `--------------> Cloudinary
    |
    `-- Celery worker(s) ---> Gemini + embedding model + FAISS
```

Scale API and Celery containers independently. Each API container intentionally runs one Gevent Gunicorn worker because Flask-SocketIO requires that topology; add containers behind a load balancer instead of increasing Gunicorn workers. Redis distributes Socket.IO events across instances.

## Modules

- `api.py`: HTTP and Socket.IO endpoints. Existing route contracts remain unchanged.
- `config.py`: validated environment configuration and URL normalization.
- `extensions.py`: application-independent Flask extension instances.
- `security.py`: reusable JWT authentication and role authorization decorators.
- `socket_events.py`: Socket.IO event registration.
- `routes/`: domain Blueprints such as health and notifications.
- `file_validation.py`: PDF extension, MIME type, signature, size, page, and processing safeguards.
- `observability.py`: JSON logs, request timing, and request IDs.
- `job_dispatcher.py`: Celery dispatch policy and development-only thread fallback.
- `celery_app.py`: reliable queue settings and task registration.
- `tasks.py`: background analysis, optimization, and comparison jobs.
- `db.py`: PostgreSQL pool and persistence operations.
- `llm.py`: Gemini integration.
- `rag.py`: lazy embedding-model loading and synchronized FAISS access.
- `utils.py`, `validation.py`, `comparison.py`: deterministic domain logic.

## Health Probes

- `GET /health/live`: process liveness; does not require external services.
- `GET /health/ready`: database readiness; returns HTTP 503 when PostgreSQL is unavailable.

## Development

```powershell
Copy-Item .env.example .env
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -u api.py
```

Run the worker separately:

```powershell
.\venv\Scripts\celery.exe -A tasks worker --loglevel=info -P solo
```

Run unit tests:

```powershell
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

Set `INITIALIZE_DATABASE=false` in isolated test or tooling processes that must import the HTTP application without opening PostgreSQL connections. Production should leave it enabled until schema creation is replaced by migrations.

## Production Rules

- Set `APP_ENV=production` and provide a strong `JWT_SECRET` of at least 32 characters.
- Configure only trusted origins through `CORS_ORIGINS`.
- Use Redis for Celery, Socket.IO, and distributed rate-limit state.
- Store secrets in the deployment platform, never in the image or repository.
- Mount persistent storage for `data/vector_store`, or replace FAISS files with a managed vector database before scaling writers across multiple hosts.
- Run database schema changes through a migration workflow before deploying multiple API replicas.

## Security Boundaries

- Socket.IO connections require a valid access token and automatically join only the authenticated user's room.
- Background job events and notifications are emitted only to that room.
- Global RAG data is stored in a physically separate FAISS index per user and coordinated with a Redis distributed lock.
- Resume-specific retrieval verifies database ownership before reading its local index.
- Uploads are limited by request size, PDF signature, MIME type, page count, and processing time.
- Hiring-manager self-registration is disabled unless `ALLOW_PUBLIC_HIRING_MANAGER_SIGNUP=true` is explicitly configured.
- Cancelled jobs cannot transition back to completed because the final database write is conditional and atomic.

The Docker image runs as a non-root user, provides a liveness check, emits logs to standard output, and recycles Gunicorn workers after a bounded number of requests.
