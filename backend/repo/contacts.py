"""Contacts: list (with a status filter), add, edit, delete."""

from datetime import datetime

from sqlalchemy import Connection, delete, func, insert, select, update

from backend.db import activities, contacts, deals, organizations
from backend.errors import NotFound
from backend.repo.common import check_link, row_or_404
from backend.schemas import ContactIn


def _query():
    return (
        select(contacts, organizations.c.name.label("organization_name"))
        .select_from(
            contacts.outerjoin(organizations, contacts.c.organization_id == organizations.c.id)
        )
        .order_by(contacts.c.name)
    )


def list_contacts(conn: Connection, status: str | None = None, organization_id: int | None = None) -> list[dict]:
    query = _query()
    if status is not None:
        query = query.where(contacts.c.status == status)
    if organization_id is not None:
        query = query.where(contacts.c.organization_id == organization_id)
    return [dict(row) for row in conn.execute(query).mappings()]


def get_contact(conn: Connection, contact_id: int) -> dict:
    row = conn.execute(_query().where(contacts.c.id == contact_id)).mappings().first()
    if row is None:
        raise NotFound("That contact doesn't exist. It may have been deleted.")
    return dict(row)


def create_contact(conn: Connection, data: ContactIn, now: datetime) -> int:
    check_link(conn, organizations, data.organization_id, "organization")
    return conn.execute(
        insert(contacts).values(**data.model_dump(), created_at=now)
    ).inserted_primary_key[0]


def update_contact(conn: Connection, contact_id: int, data: ContactIn) -> None:
    row_or_404(conn, contacts, contact_id, "contact")
    check_link(conn, organizations, data.organization_id, "organization")
    conn.execute(update(contacts).where(contacts.c.id == contact_id).values(**data.model_dump()))


def delete_contact(conn: Connection, contact_id: int) -> None:
    """Its deals are kept with no main contact; its activities are deleted."""
    row_or_404(conn, contacts, contact_id, "contact")
    conn.execute(delete(contacts).where(contacts.c.id == contact_id))


def delete_impact(conn: Connection, contact_id: int) -> dict:
    row_or_404(conn, contacts, contact_id, "contact")
    count = lambda table: conn.execute(  # noqa: E731
        select(func.count()).select_from(table).where(table.c.contact_id == contact_id)
    ).scalar_one()
    return {"deals": count(deals), "activities": count(activities)}
