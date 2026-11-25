"""Activities and timelines (R24, R25)."""

from datetime import datetime

from sqlalchemy import Connection, delete, insert, or_, select, update

from backend import rules
from backend.db import activities, contacts, deals, stage_changes
from backend.repo.common import check_link, row_or_404
from backend.schemas import ActivityIn


def get_activity(conn: Connection, activity_id: int) -> dict:
    return row_or_404(conn, activities, activity_id, "activity")


def create_activity(conn: Connection, data: ActivityIn, now: datetime) -> int:
    check_link(conn, contacts, data.contact_id, "contact")
    check_link(conn, deals, data.deal_id, "deal")
    return conn.execute(
        insert(activities).values(**data.model_dump(), created_at=now)
    ).inserted_primary_key[0]


def update_activity(conn: Connection, activity_id: int, data: ActivityIn) -> None:
    row_or_404(conn, activities, activity_id, "activity")
    check_link(conn, contacts, data.contact_id, "contact")
    check_link(conn, deals, data.deal_id, "deal")
    conn.execute(update(activities).where(activities.c.id == activity_id).values(**data.model_dump()))


def mark_done(conn: Connection, activity_id: int) -> None:
    row_or_404(conn, activities, activity_id, "activity")
    conn.execute(update(activities).where(activities.c.id == activity_id).values(done=True))


def delete_activity(conn: Connection, activity_id: int) -> None:
    row_or_404(conn, activities, activity_id, "activity")
    conn.execute(delete(activities).where(activities.c.id == activity_id))


def _activity_entry(row) -> dict:
    return {
        "kind": "activity",
        "id": row["id"],
        "at": row["happened_at"],
        "type": row["type"],
        "description": row["description"],
        "follow_up_date": row["follow_up_date"],
        "done": row["done"],
        "contact_id": row["contact_id"],
        "contact_name": row.get("contact_name"),
        "deal_id": row["deal_id"],
        "deal_name": row.get("deal_name"),
    }


def _stage_entry(row) -> dict:
    return {
        "kind": "stage_change",
        "id": row["id"],
        "at": row["changed_at"],
        "from_stage": row["from_stage"],
        "to_stage": row["to_stage"],
        "description": rules.stage_change_text(row["from_stage"], row["to_stage"]),
        "deal_id": row["deal_id"],
        "deal_name": row.get("deal_name"),
    }


def newest_first(entries: list[dict]) -> list[dict]:
    # Ties (same minute) put stage changes after activities, then newest id first.
    return sorted(
        entries, key=lambda e: (e["at"], e["kind"] == "activity", e["id"]), reverse=True
    )


def _activities_query():
    return select(
        activities,
        contacts.c.name.label("contact_name"),
        deals.c.name.label("deal_name"),
    ).select_from(
        activities.outerjoin(contacts, activities.c.contact_id == contacts.c.id).outerjoin(
            deals, activities.c.deal_id == deals.c.id
        )
    )


def deal_timeline(conn: Connection, deal_id: int) -> list[dict]:
    acts = conn.execute(_activities_query().where(activities.c.deal_id == deal_id)).mappings()
    changes = conn.execute(
        select(stage_changes, deals.c.name.label("deal_name"))
        .select_from(stage_changes.join(deals, stage_changes.c.deal_id == deals.c.id))
        .where(stage_changes.c.deal_id == deal_id)
    ).mappings()
    return newest_first([_activity_entry(r) for r in acts] + [_stage_entry(r) for r in changes])


def contact_timeline(conn: Connection, contact_id: int) -> list[dict]:
    """The contact's own activities and those on deals where it is the main
    contact now, marked with the deal's name (R24, concern 4)."""
    their_deals = select(deals.c.id).where(deals.c.contact_id == contact_id)
    acts = conn.execute(
        _activities_query().where(
            or_(activities.c.contact_id == contact_id, activities.c.deal_id.in_(their_deals))
        )
    ).mappings()
    return newest_first([_activity_entry(r) for r in acts])
