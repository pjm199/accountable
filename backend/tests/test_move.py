from sqlalchemy import select

from backend.db import deals
from backend.repo import deals as deal_repo
from backend.schemas import DealIn

from .conftest import NOW, TODAY, make_deal


def column(conn, stage):
    rows = conn.execute(
        select(deals.c.name, deals.c.position).where(deals.c.stage == stage).order_by(deals.c.position)
    ).all()
    return [r.name for r in rows], [r.position for r in rows]


def names(conn, stage):
    return column(conn, stage)[0]


def board(conn):
    """Three deals in New (A at the top) and two in Qualified (D at the top)."""
    ids = {}
    for name in ("C", "B", "A"):
        ids[name] = make_deal(conn, name=name, stage="new")
    for name in ("E", "D"):
        ids[name] = make_deal(conn, name=name, stage="qualified")
    return ids


def move(conn, deal_id, stage, index):
    deal_repo.move_deal(conn, deal_id, stage, index, TODAY, NOW)


def test_new_deals_land_at_the_top(conn):
    board(conn)
    assert names(conn, "new") == ["A", "B", "C"]
    assert names(conn, "qualified") == ["D", "E"]


def test_move_within_a_column_down_and_up(conn):
    ids = board(conn)
    move(conn, ids["A"], "new", 2)
    assert names(conn, "new") == ["B", "C", "A"]
    move(conn, ids["C"], "new", 0)
    assert names(conn, "new") == ["C", "B", "A"]


def test_move_to_a_middle_spot(conn):
    ids = board(conn)
    move(conn, ids["A"], "new", 1)
    assert names(conn, "new") == ["B", "A", "C"]


def test_move_between_columns(conn):
    ids = board(conn)
    move(conn, ids["B"], "qualified", 1)
    assert names(conn, "new") == ["A", "C"]
    assert names(conn, "qualified") == ["D", "B", "E"]


def test_move_to_top_and_bottom_of_another_column(conn):
    ids = board(conn)
    move(conn, ids["A"], "qualified", 0)
    assert names(conn, "qualified") == ["A", "D", "E"]
    move(conn, ids["C"], "qualified", 99)
    assert names(conn, "qualified") == ["A", "D", "E", "C"]


def test_move_to_an_empty_column(conn):
    ids = board(conn)
    move(conn, ids["A"], "proposal", 0)
    assert names(conn, "proposal") == ["A"]


def test_positions_stay_unique_and_in_order(conn):
    ids = board(conn)
    move(conn, ids["B"], "qualified", 1)
    move(conn, ids["E"], "new", 0)
    for stage in ("new", "qualified"):
        positions = column(conn, stage)[1]
        assert positions == list(range(len(positions)))


def test_moving_to_the_same_place_changes_nothing(conn):
    ids = board(conn)
    before = {s: column(conn, s) for s in ("new", "qualified")}
    move(conn, ids["B"], "new", 1)
    assert {s: column(conn, s) for s in ("new", "qualified")} == before


def test_form_stage_change_lands_at_the_top(conn):
    ids = board(conn)
    deal_repo.update_deal(
        conn, ids["C"], DealIn(name="C", stage="qualified", value_cents=1_000_000), TODAY, NOW
    )
    assert names(conn, "qualified") == ["C", "D", "E"]
    assert names(conn, "new") == ["A", "B"]
    assert column(conn, "new")[1] == [0, 1]


def test_form_save_without_stage_change_keeps_the_place(conn):
    ids = board(conn)
    deal_repo.update_deal(
        conn, ids["B"], DealIn(name="B2", stage="new", value_cents=5), TODAY, NOW
    )
    assert names(conn, "new") == ["A", "B2", "C"]
