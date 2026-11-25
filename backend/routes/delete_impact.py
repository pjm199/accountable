from fastapi import APIRouter

from backend.repo import contacts, deals, organizations
from backend.routes.deps import Conn
from backend.schemas import DeleteKind

router = APIRouter(tags=["delete impact"])

REPOS = {"organizations": organizations, "contacts": contacts, "deals": deals}


@router.get("/delete-impact/{kind}/{record_id}")
def delete_impact(kind: DeleteKind, record_id: int, conn: Conn) -> dict:
    """The counts the delete dialog shows (R19)."""
    return REPOS[kind].delete_impact(conn, record_id)
