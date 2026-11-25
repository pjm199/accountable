"""Small helpers shared by the repo modules."""

from sqlalchemy import Connection, Table, select

from backend.errors import Invalid, NotFound


def row_or_404(conn: Connection, table: Table, record_id: int, label: str) -> dict:
    row = conn.execute(select(table).where(table.c.id == record_id)).mappings().first()
    if row is None:
        raise NotFound(f"That {label} doesn't exist. It may have been deleted.")
    return dict(row)


def check_link(conn: Connection, table: Table, record_id: int | None, label: str) -> None:
    """A link to another record must point at one that exists (422, not 404)."""
    if record_id is None:
        return
    found = conn.execute(select(table.c.id).where(table.c.id == record_id)).first()
    if found is None:
        raise Invalid(f"That {label} doesn't exist. It may have been deleted.")
