from sqlalchemy import func, select

from backend.db import activities, contacts, deals, organizations, stage_changes
from backend.repo import contacts as contact_repo
from backend.repo import deals as deal_repo
from backend.repo import organizations as org_repo

from .conftest import make_activity, make_contact, make_deal, make_org


def count(conn, table, *where):
    return conn.execute(select(func.count()).select_from(table).where(*where)).scalar_one()


def test_organization_delete_keeps_contacts_and_deals_with_no_organization(conn):
    org = make_org(conn)
    c1 = make_contact(conn, organization_id=org)
    make_contact(conn, name="Other", organization_id=org)
    d1 = make_deal(conn, organization_id=org)
    assert org_repo.delete_impact(conn, org) == {"contacts": 2, "deals": 1}

    org_repo.delete_organization(conn, org)
    assert count(conn, organizations) == 0
    assert count(conn, contacts) == 2
    assert conn.execute(select(contacts.c.organization_id).where(contacts.c.id == c1)).scalar_one() is None
    assert conn.execute(select(deals.c.organization_id).where(deals.c.id == d1)).scalar_one() is None


def test_contact_delete_keeps_deals_and_removes_its_activities(conn):
    contact = make_contact(conn)
    deal = make_deal(conn, contact_id=contact)
    other_deal = make_deal(conn, name="Other", contact_id=contact)
    make_activity(conn, contact_id=contact)
    make_activity(conn, contact_id=contact, description="Second")
    kept = make_activity(conn, deal_id=deal, description="On the deal")
    assert contact_repo.delete_impact(conn, contact) == {"deals": 2, "activities": 2}

    contact_repo.delete_contact(conn, contact)
    assert count(conn, deals) == 2
    assert count(conn, deals, deals.c.contact_id.is_(None)) == 2
    assert count(conn, activities) == 1
    assert count(conn, activities, activities.c.id == kept) == 1
    assert other_deal


def test_deal_delete_removes_its_activities_and_stage_changes(conn):
    deal = make_deal(conn)
    other = make_deal(conn, name="Other")
    deal_repo.move_deal(conn, deal, "qualified", 0, *_today_now())
    make_activity(conn, deal_id=deal)
    make_activity(conn, deal_id=deal, description="Two")
    make_activity(conn, deal_id=other, description="Kept")
    assert deal_repo.delete_impact(conn, deal) == {"activities": 2, "stage_changes": 2}

    deal_repo.delete_deal(conn, deal)
    assert count(conn, activities) == 1
    assert count(conn, stage_changes, stage_changes.c.deal_id == deal) == 0
    assert count(conn, stage_changes, stage_changes.c.deal_id == other) == 1


def test_foreign_keys_are_switched_on(conn):
    (on,) = conn.exec_driver_sql("PRAGMA foreign_keys").one()
    assert on == 1


def _today_now():
    from .conftest import NOW, TODAY

    return TODAY, NOW
