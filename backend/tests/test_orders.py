"""Order API tests — the core business rules."""


def _seed_customer(client):
    return client.post(
        "/customers", json={"name": "Bob", "email": "bob@example.com"}
    ).json()["id"]


def _seed_product(client, sku, stock, price="10.00"):
    return client.post(
        "/products",
        json={"sku": sku, "name": sku, "price": price, "stock_quantity": stock},
    ).json()["id"]


def test_create_order_reduces_stock_and_computes_total(client):
    cid = _seed_customer(client)
    p1 = _seed_product(client, "P1", stock=10, price="10.00")
    p2 = _seed_product(client, "P2", stock=5, price="2.50")

    resp = client.post(
        "/orders",
        json={
            "customer_id": cid,
            "items": [
                {"product_id": p1, "quantity": 3},
                {"product_id": p2, "quantity": 4},
            ],
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    # 3 * 10.00 + 4 * 2.50 = 40.00
    assert float(body["total_amount"]) == 40.00
    assert body["status"] == "PENDING"
    assert len(body["items"]) == 2

    # Stock reduced
    assert client.get(f"/products/{p1}").json()["stock_quantity"] == 7
    assert client.get(f"/products/{p2}").json()["stock_quantity"] == 1


def test_insufficient_stock_rejects_whole_order(client):
    cid = _seed_customer(client)
    p1 = _seed_product(client, "P1", stock=10)
    p2 = _seed_product(client, "P2", stock=1)  # not enough

    resp = client.post(
        "/orders",
        json={
            "customer_id": cid,
            "items": [
                {"product_id": p1, "quantity": 2},
                {"product_id": p2, "quantity": 5},
            ],
        },
    )
    assert resp.status_code == 400
    assert "stock" in resp.json()["detail"].lower()

    # Nothing committed: p1 stock unchanged, no orders exist
    assert client.get(f"/products/{p1}").json()["stock_quantity"] == 10
    assert client.get("/orders").json() == []


def test_order_unknown_product_404(client):
    cid = _seed_customer(client)
    resp = client.post(
        "/orders",
        json={"customer_id": cid, "items": [{"product_id": 9999, "quantity": 1}]},
    )
    assert resp.status_code == 404


def test_order_unknown_customer_404(client):
    p1 = _seed_product(client, "P1", stock=10)
    resp = client.post(
        "/orders",
        json={"customer_id": 9999, "items": [{"product_id": p1, "quantity": 1}]},
    )
    assert resp.status_code == 404


def test_cancel_order_restocks(client):
    cid = _seed_customer(client)
    p1 = _seed_product(client, "P1", stock=10)
    oid = client.post(
        "/orders",
        json={"customer_id": cid, "items": [{"product_id": p1, "quantity": 4}]},
    ).json()["id"]
    assert client.get(f"/products/{p1}").json()["stock_quantity"] == 6

    resp = client.patch(f"/orders/{oid}/status", json={"status": "CANCELLED"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"
    # Restocked
    assert client.get(f"/products/{p1}").json()["stock_quantity"] == 10


def test_valid_status_progression(client):
    cid = _seed_customer(client)
    p1 = _seed_product(client, "P1", stock=10)
    oid = client.post(
        "/orders",
        json={"customer_id": cid, "items": [{"product_id": p1, "quantity": 1}]},
    ).json()["id"]

    assert client.patch(f"/orders/{oid}/status", json={"status": "CONFIRMED"}).status_code == 200
    assert client.patch(f"/orders/{oid}/status", json={"status": "SHIPPED"}).status_code == 200


def test_invalid_status_transition_rejected(client):
    cid = _seed_customer(client)
    p1 = _seed_product(client, "P1", stock=10)
    oid = client.post(
        "/orders",
        json={"customer_id": cid, "items": [{"product_id": p1, "quantity": 1}]},
    ).json()["id"]

    # PENDING -> SHIPPED is not allowed (must confirm first)
    resp = client.patch(f"/orders/{oid}/status", json={"status": "SHIPPED"})
    assert resp.status_code == 400


def test_cannot_change_status_after_cancelled(client):
    cid = _seed_customer(client)
    p1 = _seed_product(client, "P1", stock=10)
    oid = client.post(
        "/orders",
        json={"customer_id": cid, "items": [{"product_id": p1, "quantity": 1}]},
    ).json()["id"]
    client.patch(f"/orders/{oid}/status", json={"status": "CANCELLED"})

    resp = client.patch(f"/orders/{oid}/status", json={"status": "CONFIRMED"})
    assert resp.status_code == 400
