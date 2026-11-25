"""A temporary database per test, and small helpers to build records."""

from datetime import date, datetime

import pytest
from fastapi.testclient import TestClient

from backend import clock
from backend.db import create_tables, make_engine
from backend.main import create_app
from backend.repo import activities as activity_repo
from backend.repo import contacts as contact_repo
from backend.repo import deals as deal_repo
from backend.repo import organizations as org_repo
from backend.schemas import ActivityIn, ContactIn, DealIn, OrganizationIn

TODAY = date(2026, 11, 24)
NOW = datetime(2026, 11, 24, 9, 30)


@pytest.fixture(autouse=True)
def fixed_clock(monkeypatch):
    monkeypatch.setattr(clock, "now", lambda: NOW)
    monkeypatch.setattr(clock, "today", lambda: TODAY)


@pytest.fixture
def db_file(tmp_path, monkeypatch):
    path = tmp_path / "test.db"
    monkeypatch.setenv("ACCOUNTABLE_DB", str(path))
    return path


@pytest.fixture
def engine(db_file):
    engine = make_engine(db_file)
    create_tables(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def conn(engine):
    with engine.begin() as connection:
        yield connection


@pytest.fixture
def client(db_file):
    """An app on an empty database (no sample data)."""
    app = create_app(db_file, seed_if_new=False)
    with TestClient(app) as test_client:
        yield test_client
    app.state.engine.dispose()


def make_org(conn, name="Brightwave Media", **fields) -> int:
    return org_repo.create_organization(conn, OrganizationIn(name=name, **fields), NOW)


def make_contact(conn, name="Tara Nguyen", **fields) -> int:
    return contact_repo.create_contact(conn, ContactIn(name=name, **fields), NOW)


def make_deal(conn, name="Website rebuild", stage="new", value_cents=1_000_000, at=NOW, **fields) -> int:
    return deal_repo.create_deal(
        conn, DealIn(name=name, stage=stage, value_cents=value_cents, **fields), at
    )


def make_activity(conn, description="Called", at=NOW, type="call", **fields) -> int:
    return activity_repo.create_activity(
        conn, ActivityIn(type=type, description=description, happened_at=at, **fields), NOW
    )
