from fastapi.testclient import TestClient

from backend.main import create_app


def test_a_new_database_is_created_and_seeded(db_file):
    assert not db_file.exists()
    app = create_app(db_file)
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
    app.state.engine.dispose()
    assert db_file.exists()

    from sqlalchemy import func, select

    from backend.db import deals

    with app.state.engine.connect() as conn:
        assert conn.execute(select(func.count()).select_from(deals)).scalar_one() >= 38
    app.state.engine.dispose()


def test_an_existing_database_is_not_seeded_again(db_file):
    from sqlalchemy import func, select

    from backend.db import organizations
    from backend.seed import seed

    first = create_app(db_file)
    with first.state.engine.begin() as conn:
        conn.execute(organizations.delete())
    first.state.engine.dispose()

    second = create_app(db_file)
    with second.state.engine.connect() as conn:
        assert conn.execute(select(func.count()).select_from(organizations)).scalar_one() == 0
    second.state.engine.dispose()
    assert seed


def test_changes_survive_a_restart(db_file):
    first = create_app(db_file, seed_if_new=False)
    with TestClient(first) as client:
        org = client.post("/api/organizations", json={"name": "Kept after restart"}).json()
        client.put(f"/api/organizations/{org['id']}", json={"name": "Kept and edited"})
    first.state.engine.dispose()

    second = create_app(db_file)
    with TestClient(second) as client:
        assert [o["name"] for o in client.get("/api/organizations").json()] == ["Kept and edited"]
    second.state.engine.dispose()
