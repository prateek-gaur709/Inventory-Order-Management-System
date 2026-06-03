"""Business logic for orders: inventory validation, stock adjustment, status flow."""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import (
    InsufficientStockError,
    InvalidStatusTransitionError,
    NotFoundError,
)
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.repositories import customer as customer_repo
from app.repositories import order as repo
from app.schemas.order import OrderCreate, OrderItemCreate

# Allowed status transitions. Terminal states (SHIPPED, CANCELLED) map to nothing.
_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: set(),
    OrderStatus.CANCELLED: set(),
}


def _merge_quantities(items: list[OrderItemCreate]) -> dict[int, int]:
    """Combine duplicate product lines into a single requested quantity each."""
    merged: dict[int, int] = {}
    for item in items:
        merged[item.product_id] = merged.get(item.product_id, 0) + item.quantity
    return merged


def create_order(db: Session, data: OrderCreate) -> Order:
    """Create an order atomically: validate stock for all items, then commit.

    Raises NotFoundError (customer/product), InsufficientStockError. On any
    failure nothing is persisted (single transaction, rolled back).
    """
    if not customer_repo.get(db, data.customer_id):
        raise NotFoundError(f"Customer {data.customer_id} not found.")

    requested = _merge_quantities(data.items)

    # Lock the product rows we are about to decrement to avoid overselling under
    # concurrent order creation. (No-op lock semantics on SQLite, real on Postgres.)
    products = {
        p.id: p
        for p in db.scalars(
            select(Product).where(Product.id.in_(requested.keys())).with_for_update()
        )
    }

    # Validate existence and stock for every line before mutating anything.
    for product_id, qty in requested.items():
        product = products.get(product_id)
        if product is None:
            db.rollback()
            raise NotFoundError(f"Product {product_id} not found.")
        if product.stock_quantity < qty:
            db.rollback()
            raise InsufficientStockError(
                f"Insufficient stock for product '{product.name}' (SKU {product.sku}): "
                f"requested {qty}, available {product.stock_quantity}."
            )

    # All good — build the order, reduce stock, compute total.
    order = Order(customer_id=data.customer_id, status=OrderStatus.PENDING)
    total = Decimal("0")
    for product_id, qty in requested.items():
        product = products[product_id]
        product.stock_quantity -= qty
        unit_price = Decimal(str(product.price))
        total += unit_price * qty
        order.items.append(
            OrderItem(product_id=product_id, quantity=qty, unit_price=unit_price)
        )
    order.total_amount = total

    repo.add(db, order)
    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: int) -> Order:
    order = repo.get(db, order_id)
    if not order:
        raise NotFoundError(f"Order {order_id} not found.")
    return order


def list_orders(db: Session, skip: int = 0, limit: int = 100) -> list[Order]:
    return repo.list_all(db, skip, limit)


def update_status(db: Session, order_id: int, new_status: OrderStatus) -> Order:
    order = get_order(db, order_id)
    if new_status == order.status:
        return order
    if new_status not in _ALLOWED_TRANSITIONS[order.status]:
        raise InvalidStatusTransitionError(
            f"Cannot change order status from {order.status.value} to {new_status.value}."
        )

    # Cancelling returns reserved stock to inventory.
    if new_status == OrderStatus.CANCELLED:
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product:
                product.stock_quantity += item.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
