"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.errors import register_exception_handlers
from app.routers import customers, health, orders, products

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Import models so they register with Base metadata before create_all.
    import app.models  # noqa: F401

    if settings.AUTO_CREATE_TABLES:
        Base.metadata.create_all(bind=engine)
    if settings.SEED_ON_STARTUP:
        from app.seed import seed

        seed()
    yield


app = FastAPI(
    title="Inventory & Order Management System",
    version="1.0.0",
    description="Manage products, customers, orders, and inventory.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"service": "inventory-order-management-system", "docs": "/docs"}
