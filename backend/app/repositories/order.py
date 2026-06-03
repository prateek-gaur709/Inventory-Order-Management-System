"""Data-access queries for orders."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order


def get(db: Session, order_id: int) -> Order | None:
    return db.get(Order, order_id)


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[Order]:
    stmt = select(Order).order_by(Order.id.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt))


def add(db: Session, order: Order) -> Order:
    db.add(order)
    db.flush()
    return order
