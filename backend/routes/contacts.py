from fastapi import APIRouter, Response

from backend import clock
from backend.repo import activities as activity_repo
from backend.repo import contacts as repo
from backend.repo import deals as deal_repo
from backend.routes.deps import Conn
from backend.schemas import ContactIn, ContactStatus

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _one(conn, contact_id: int) -> dict:
    contact = repo.get_contact(conn, contact_id)
    contact["deals"] = deal_repo.list_deals(conn, clock.today(), contact_id=contact_id)
    contact["timeline"] = activity_repo.contact_timeline(conn, contact_id)
    return contact


@router.get("")
def list_contacts(conn: Conn, status: ContactStatus | None = None) -> list[dict]:
    return repo.list_contacts(conn, status=status)


@router.post("", status_code=201)
def add_contact(body: ContactIn, conn: Conn) -> dict:
    return _one(conn, repo.create_contact(conn, body, clock.now()))


@router.get("/{contact_id}")
def get_contact(contact_id: int, conn: Conn) -> dict:
    return _one(conn, contact_id)


@router.put("/{contact_id}")
def edit_contact(contact_id: int, body: ContactIn, conn: Conn) -> dict:
    repo.update_contact(conn, contact_id, body)
    return _one(conn, contact_id)


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, conn: Conn) -> Response:
    repo.delete_contact(conn, contact_id)
    return Response(status_code=204)
