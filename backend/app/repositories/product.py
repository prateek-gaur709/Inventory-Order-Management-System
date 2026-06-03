"""Data-access queries for products."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product


def get(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def get_by_sku(db: Session, sku: str) -> Product | None:
    return db.scalar(select(Product).where(Product.sku == sku))


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[Product]:
    return list(db.scalars(select(Product).offset(skip).limit(limit)))


def add(db: Session, product: Product) -> Product:
    db.add(product)
    db.flush()
    return product
