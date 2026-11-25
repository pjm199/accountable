from fastapi import APIRouter, Response

from backend import clock
from backend.repo import activities as activity_repo
from backend.repo import deals as repo
from backend.routes.deps import Conn
from backend.schemas import DealIn, MoveIn

router = APIRouter(prefix="/deals", tags=["deals"])


def _one(conn, deal_id: int) -> dict:
    deal = repo.get_deal(conn, deal_id, clock.today())
    deal["timeline"] = activity_repo.deal_timeline(conn, deal_id)
    return deal


@router.get("")
def list_deals(conn: Conn) -> list[dict]:
    return repo.list_deals(conn, clock.today())


@router.post("", status_code=201)
def add_deal(body: DealIn, conn: Conn) -> dict:
    return _one(conn, repo.create_deal(conn, body, clock.now()))


@router.get("/{deal_id}")
def get_deal(deal_id: int, conn: Conn) -> dict:
    return _one(conn, deal_id)


@router.put("/{deal_id}")
def edit_deal(deal_id: int, body: DealIn, conn: Conn) -> dict:
    repo.update_deal(conn, deal_id, body, clock.today(), clock.now())
    return _one(conn, deal_id)


@router.post("/{deal_id}/move")
def move_deal(deal_id: int, body: MoveIn, conn: Conn) -> dict:
    repo.move_deal(conn, deal_id, body.stage, body.index, clock.today(), clock.now())
    return repo.get_deal(conn, deal_id, clock.today())


@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, conn: Conn) -> Response:
    repo.delete_deal(conn, deal_id)
    return Response(status_code=204)
