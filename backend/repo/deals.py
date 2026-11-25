"""Deals: add, edit, delete, stage changes (R8) and moves on the board (R29, R30)."""

from datetime import date, datetime

from sqlalchemy import Connection, delete, func, insert, select, update

from backend import rules
from backend.db import activities, contacts, deals, organizations, stage_changes
from backend.errors import NotFound
from backend.repo.common import check_link, row_or_404
from backend.schemas import DealIn


def _column(conn: Connection, stage: str, leave_out: int | None = None) -> list[int]:
    """Ids of the deals in a stage's column, top to bottom."""
    query = select(deals.c.id).where(deals.c.stage == stage).order_by(deals.c.position, deals.c.id)
    if leave_out is not None:
        query = query.where(deals.c.id != leave_out)
    return list(conn.execute(query).scalars())


def _renumber(conn: Connection, ids: list[int]) -> None:
    for position, deal_id in enumerate(ids):
        conn.execute(update(deals).where(deals.c.id == deal_id).values(position=position))


def record_stage_change(
    conn: Connection, deal_id: int, from_stage: str | None, to_stage: str, at: datetime
) -> None:
    conn.execute(
        insert(stage_changes).values(
            deal_id=deal_id, from_stage=from_stage, to_stage=to_stage, changed_at=at
        )
    )


def _check_links(conn: Connection, data: DealIn) -> None:
    check_link(conn, organizations, data.organization_id, "organization")
    check_link(conn, contacts, data.contact_id, "contact")


def create_deal(conn: Connection, data: DealIn, now: datetime) -> int:
    """A new deal goes to the top of its column and gets a "Created in" entry."""
    _check_links(conn, data)
    probability = (
        data.probability if data.probability is not None else rules.usual_probability(data.stage)
    )
    deal_id = conn.execute(
        insert(deals).values(
            name=data.name,
            stage=data.stage,
            value_cents=data.value_cents,
            probability=probability,
            close_date=data.close_date,
            organization_id=data.organization_id,
            contact_id=data.contact_id,
            position=0,
            created_at=now,
        )
    ).inserted_primary_key[0]
    _renumber(conn, [deal_id, *_column(conn, data.stage, leave_out=deal_id)])
    record_stage_change(conn, deal_id, None, data.stage, now)
    return deal_id


def update_deal(conn: Connection, deal_id: int, data: DealIn, today: date, now: datetime) -> None:
    """Saves what the form sends (concern 6). A change of stage is recorded and
    the deal goes to the top of its new column (R30)."""
    current = row_or_404(conn, deals, deal_id, "deal")
    _check_links(conn, data)
    stage_changed = data.stage != current["stage"]

    probability = data.probability
    if probability is None:
        probability = (
            rules.usual_probability(data.stage) if stage_changed else current["probability"]
        )
    close_date = data.close_date
    if stage_changed and rules.is_closed(data.stage) and close_date is None:
        close_date = today

    conn.execute(
        update(deals)
        .where(deals.c.id == deal_id)
        .values(
            name=data.name,
            stage=data.stage,
            value_cents=data.value_cents,
            probability=probability,
            close_date=close_date,
            organization_id=data.organization_id,
            contact_id=data.contact_id,
        )
    )
    if stage_changed:
        _renumber(conn, _column(conn, current["stage"], leave_out=deal_id))
        _renumber(conn, [deal_id, *_column(conn, data.stage, leave_out=deal_id)])
        record_stage_change(conn, deal_id, current["stage"], data.stage, now)


def move_deal(
    conn: Connection, deal_id: int, stage: str, index: int, today: date, now: datetime
) -> None:
    """Puts a deal at a place in a column, changing its stage if the column is
    another one (R8, R29). Both columns are renumbered."""
    current = row_or_404(conn, deals, deal_id, "deal")
    old_stage = current["stage"]

    target = _column(conn, stage, leave_out=deal_id)
    index = min(index, len(target))
    target.insert(index, deal_id)

    if stage != old_stage:
        values: dict = {"stage": stage, "probability": rules.usual_probability(stage)}
        if rules.is_closed(stage):
            values["close_date"] = today
        conn.execute(update(deals).where(deals.c.id == deal_id).values(**values))
        record_stage_change(conn, deal_id, old_stage, stage, now)
        _renumber(conn, _column(conn, old_stage, leave_out=deal_id))
    _renumber(conn, target)


def delete_deal(conn: Connection, deal_id: int) -> None:
    """Its activities and stage history go with it (foreign key cascades)."""
    row_or_404(conn, deals, deal_id, "deal")
    conn.execute(delete(deals).where(deals.c.id == deal_id))


def _list_query():
    return (
        select(
            deals,
            organizations.c.name.label("organization_name"),
            contacts.c.name.label("contact_name"),
        )
        .select_from(
            deals.outerjoin(organizations, deals.c.organization_id == organizations.c.id).outerjoin(
                contacts, deals.c.contact_id == contacts.c.id
            )
        )
        .order_by(deals.c.stage, deals.c.position, deals.c.id)
    )


def _with_late(row, today: date) -> dict:
    deal = dict(row)
    deal["is_late"] = rules.is_late(deal["stage"], deal["close_date"], today)
    return deal


def list_deals(conn: Connection, today: date, **where) -> list[dict]:
    query = _list_query()
    for column, value in where.items():
        query = query.where(deals.c[column] == value)
    return [_with_late(row, today) for row in conn.execute(query).mappings()]


def get_deal(conn: Connection, deal_id: int, today: date) -> dict:
    row = conn.execute(_list_query().where(deals.c.id == deal_id)).mappings().first()
    if row is None:
        raise NotFound("That deal doesn't exist. It may have been deleted.")
    return _with_late(row, today)


def delete_impact(conn: Connection, deal_id: int) -> dict:
    row_or_404(conn, deals, deal_id, "deal")
    count = lambda table: conn.execute(  # noqa: E731
        select(func.count()).select_from(table).where(table.c.deal_id == deal_id)
    ).scalar_one()
    return {"activities": count(activities), "stage_changes": count(stage_changes)}
