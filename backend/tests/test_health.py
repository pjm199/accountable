def test_health(client):
    reply = client.get("/api/health")
    assert reply.status_code == 200
    assert reply.json() == {"status": "ok"}
