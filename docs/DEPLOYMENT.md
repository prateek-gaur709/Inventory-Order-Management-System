# Deployment Guide

Publish the backend image to **Docker Hub**, deploy the backend + PostgreSQL on
**Render**, and the frontend on **Vercel**. All four deliverable URLs come from these
steps.

> Replace `<DOCKERHUB_USER>` with your Docker Hub username throughout.

---

## 1. Push code to GitHub

```bash
cd inventory-order-management-system
git init
git add .
git commit -m "feat: inventory & order management system"
git branch -M main
git remote add origin https://github.com/<you>/inventory-order-management-system.git
git push -u origin main
```

---

## 2. Build & push the backend image to Docker Hub

```bash
cd backend
docker login
# Build for the linux/amd64 platform that Render runs:
docker buildx build --platform linux/amd64 \
  -t <DOCKERHUB_USER>/inventory-oms-backend:latest \
  --push .
```

**Deliverable:** `https://hub.docker.com/r/<DOCKERHUB_USER>/inventory-oms-backend`

---

## 3. Deploy the backend + database on Render

1. Create a **PostgreSQL** instance: Render dashboard → **New → PostgreSQL** (free
   plan). Copy its **Internal Database URL**.
2. Create a **Web Service** → **Deploy an existing image from a registry** →
   `docker.io/<DOCKERHUB_USER>/inventory-oms-backend:latest`.
   (Or "Build and deploy from a repository", root dir `backend/`.)
3. Set **environment variables**:
   - `DATABASE_URL` → the Render Postgres URL, **rewritten** to the SQLAlchemy psycopg2
     form: `postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DBNAME`
     (Render gives `postgresql://…`; prepend the `+psycopg2`.)
   - `BACKEND_CORS_ORIGINS` → your Vercel URL (set after step 4; can update later),
     e.g. `https://your-frontend.vercel.app`
   - `AUTO_CREATE_TABLES` → `true`
   - `SEED_ON_STARTUP` → `true` (optional demo data)
4. Render injects `$PORT`; the Dockerfile already binds to it. Deploy.
5. Verify: open `https://<your-backend>.onrender.com/docs`.

**Deliverable:** `https://<your-backend>.onrender.com`

> Free Render services sleep when idle and take ~30–60s to wake on the first request.

---

## 4. Deploy the frontend on Vercel

1. Vercel dashboard → **Add New → Project** → import the GitHub repo.
2. **Root Directory:** `frontend`. Framework preset: **Vite** (build `npm run build`,
   output `dist`).
3. **Environment variable:** `VITE_API_URL` → your Render backend URL
   (e.g. `https://<your-backend>.onrender.com`).
4. Deploy.
5. Copy the Vercel URL and add it to the backend's `BACKEND_CORS_ORIGINS` on Render,
   then redeploy the backend so CORS allows the frontend.

**Deliverable:** `https://<your-frontend>.vercel.app`

---

## 5. Final smoke test on public URLs

```bash
BASE=https://<your-backend>.onrender.com
curl -s $BASE/health
curl -s $BASE/products | head
```

Then open the Vercel URL and run through: add a product → add a customer →
place an order (watch stock drop) → try to over-order (see the insufficient-stock
error) → change order status.

---

## 6. Fill in the deliverable links

Update the table at the top of [`../README.md`](../README.md) with all four URLs.
