def add(client, name="CRM rollout", stage="new", value_cents=24_000_00, **body):
    reply = client.post("/api/deals", json={"name": name, "stage": stage, "value_cents": value_cents, **body})
    assert reply.status_code == 201, reply.text
    return reply.json()


def test_list_add_get_edit_delete(client):
    org = client.post("/api/organizations", json={"name": "Alder & Finch Law"}).json()
    contact = client.post("/api/contacts", json={"name": "Margaret Finch"}).json()
    deal = add(client, organization_id=org["id"], contact_id=contact["id"], close_date="2026-12-18")
    assert deal["probability"] == 10
    assert deal["organization_name"] == "Alder & Finch Law"
    assert deal["contact_name"] == "Margaret Finch"
    assert deal["is_late"] is False
    assert [e["description"] for e in deal["timeline"]] == ["Created in New"]

    body = {"name": "CRM rollout", "stage": "proposal", "value_cents": 25_000_00, "probability": 50, "close_date": "2026-12-18"}
    reply = client.put(f"/api/deals/{deal['id']}", json=body)
    assert reply.status_code == 200
    edited = reply.json()
    assert edited["stage"] == "proposal" and edited["value_cents"] == 25_000_00
    assert edited["organization_id"] is None
    assert edited["timeline"][0]["description"] == "Moved from New to Proposal"

    assert [d["name"] for d in client.get("/api/deals").json()] == ["CRM rollout"]
    assert client.delete(f"/api/deals/{deal['id']}").status_code == 204
    assert client.get(f"/api/deals/{deal['id']}").status_code == 404


def test_late_flag_in_list(client):
    add(client, "Late", stage="proposal", close_date="2026-11-01")
    add(client, "Not late", stage="won", close_date="2026-11-01")
    add(client, "No date", stage="proposal")
    flags = {d["name"]: d["is_late"] for d in client.get("/api/deals").json()}
    assert flags == {"Late": True, "Not late": False, "No date": False}


def test_move(client):
    first = add(client, "First")
    second = add(client, "Second")
    reply = client.post(f"/api/deals/{first['id']}/move", json={"stage": "negotiation", "index": 0})
    assert reply.status_code == 200
    moved = reply.json()
    assert (moved["stage"], moved["probability"], moved["position"]) == ("negotiation", 75, 0)

    client.post(f"/api/deals/{second['id']}/move", json={"stage": "negotiation", "index": 1})
    column = [d["name"] for d in client.get("/api/deals").json() if d["stage"] == "negotiation"]
    assert column == ["First", "Second"]

    won = client.post(f"/api/deals/{second['id']}/move", json={"stage": "won", "index": 0}).json()
    assert won["close_date"] == "2026-11-24" and won["probability"] == 100


def test_move_errors(client):
    deal = add(client)
    assert client.post("/api/deals/999/move", json={"stage": "won", "index": 0}).status_code == 404
    assert client.post(f"/api/deals/{deal['id']}/move", json={"stage": "maybe", "index": 0}).status_code == 422
    assert client.post(f"/api/deals/{deal['id']}/move", json={"stage": "won", "index": -1}).status_code == 422


def test_required_fields_and_bad_values(client):
    reply = client.post("/api/deals", json={})
    assert reply.status_code == 422
    assert reply.json()["detail"] == "Name is required. Stage is required. Value is required."
    bad_value = client.post("/api/deals", json={"name": "X", "stage": "new", "value_cents": -1})
    assert bad_value.json()["detail"] == "Value must be 0 or more."
    bad_probability = client.post("/api/deals", json={"name": "X", "stage": "new", "value_cents": 1, "probability": 101})
    assert bad_probability.json()["detail"] == "Probability must be 100 or less."
    assert client.post("/api/deals", json={"name": "X", "stage": "new", "value_cents": 1, "contact_id": 999}).status_code == 422


def test_unknown_ids_give_404(client):
    assert client.get("/api/deals/999").status_code == 404
    assert client.put("/api/deals/999", json={"name": "X", "stage": "new", "value_cents": 1}).status_code == 404
    assert client.delete("/api/deals/999").status_code == 404
