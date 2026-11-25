"""Dashboard figures on a small hand-built data set. Today is Tuesday 24 November 2026."""

from datetime import date, datetime, timedelta

import pytest

from backend.repo import dashboard as repo
from backend.repo import deals as deal_repo

from .conftest import TODAY, make_activity, make_contact, make_deal

K = 100_000  # a thousand dollars, in cents


def at(day: str, hour: int = 9) -> datetime:
    return datetime.fromisoformat(day).replace(hour=hour)


@pytest.fixture
def data(conn):
    ids = {}
    # Open deals
    ids["A"] = make_deal(conn, name="A late", stage="proposal", value_cents=10 * K, close_date=date(2026, 11, 20))
    ids["B"] = make_deal(conn, name="B soon", stage="new", value_cents=20 * K, close_date=date(2026, 11, 28))
    for stage in ("qualified", "proposal", "negotiation"):
        deal_repo.move_deal(conn, ids["B"], stage, 0, TODAY, at("2026-11-10"))
    ids["C"] = make_deal(conn, name="C far", stage="new", value_cents=5 * K, close_date=date(2027, 2, 1))
    # Won
    ids["D"] = make_deal(conn, name="D won Nov", stage="won", value_cents=30 * K, close_date=date(2026, 11, 3))
    ids["E"] = make_deal(conn, name="E won a year ago", stage="won", value_cents=7 * K, close_date=date(2025, 11, 30))
    ids["F"] = make_deal(conn, name="F won Jan", stage="won", value_cents=4 * K, close_date=date(2026, 1, 15))
    # Lost from Negotiation, and one that was only ever Lost
    ids["G"] = make_deal(conn, name="G lost", stage="new", value_cents=8 * K)
    for stage in ("qualified", "proposal", "negotiation", "lost"):
        deal_repo.move_deal(conn, ids["G"], stage, 0, date(2026, 6, 1), at("2026-06-01"))
    ids["H"] = make_deal(conn, name="H only lost", stage="lost", value_cents=6 * K, close_date=date(2026, 5, 5))

    contact = make_contact(conn, name="Hana Kim")
    for name, follow_up, done in [
        ("f1 overdue", date(2026, 11, 20), False),
        ("f2 today", TODAY, False),
        ("f3 next week", date(2026, 12, 1), False),
        ("f4 months ahead", date(2027, 3, 10), False),
        ("f5 done", date(2026, 11, 10), True),
        ("f6 overdue older", date(2026, 11, 1), False),
    ]:
        make_activity(conn, description=name, contact_id=contact, follow_up_date=follow_up, done=done, at=at("2026-10-01"))
    return ids


def test_greeting_counts(conn, data):
    figures = repo.dashboard(conn, TODAY)
    # One late deal (A) and one closing in the next 7 days (B).
    assert figures["attention_count"] == 2
    # Two overdue and one due today.
    assert figures["follow_ups_due_count"] == 3


def test_summary_figures(conn, data):
    figures = repo.dashboard(conn, TODAY)
    assert figures["open_count"] == 3
    assert figures["open_value_cents"] == 35 * K
    # 10K x 50% + 20K x 75% + 5K x 10%
    assert figures["expected_revenue_cents"] == 5 * K + 15 * K + K // 2
    assert figures["late_count"] == 1
    # D and F; E closed 30 Nov 2025, before the 12 months (Dec 2025 to Nov 2026).
    assert figures["won_12_months_cents"] == 34 * K


def test_months_by_close_date_with_zeros(conn, data):
    months = repo.dashboard(conn, TODAY)["months"]
    assert len(months) == 12
    assert months[0]["month"] == "2025-12" and months[-1]["month"] == "2026-11"
    assert months[-1]["label"] == "Nov"
    by_month = {m["month"]: (m["won_cents"], m["won_count"]) for m in months}
    assert by_month["2026-01"] == (4 * K, 1)
    assert by_month["2026-11"] == (30 * K, 1)
    assert by_month["2026-06"] == (0, 0)
    assert sum(count for _, count in by_month.values()) == 2


def test_months_across_a_year_end():
    starts = repo.month_starts(date(2027, 1, 1))
    assert starts[0] == date(2026, 2, 1) and starts[-1] == date(2027, 1, 1)


def test_open_value_by_stage(conn, data):
    by_stage = {s["stage"]: s["value_cents"] for s in repo.dashboard(conn, TODAY)["open_by_stage"]}
    assert by_stage == {"new": 5 * K, "qualified": 0, "proposal": 10 * K, "negotiation": 20 * K}


def test_funnel(conn, data):
    funnel = {s["stage"]: (s["value_cents"], s["count"]) for s in repo.dashboard(conn, TODAY)["funnel"]}
    # A (created at Proposal) counts at New, Qualified and Proposal; G (lost from
    # Negotiation) up to Negotiation; H (only ever Lost) nowhere.
    assert funnel == {
        "new": (84 * K, 7),
        "qualified": (79 * K, 6),
        "proposal": (79 * K, 6),
        "negotiation": (69 * K, 5),
        "won": (41 * K, 3),
    }


def test_follow_ups_overdue_first_then_soonest(conn, data):
    follow_ups = repo.dashboard(conn, TODAY)["follow_ups"]
    assert [f["description"] for f in follow_ups] == [
        "f6 overdue older",
        "f1 overdue",
        "f2 today",
        "f3 next week",
        "f4 months ahead",
    ]
    assert [f["overdue"] for f in follow_ups] == [True, True, False, False, False]
    assert follow_ups[0]["contact_name"] == "Hana Kim"


def test_recent_activity_is_the_10_newest_entries(conn):
    contact = make_contact(conn)
    deal = make_deal(conn, name="Old deal", at=at("2026-11-01"))
    start = at("2026-11-02")
    for i in range(11):
        make_activity(conn, description=f"a{i}", contact_id=contact, at=start + timedelta(hours=i))
    deal_repo.move_deal(conn, deal, "qualified", 0, TODAY, start + timedelta(hours=5, minutes=30))

    recent = repo.dashboard(conn, TODAY)["recent"]
    assert len(recent) == 10
    texts = [e["description"] for e in recent]
    assert texts[:6] == ["a10", "a9", "a8", "a7", "a6", "Moved from New to Qualified"]
    assert texts[-1] == "a2"
    assert recent[5]["deal_name"] == "Old deal"
    assert recent[0]["contact_name"] == "Tara Nguyen"


def test_empty_database(conn):
    figures = repo.dashboard(conn, TODAY)
    assert figures["open_count"] == 0
    assert figures["expected_revenue_cents"] == 0
    assert all(m["won_cents"] == 0 for m in figures["months"])
    assert figures["follow_ups"] == [] and figures["recent"] == []
