# Inventory & Order Management System

A simplified full-stack Inventory & Order Management System for managing **products**,
**customers**, **orders**, and **inventory tracking**.

- **Backend:** FastAPI (Python 3.12) + SQLAlchemy + Pydantic
- **Frontend:** React 18 + Vite
- **Database:** PostgreSQL
- **Containerized:** Docker + Docker Compose

---

## 🔗 Deliverables

| Item | Link |
|------|------|
| GitHub repository | _\<add after push>_ |
| Backend Docker Hub image | https://hub.docker.com/r/prateekgaur9090/inventory-oms-backend |
| Frontend hosted URL (Vercel) | _\<add after deploy>_ |
| Backend API hosted URL (Render) | https://inventory-oms-backend-latest.onrender.com — Swagger at [`/docs`](https://inventory-oms-backend-latest.onrender.com/docs) |

---

## Features & Business Rules

- **Products** — CRUD with **unique SKU** (duplicate → `409`).
- **Customers** — CRUD with **unique email** (duplicate → `409`, invalid → `422`).
- **Orders** — multi-item orders (line items with quantities).
  - **Inventory validation:** an order is rejected with `400` if *any* line item
    exceeds available stock; nothing is committed (atomic, single transaction).
  - **Automatic stock reduction** on successful order; total computed server-side.
  - **Status lifecycle:** `PENDING → CONFIRMED → SHIPPED`, or `→ CANCELLED`.
    Invalid transitions → `400`. **Cancelling restocks** inventory.
  - Concurrency-safe via row locks (`SELECT … FOR UPDATE`).
- **Config via environment variables only** — no hardcoded credentials.

---

## API

Interactive docs (Swagger UI) at `GET /docs` once the backend is running.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET/POST | `/products` | List / create products |
| GET/PUT/DELETE | `/products/{id}` | Get / update / delete a product |
| GET/POST | `/customers` | List / create customers |
| GET/PUT/DELETE | `/customers/{id}` | Get / update / delete a customer |
| GET/POST | `/orders` | List / create orders |
| GET | `/orders/{id}` | Order detail |
| PATCH | `/orders/{id}/status` | Update order status |

---

## Run locally with Docker (recommended)

Requires Docker Desktop.

```bash
cp .env.example .env        # optional — sane defaults are built in
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:8000 (Swagger at http://localhost:8000/docs)
- PostgreSQL → localhost:5432

The backend auto-creates tables and seeds a few demo products/customers on startup
(`SEED_ON_STARTUP=true`).

Tear down:

```bash
docker compose down          # keep data
docker compose down -v       # also remove the database volume
```

---

## Run without Docker (dev)

**Backend**

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# point at any Postgres, or use SQLite for a quick spin:
export DATABASE_URL="sqlite:///./dev.db"
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev      # http://localhost:5173
```

---

## Tests

```bash
cd backend
.venv/bin/python -m pytest -q
```

The suite covers the inventory rules (stock reduction, insufficient-stock rejection,
cancellation restock), unique SKU/email conflicts, and status-transition rules.

---

## Environment variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend | SQLAlchemy database URL |
| `BACKEND_CORS_ORIGINS` | backend | Comma-separated allowed origins |
| `AUTO_CREATE_TABLES` | backend | Create tables on startup (default `true`) |
| `SEED_ON_STARTUP` | backend | Seed demo data on startup |
| `VITE_API_URL` | frontend | Base URL of the backend API (build-time) |
| `POSTGRES_USER/PASSWORD/DB` | compose | Postgres credentials |

See `.env.example`, `backend/.env.example`, and `frontend/.env.example`.

---

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for step-by-step instructions to publish
the backend image to Docker Hub, deploy the backend + PostgreSQL on **Render**, and the
frontend on **Vercel**.

---

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, error handlers
│   │   ├── models/        # SQLAlchemy ORM
│   │   ├── schemas/       # Pydantic models
│   │   ├── repositories/  # DB queries
│   │   ├── services/      # business rules
│   │   ├── routers/       # HTTP endpoints
│   │   ├── seed.py
│   │   └── main.py
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/{api,components,pages}/
│   └── Dockerfile
├── docker-compose.yml
└── docs/
```
