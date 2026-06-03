"""Business logic for customers."""
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.models.customer import Customer
from app.repositories import customer as repo
from app.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(db: Session, data: CustomerCreate) -> Customer:
    if repo.get_by_email(db, data.email):
        raise ConflictError(f"A customer with email '{data.email}' already exists.")
    customer = Customer(**data.model_dump())
    repo.add(db, customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = repo.get(db, customer_id)
    if not customer:
        raise NotFoundError(f"Customer {customer_id} not found.")
    return customer


def list_customers(db: Session, skip: int = 0, limit: int = 100) -> list[Customer]:
    return repo.list_all(db, skip, limit)


def update_customer(db: Session, customer_id: int, data: CustomerUpdate) -> Customer:
    customer = get_customer(db, customer_id)
    updates = data.model_dump(exclude_unset=True)
    new_email = updates.get("email")
    if new_email and new_email != customer.email and repo.get_by_email(db, new_email):
        raise ConflictError(f"A customer with email '{new_email}' already exists.")
    for field, value in updates.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        # Customer is referenced by one or more orders (FK constraint).
        db.rollback()
        raise ConflictError(
            "Cannot delete this customer because they have existing orders. "
            "Cancel or remove their orders first."
        ) from exc
