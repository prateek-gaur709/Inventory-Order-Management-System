"""Customer API tests."""


def _make_customer(client, **overrides):
    payload = {
        "name": "Alice",
        "email": "alice@example.com",
        "phone": "1234567890",
        "address": "1 Main St",
    }
    payload.update(overrides)
    return client.post("/customers", json=payload)


def test_create_customer(client):
    resp = _make_customer(client)
    assert resp.status_code == 201
    assert resp.json()["email"] == "alice@example.com"


def test_duplicate_email_conflicts(client):
    _make_customer(client)
    resp = _make_customer(client, name="Alice Two")
    assert resp.status_code == 409
    assert "email" in resp.json()["detail"].lower()


def test_invalid_email_rejected(client):
    resp = _make_customer(client, email="not-an-email")
    assert resp.status_code == 422


def test_get_update_delete_customer(client):
    cid = _make_customer(client).json()["id"]
    assert client.get(f"/customers/{cid}").json()["name"] == "Alice"

    upd = client.put(f"/customers/{cid}", json={"name": "Alice Updated"})
    assert upd.status_code == 200
    assert upd.json()["name"] == "Alice Updated"

    assert client.delete(f"/customers/{cid}").status_code == 204
    assert client.get(f"/customers/{cid}").status_code == 404
