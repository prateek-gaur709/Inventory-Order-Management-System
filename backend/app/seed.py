"""Idempotent demo seed data for products and customers."""
from decimal import Decimal

from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.product import Product

_PRODUCTS = [
    {"sku": "SKU-1001", "name": "Wireless Mouse", "description": "Ergonomic 2.4GHz mouse", "price": Decimal("19.99"), "stock_quantity": 120},
    {"sku": "SKU-1002", "name": "Mechanical Keyboard", "description": "Hot-swappable, RGB", "price": Decimal("79.50"), "stock_quantity": 45},
    {"sku": "SKU-1003", "name": "USB-C Hub", "description": "7-in-1 adapter", "price": Decimal("34.00"), "stock_quantity": 8},
    {"sku": "SKU-1004", "name": "1080p Webcam", "description": "Auto-focus with mic", "price": Decimal("49.99"), "stock_quantity": 60},
]

_CUSTOMERS = [
    {"name": "Asha Rao", "email": "asha@example.com", "phone": "9990001111", "address": "12 MG Road"},
    {"name": "Vikram Singh", "email": "vikram@example.com", "phone": "9990002222", "address": "44 Park St"},
]


def seed() -> None:
    """Insert demo rows if their unique keys are not already present."""
    db = SessionLocal()
    try:
        existing_skus = {p.sku for p in db.query(Product).all()}
        for data in _PRODUCTS:
            if data["sku"] not in existing_skus:
                db.add(Product(**data))

        existing_emails = {c.email for c in db.query(Customer).all()}
        for data in _CUSTOMERS:
            if data["email"] not in existing_emails:
                db.add(Customer(**data))

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed complete.")
