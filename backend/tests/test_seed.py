from collections import Counter
from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import func, select

from backend import rules
from backend.db import activities, contacts, deals, organizations, stage_changes
from backend.seed import seed

NOW = datetime(2026, 11, 24, 9, 30)
TODAY = NOW.date()


@pytest.fixture
def seeded(engine):
    seed(engine, NOW)
    with engine.connect() as conn:
        yield conn


def rows(conn, table):
    return [dict(r) for r in conn.execute(select(table)).mappings()]


def months_back(day: date, months: int) -> tuple[int, int]:
    m = day.year * 12 + day.month - 1 - months
    return m // 12, m % 12 + 1


def test_counts(seeded):
    assert 10 <= len(rows(seeded, organizations)) <= 14
    assert 28 <= len(rows(seeded, contacts)) <= 32
    assert 38 <= len(rows(seeded, deals)) <= 42
    assert 55 <= len(rows(seeded, activities)) <= 65


def test_coverage_of_industries_statuses_stages_and_types(seeded):
    assert len({o["industry"] for o in rows(seeded, organizations)}) >= 6
    assert {c["status"] for c in rows(seeded, contacts)} == set(rules.CONTACT_STATUSES)
    assert {d["stage"] for d in rows(seeded, deals)} == set(rules.STAGES)
    assert {a["type"] for a in rows(seeded, activities)} == set(rules.ACTIVITY_TYPES)


def test_three_or_four_late_deals(seeded):
    late = [d for d in rows(seeded, deals) if rules.is_late(d["stage"], d["close_date"], TODAY)]
    assert 3 <= len(late) <= 4


def test_open_deals_close_over_the_next_three_months(seeded):
    upcoming = [
        d["close_date"]
        for d in rows(seeded, deals)
        if rules.is_open(d["stage"]) and d["close_date"] and d["close_date"] >= TODAY
    ]
    assert len(upcoming) >= 12
    assert max(upcoming) <= TODAY + timedelta(days=100)
    assert max(upcoming) >= TODAY + timedelta(days=60)


def test_wins_and_losses_spread_over_the_past_12_months(seeded):
    all_deals = rows(seeded, deals)
    twelve_months = {months_back(TODAY, i) for i in range(12)}
    won_months = Counter(
        (d["close_date"].year, d["close_date"].month) for d in all_deals if d["stage"] == "won"
    )
    assert set(won_months) <= twelve_months
    assert len(won_months) >= 9
    lost = [d for d in all_deals if d["stage"] == "lost"]
    assert len(lost) >= 4
    assert all(d["close_date"] <= TODAY for d in all_deals if rules.is_closed(d["stage"]))


def test_every_deal_has_a_stage_history_ending_at_its_stage(seeded):
    history = rows(seeded, stage_changes)
    by_deal: dict[int, list] = {}
    for entry in sorted(history, key=lambda e: (e["changed_at"], e["id"])):
        by_deal.setdefault(entry["deal_id"], []).append(entry)
    for deal in rows(seeded, deals):
        entries = by_deal[deal["id"]]
        assert entries[0]["from_stage"] is None
        assert entries[-1]["to_stage"] == deal["stage"]
        for before, after in zip(entries, entries[1:]):
            assert after["from_stage"] == before["to_stage"]


def test_deals_lost_from_different_stages(seeded):
    history = rows(seeded, stage_changes)
    lost_from = {e["from_stage"] for e in history if e["to_stage"] == "lost"}
    assert {"negotiation", "proposal"} <= lost_from


def test_follow_ups_overdue_upcoming_and_done(seeded):
    follow_ups = [a for a in rows(seeded, activities) if a["follow_up_date"]]
    open_ones = [a for a in follow_ups if not a["done"]]
    assert sum(a["follow_up_date"] < TODAY for a in open_ones) >= 3
    assert sum(TODAY <= a["follow_up_date"] <= TODAY + timedelta(days=14) for a in open_ones) >= 4
    assert sum(a["done"] for a in follow_ups) >= 3


def test_nothing_happens_in_the_future(seeded):
    assert all(a["happened_at"] <= NOW for a in rows(seeded, activities))
    assert all(s["changed_at"] <= NOW for s in rows(seeded, stage_changes))


def test_dates_move_with_the_day_the_seed_runs(engine):
    later = NOW + timedelta(days=100)
    seed(engine, later)
    with engine.connect() as conn:
        late = [d for d in rows(conn, deals) if rules.is_late(d["stage"], d["close_date"], later.date())]
        newest = conn.execute(select(func.max(activities.c.happened_at))).scalar_one()
    # The same 3 or 4 deals are late, counted from the new day.
    assert 3 <= len(late) <= 4
    assert newest.date() >= later.date() - timedelta(days=2)


def test_seed_runs_on_the_first_day_of_a_month(engine):
    seed(engine, datetime(2027, 3, 1, 7, 0))
    with engine.connect() as conn:
        assert len(rows(conn, deals)) >= 38


def test_reset_empties_old_data(engine):
    from .conftest import make_org

    seed(engine, NOW)
    with engine.begin() as conn:
        make_org(conn, name="Added by hand")
    seed(engine, NOW)
    with engine.connect() as conn:
        names = [o["name"] for o in rows(conn, organizations)]
    assert "Added by hand" not in names
    assert len(names) == 12
