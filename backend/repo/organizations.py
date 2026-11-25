"""Organizations: list with counts, add, edit, delete."""

from datetime import datetime

from sqlalchemy import Connection, case, delete, func, insert, select, update

from backend import rules
from backend.db import contacts, deals, organizations
from backend.repo.common import row_or_404
from backend.schemas import OrganizationIn


def list_organizations(conn: Connection) -> list[dict]:
    contact_counts = (
        select(contacts.c.organization_id, func.count().label("n"))
        .group_by(contacts.c.organization_id)
        .subquery()
    )
    is_open = deals.c.stage.in_(rules.OPEN_STAGES)
    deal_figures = (
        select(
            deals.c.organization_id,
            func.sum(case((is_open, 1), else_=0)).label("open_deals"),
            func.sum(case((is_open, deals.c.value_cents), else_=0)).label("open_value"),
        )
        .group_by(deals.c.organization_id)
        .subquery()
    )
    query = (
        select(
            organizations,
            func.coalesce(contact_counts.c.n, 0).label("contact_count"),
            func.coalesce(deal_figures.c.open_deals, 0).label("open_deal_count"),
            func.coalesce(deal_figures.c.open_value, 0).label("open_value_cents"),
        )
        .select_from(
            organizations.outerjoin(
                contact_counts, contact_counts.c.organization_id == organizations.c.id
            ).outerjoin(deal_figures, deal_figures.c.organization_id == organizations.c.id)
        )
        .order_by(organizations.c.name)
    )
    return [dict(row) for row in conn.execute(query).mappings()]


def get_organization(conn: Connection, org_id: int) -> dict:
    return row_or_404(conn, organizations, org_id, "organization")


def create_organization(conn: Connection, data: OrganizationIn, now: datetime) -> int:
    return conn.execute(
        insert(organizations).values(**data.model_dump(), created_at=now)
    ).inserted_primary_key[0]


def update_organization(conn: Connection, org_id: int, data: OrganizationIn) -> None:
    row_or_404(conn, organizations, org_id, "organization")
    conn.execute(update(organizations).where(organizations.c.id == org_id).values(**data.model_dump()))


def delete_organization(conn: Connection, org_id: int) -> None:
    """Its contacts and deals are kept, with no organization (set null)."""
    row_or_404(conn, organizations, org_id, "organization")
    conn.execute(delete(organizations).where(organizations.c.id == org_id))


def delete_impact(conn: Connection, org_id: int) -> dict:
    row_or_404(conn, organizations, org_id, "organization")
    count = lambda table: conn.execute(  # noqa: E731
        select(func.count()).select_from(table).where(table.c.organization_id == org_id)
    ).scalar_one()
    return {"contacts": count(contacts), "deals": count(deals)}
