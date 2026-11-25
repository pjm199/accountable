def setup(client):
    contact = client.post("/api/contacts", json={"name": "Jorge Alvarez"}).json()
    deal = client.post("/api/deals", json={"name": "Multi-site licence", "stage": "negotiation", "value_cents": 1}).json()
    return contact, deal


def test_log_edit_done_delete(client):
    contact, deal = setup(client)
    body = {"type": "call", "description": "Called about price lock", "happened_at": "2026-11-23T09:40", "contact_id": contact["id"], "follow_up_date": "2026-11-26"}
    reply = client.post("/api/activities", json=body)
    assert reply.status_code == 201
    activity = reply.json()
    assert activity["done"] is False and activity["follow_up_date"] == "2026-11-26"

    edited = client.put(f"/api/activities/{activity['id']}", json={**body, "description": "Called again", "follow_up_date": ""}).json()
    assert edited["description"] == "Called again" and edited["follow_up_date"] is None

    assert client.post(f"/api/activities/{activity['id']}/done").json()["done"] is True
    assert client.delete(f"/api/activities/{activity['id']}").status_code == 204
    assert client.get(f"/api/contacts/{contact['id']}").json()["timeline"] == []


def test_activity_on_a_deal_shows_in_the_deal_timeline(client):
    _, deal = setup(client)
    client.post("/api/activities", json={"type": "email", "description": "Sent the contract", "happened_at": "2026-11-24T10:00", "deal_id": deal["id"]})
    timeline = client.get(f"/api/deals/{deal['id']}").json()["timeline"]
    assert [e["description"] for e in timeline] == ["Sent the contract", "Created in Negotiation"]


def test_needs_a_contact_or_a_deal_but_not_both(client):
    contact, deal = setup(client)
    base = {"type": "note", "description": "X", "happened_at": "2026-11-24T08:00"}
    neither = client.post("/api/activities", json=base)
    assert neither.status_code == 422
    assert neither.json()["detail"] == "An activity needs a contact or a deal, but not both."
    both = client.post("/api/activities", json={**base, "contact_id": contact["id"], "deal_id": deal["id"]})
    assert both.status_code == 422


def test_required_fields(client):
    reply = client.post("/api/activities", json={"contact_id": 1})
    assert reply.status_code == 422
    assert reply.json()["detail"] == "Type is required. Description is required. When is required."
    contact, _ = setup(client)
    bad_type = client.post("/api/activities", json={"type": "meeting", "description": "X", "happened_at": "2026-11-24T08:00", "contact_id": contact["id"]})
    assert bad_type.status_code == 422


def test_unknown_ids(client):
    body = {"type": "note", "description": "X", "happened_at": "2026-11-24T08:00", "contact_id": 999}
    assert client.post("/api/activities", json=body).status_code == 422
    assert client.put("/api/activities/999", json=body).status_code == 404
    assert client.post("/api/activities/999/done").status_code == 404
    assert client.delete("/api/activities/999").status_code == 404
