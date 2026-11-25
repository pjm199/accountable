def add(client, name="Hana Kim", **body):
    reply = client.post("/api/contacts", json={"name": name, **body})
    assert reply.status_code == 201, reply.text
    return reply.json()


def test_list_add_get_edit_delete(client):
    org = client.post("/api/organizations", json={"name": "Greenleaf Grocers"}).json()
    contact = add(client, organization_id=org["id"], email="hana@greenleaf.com")
    assert contact["status"] == "lead"
    assert contact["organization_name"] == "Greenleaf Grocers"
    assert contact["deals"] == [] and contact["timeline"] == []

    reply = client.put(f"/api/contacts/{contact['id']}", json={"name": "Hana Kim", "status": "customer"})
    assert reply.status_code == 200
    assert reply.json()["status"] == "customer"
    assert reply.json()["organization_id"] is None

    assert [c["name"] for c in client.get("/api/contacts").json()] == ["Hana Kim"]
    assert client.delete(f"/api/contacts/{contact['id']}").status_code == 204
    assert client.get(f"/api/contacts/{contact['id']}").status_code == 404


def test_status_filter(client):
    add(client, "Lead One")
    add(client, "Qualified One", status="qualified")
    add(client, "Customer One", status="customer")
    add(client, "Customer Two", status="customer")
    names = lambda status: [c["name"] for c in client.get(f"/api/contacts?status={status}").json()]  # noqa: E731
    assert names("lead") == ["Lead One"]
    assert names("qualified") == ["Qualified One"]
    assert names("customer") == ["Customer One", "Customer Two"]
    assert len(client.get("/api/contacts").json()) == 4
    assert client.get("/api/contacts?status=boss").status_code == 422


def test_contact_page_has_deals_and_timeline(client):
    contact = add(client)
    deal = client.post("/api/deals", json={"name": "Inventory module", "stage": "new", "value_cents": 1, "contact_id": contact["id"]}).json()
    client.post("/api/activities", json={"type": "note", "description": "On deal", "happened_at": "2026-11-20T10:00", "deal_id": deal["id"]})
    one = client.get(f"/api/contacts/{contact['id']}").json()
    assert [d["name"] for d in one["deals"]] == ["Inventory module"]
    assert [(e["description"], e["deal_name"]) for e in one["timeline"]] == [("On deal", "Inventory module")]


def test_required_fields_and_bad_values(client):
    assert client.post("/api/contacts", json={}).json() == {"detail": "Name is required."}
    assert client.post("/api/contacts", json={"name": "X", "status": "vip"}).status_code == 422
    reply = client.post("/api/contacts", json={"name": "X", "organization_id": 999})
    assert reply.status_code == 422
    assert reply.json()["detail"] == "That organization doesn't exist. It may have been deleted."


def test_unknown_ids_give_404(client):
    assert client.get("/api/contacts/999").status_code == 404
    assert client.put("/api/contacts/999", json={"name": "X"}).status_code == 404
    assert client.delete("/api/contacts/999").status_code == 404
