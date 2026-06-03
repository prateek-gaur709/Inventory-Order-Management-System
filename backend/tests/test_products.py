"""Product API tests."""


def _make_product(client, **overrides):
    payload = {
        "sku": "SKU-001",
        "name": "Widget",
        "description": "A useful widget",
        "price": "9.99",
        "stock_quantity": 100,
    }
    payload.update(overrides)
    return client.post("/products", json=payload)


def test_create_product(client):
    resp = _make_product(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["sku"] == "SKU-001"
    assert body["stock_quantity"] == 100
    assert body["id"] > 0


def test_duplicate_sku_conflicts(client):
    _make_product(client)
    resp = _make_product(client, name="Other")
    assert resp.status_code == 409
    assert "sku" in resp.json()["detail"].lower()


def test_list_products(client):
    _make_product(client, sku="A")
    _make_product(client, sku="B")
    resp = client.get("/products")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_update_delete_product(client):
    pid = _make_product(client).json()["id"]

    assert client.get(f"/products/{pid}").json()["sku"] == "SKU-001"

    upd = client.put(f"/products/{pid}", json={"stock_quantity": 50, "price": "5.00"})
    assert upd.status_code == 200
    assert upd.json()["stock_quantity"] == 50

    assert client.delete(f"/products/{pid}").status_code == 204
    assert client.get(f"/products/{pid}").status_code == 404


def test_negative_stock_rejected(client):
    resp = _make_product(client, stock_quantity=-5)
    assert resp.status_code == 422


def test_cannot_delete_product_in_an_order(client):
    pid = _make_product(client).json()["id"]
    cid = client.post(
        "/customers", json={"name": "Buyer", "email": "buyer@example.com"}
    ).json()["id"]
    client.post("/orders", json={"customer_id": cid, "items": [{"product_id": pid, "quantity": 1}]})

    resp = client.delete(f"/products/{pid}")
    assert resp.status_code == 409
    assert "order" in resp.json()["detail"].lower()
    # Product still exists (clean rejection, not a 500).
    assert client.get(f"/products/{pid}").status_code == 200
