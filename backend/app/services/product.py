"""Business logic for products."""
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.models.product import Product
from app.repositories import product as repo
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, data: ProductCreate) -> Product:
    if repo.get_by_sku(db, data.sku):
        raise ConflictError(f"A product with SKU '{data.sku}' already exists.")
    product = Product(**data.model_dump())
    repo.add(db, product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product:
    product = repo.get(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found.")
    return product


def list_products(db: Session, skip: int = 0, limit: int = 100) -> list[Product]:
    return repo.list_all(db, skip, limit)


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()
