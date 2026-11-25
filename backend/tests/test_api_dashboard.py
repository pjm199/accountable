def test_dashboard_reply_has_every_part(client):
    reply = client.get("/api/dashboard")
    assert reply.status_code == 200
    figures = reply.json()
    for key in (
        "today", "attention_count", "follow_ups_due_count", "expected_revenue_cents",
        "open_value_cents", "won_12_months_cents", "open_count", "late_count",
        "months", "open_by_stage", "funnel", "follow_ups", "recent",
    ):
        assert key in figures
    assert figures["today"] == "2026-11-24"
    assert len(figures["months"]) == 12


def test_dashboard_reflects_a_won_deal_and_a_new_follow_up_straight_away(client):
    deal = client.post("/api/deals", json={"name": "Renewal", "stage": "negotiation", "value_cents": 14_000_00}).json()
    before = client.get("/api/dashboard").json()
    client.post(f"/api/deals/{deal['id']}/move", json={"stage": "won", "index": 0})
    client.post("/api/activities", json={"type": "call", "description": "Book kick-off", "happened_at": "2026-11-24T09:45", "deal_id": deal["id"], "follow_up_date": "2027-04-01"})
    after = client.get("/api/dashboard").json()
    assert after["won_12_months_cents"] == before["won_12_months_cents"] + 14_000_00
    assert after["months"][-1]["won_count"] == 1
    assert [f["description"] for f in after["follow_ups"]] == ["Book kick-off"]
    assert after["recent"][0]["description"] == "Book kick-off"


def test_delete_impact(client):
    org = client.post("/api/organizations", json={"name": "Northline Freight"}).json()
    contact = client.post("/api/contacts", json={"name": "Mara Bell", "organization_id": org["id"]}).json()
    deal = client.post("/api/deals", json={"name": "Fleet", "stage": "new", "value_cents": 1, "organization_id": org["id"], "contact_id": contact["id"]}).json()
    client.post("/api/activities", json={"type": "note", "description": "X", "happened_at": "2026-11-24T08:00", "contact_id": contact["id"]})
    client.post("/api/activities", json={"type": "note", "description": "Y", "happened_at": "2026-11-24T08:00", "deal_id": deal["id"]})

    assert client.get(f"/api/delete-impact/organizations/{org['id']}").json() == {"contacts": 1, "deals": 1}
    assert client.get(f"/api/delete-impact/contacts/{contact['id']}").json() == {"deals": 1, "activities": 1}
    assert client.get(f"/api/delete-impact/deals/{deal['id']}").json() == {"activities": 1, "stage_changes": 1}
    assert client.get("/api/delete-impact/deals/999").status_code == 404
    assert client.get("/api/delete-impact/widgets/1").status_code == 422
