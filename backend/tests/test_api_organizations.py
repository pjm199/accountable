def add(client, **body):
    reply = client.post("/api/organizations", json={"name": "Harbor Dental", **body})
    assert reply.status_code == 201, reply.text
    return reply.json()


def test_list_add_get_edit_delete(client):
    assert client.get("/api/organizations").json() == []
    org = add(client, website="harbordental.com", industry="Healthcare")
    assert org["name"] == "Harbor Dental" and org["contacts"] == [] and org["deals"] == []

    listed = client.get("/api/organizations").json()
    assert [(o["name"], o["contact_count"], o["open_deal_count"], o["open_value_cents"]) for o in listed] == [
        ("Harbor Dental", 0, 0, 0)
    ]

    reply = client.put(f"/api/organizations/{org['id']}", json={"name": "Harbor Dental Group", "notes": "  "})
    assert reply.status_code == 200
    assert reply.json()["name"] == "Harbor Dental Group"
    assert reply.json()["notes"] is None

    assert client.delete(f"/api/organizations/{org['id']}").status_code == 204
    assert client.get(f"/api/organizations/{org['id']}").status_code == 404


def test_list_counts_contacts_open_deals_and_open_value(client):
    org = add(client)
    client.post("/api/contacts", json={"name": "Priya", "organization_id": org["id"]})
    client.post("/api/deals", json={"name": "Open", "stage": "proposal", "value_cents": 500_00, "organization_id": org["id"]})
    client.post("/api/deals", json={"name": "Won", "stage": "won", "value_cents": 900_00, "organization_id": org["id"]})
    (row,) = client.get("/api/organizations").json()
    assert (row["contact_count"], row["open_deal_count"], row["open_value_cents"]) == (1, 1, 500_00)

    one = client.get(f"/api/organizations/{org['id']}").json()
    assert [c["name"] for c in one["contacts"]] == ["Priya"]
    assert sorted(d["name"] for d in one["deals"]) == ["Open", "Won"]


def test_name_is_required(client):
    reply = client.post("/api/organizations", json={"name": "   "})
    assert reply.status_code == 422
    assert reply.json() == {"detail": "Name is required."}
    assert client.post("/api/organizations", json={}).json() == {"detail": "Name is required."}


def test_unknown_ids_give_404(client):
    for method in ("get", "delete"):
        reply = getattr(client, method)("/api/organizations/999")
        assert reply.status_code == 404
        assert "doesn't exist" in reply.json()["detail"]
    assert client.put("/api/organizations/999", json={"name": "X"}).status_code == 404
