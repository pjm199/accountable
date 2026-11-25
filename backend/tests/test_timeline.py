from datetime import datetime

from backend.repo import activities as activity_repo
from backend.repo import deals as deal_repo
from backend.schemas import DealIn

from .conftest import NOW, TODAY, make_activity, make_contact, make_deal


def test_deal_timeline_is_newest_first_with_stage_changes(conn):
    deal = make_deal(conn, stage="new", at=datetime(2026, 11, 1, 9, 0))
    make_activity(conn, deal_id=deal, description="First call", at=datetime(2026, 11, 3, 10, 0))
    deal_repo.move_deal(conn, deal, "qualified", 0, TODAY, datetime(2026, 11, 5, 12, 0))
    make_activity(conn, deal_id=deal, description="Sent notes", type="email", at=datetime(2026, 11, 8, 15, 0))

    timeline = activity_repo.deal_timeline(conn, deal)
    assert [e["description"] for e in timeline] == [
        "Sent notes",
        "Moved from New to Qualified",
        "First call",
        "Created in New",
    ]
    assert [e["kind"] for e in timeline] == ["activity", "stage_change", "activity", "stage_change"]


def test_contact_timeline_includes_activities_on_its_deals(conn):
    contact = make_contact(conn)
    deal = make_deal(conn, name="Inventory module", contact_id=contact)
    make_activity(conn, contact_id=contact, description="Intro call", at=datetime(2026, 11, 2, 9, 0))
    make_activity(conn, deal_id=deal, description="Demo booked", at=datetime(2026, 11, 4, 9, 0))

    timeline = activity_repo.contact_timeline(conn, contact)
    assert [e["description"] for e in timeline] == ["Demo booked", "Intro call"]
    assert timeline[0]["deal_name"] == "Inventory module"
    assert timeline[1]["deal_name"] is None


def test_deal_activities_follow_a_change_of_main_contact(conn):
    first = make_contact(conn, name="First")
    second = make_contact(conn, name="Second")
    deal = make_deal(conn, contact_id=first)
    make_activity(conn, deal_id=deal, description="On the deal")

    assert len(activity_repo.contact_timeline(conn, first)) == 1
    deal_repo.update_deal(
        conn, deal, DealIn(name="Website rebuild", stage="new", value_cents=1, contact_id=second), TODAY, NOW
    )
    assert activity_repo.contact_timeline(conn, first) == []
    assert [e["description"] for e in activity_repo.contact_timeline(conn, second)] == ["On the deal"]
