from fastapi import APIRouter

from backend import clock
from backend.repo import dashboard as repo
from backend.routes.deps import Conn

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def dashboard(conn: Conn) -> dict:
    return repo.dashboard(conn, clock.today())
