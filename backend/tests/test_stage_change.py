from datetime import date, datetime

from sqlalchemy import select

from backend.db import deals, stage_changes
from backend.repo import deals as deal_repo
from backend.schemas import DealIn

from .conftest import NOW, TODAY, make_deal

LATER = datetime(2026, 11, 24, 11, 0)


def deal(conn, deal_id):
    return conn.execute(select(deals).where(deals.c.id == deal_id)).mappings().one()


def changes(conn, deal_id):
    rows = conn.execute(
        select(stage_changes).where(stage_changes.c.deal_id == deal_id).order_by(stage_changes.c.id)
    ).mappings()
    return [(r["from_stage"], r["to_stage"]) for r in rows]


def edit(conn, deal_id, **fields):
    current = dict(deal(conn, deal_id))
    body = {k: current[k] for k in ("name", "stage", "value_cents", "probability", "close_date")}
    body.update(fields)
    deal_repo.update_deal(conn, deal_id, DealIn(**body), TODAY, LATER)


def test_new_deal_takes_usual_probability_and_gets_created_entry(conn):
    deal_id = make_deal(conn, stage="proposal")
    assert deal(conn, deal_id)["probability"] == 50
    assert changes(conn, deal_id) == [(None, "proposal")]


def test_new_deal_keeps_a_typed_probability(conn):
    deal_id = make_deal(conn, stage="proposal", probability=65)
    assert deal(conn, deal_id)["probability"] == 65


def test_move_resets_probability_and_records_the_change(conn):
    deal_id = make_deal(conn, stage="proposal", probability=65)
    deal_repo.move_deal(conn, deal_id, "negotiation", 0, TODAY, LATER)
    assert deal(conn, deal_id)["probability"] == 75
    assert changes(conn, deal_id) == [(None, "proposal"), ("proposal", "negotiation")]


def test_move_to_won_or_lost_sets_close_date_to_today(conn):
    for stage, probability in (("won", 100), ("lost", 0)):
        deal_id = make_deal(conn, stage="negotiation", close_date=date(2027, 1, 15))
        deal_repo.move_deal(conn, deal_id, stage, 0, TODAY, LATER)
        row = deal(conn, deal_id)
        assert row["close_date"] == TODAY
        assert row["probability"] == probability


def test_moving_back_to_an_open_stage_keeps_the_close_date(conn):
    deal_id = make_deal(conn, stage="negotiation")
    deal_repo.move_deal(conn, deal_id, "won", 0, TODAY, LATER)
    deal_repo.move_deal(conn, deal_id, "proposal", 0, date(2026, 12, 2), LATER)
    row = deal(conn, deal_id)
    assert row["close_date"] == TODAY
    assert row["probability"] == 50
    assert changes(conn, deal_id)[-1] == ("won", "proposal")


def test_move_within_a_column_records_no_change(conn):
    deal_id = make_deal(conn, stage="new")
    make_deal(conn, stage="new", name="Other")
    deal_repo.move_deal(conn, deal_id, "new", 0, TODAY, LATER)
    assert changes(conn, deal_id) == [(None, "new")]


def test_form_save_keeps_the_probability_and_date_it_sends(conn):
    deal_id = make_deal(conn, stage="proposal")
    edit(conn, deal_id, stage="won", probability=90, close_date=date(2026, 11, 20))
    row = deal(conn, deal_id)
    assert row["probability"] == 90
    assert row["close_date"] == date(2026, 11, 20)
    assert changes(conn, deal_id)[-1] == ("proposal", "won")


def test_form_stage_change_without_probability_takes_the_usual_one(conn):
    deal_id = make_deal(conn, stage="proposal")
    edit(conn, deal_id, stage="qualified", probability=None)
    assert deal(conn, deal_id)["probability"] == 25


def test_form_save_without_a_stage_change_records_nothing(conn):
    deal_id = make_deal(conn, stage="proposal")
    edit(conn, deal_id, name="Renamed", probability=60)
    assert changes(conn, deal_id) == [(None, "proposal")]
    assert deal(conn, deal_id)["probability"] == 60


def test_stage_change_entry_has_the_time_of_the_change(conn):
    deal_id = make_deal(conn, stage="new")
    deal_repo.move_deal(conn, deal_id, "qualified", 0, TODAY, LATER)
    times = conn.execute(
        select(stage_changes.c.changed_at).where(stage_changes.c.deal_id == deal_id).order_by(stage_changes.c.id)
    ).scalars().all()
    assert times == [NOW, LATER]
