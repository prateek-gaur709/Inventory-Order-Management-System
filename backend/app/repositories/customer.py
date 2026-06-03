"""Data-access queries for customers."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer


def get(db: Session, customer_id: int) -> Customer | None:
    return db.get(Customer, customer_id)


def get_by_email(db: Session, email: str) -> Customer | None:
    return db.scalar(select(Customer).where(Customer.email == email))


def list_all(db: Session, skip: int = 0, limit: int = 100) -> list[Customer]:
    return list(db.scalars(select(Customer).offset(skip).limit(limit)))


def add(db: Session, customer: Customer) -> Customer:
    db.add(customer)
    db.flush()
    return customer
