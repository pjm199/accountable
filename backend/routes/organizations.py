from fastapi import APIRouter, Response

from backend import clock
from backend.repo import contacts as contact_repo
from backend.repo import deals as deal_repo
from backend.repo import organizations as repo
from backend.routes.deps import Conn
from backend.schemas import OrganizationIn

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _one(conn, org_id: int) -> dict:
    org = repo.get_organization(conn, org_id)
    org["contacts"] = contact_repo.list_contacts(conn, organization_id=org_id)
    org["deals"] = deal_repo.list_deals(conn, clock.today(), organization_id=org_id)
    return org


@router.get("")
def list_organizations(conn: Conn) -> list[dict]:
    return repo.list_organizations(conn)


@router.post("", status_code=201)
def add_organization(body: OrganizationIn, conn: Conn) -> dict:
    return _one(conn, repo.create_organization(conn, body, clock.now()))


@router.get("/{org_id}")
def get_organization(org_id: int, conn: Conn) -> dict:
    return _one(conn, org_id)


@router.put("/{org_id}")
def edit_organization(org_id: int, body: OrganizationIn, conn: Conn) -> dict:
    repo.update_organization(conn, org_id, body)
    return _one(conn, org_id)


@router.delete("/{org_id}", status_code=204)
def delete_organization(org_id: int, conn: Conn) -> Response:
    repo.delete_organization(conn, org_id)
    return Response(status_code=204)
