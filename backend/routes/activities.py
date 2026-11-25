from fastapi import APIRouter, Response

from backend import clock
from backend.repo import activities as repo
from backend.routes.deps import Conn
from backend.schemas import ActivityIn

router = APIRouter(prefix="/activities", tags=["activities"])


@router.post("", status_code=201)
def log_activity(body: ActivityIn, conn: Conn) -> dict:
    return repo.get_activity(conn, repo.create_activity(conn, body, clock.now()))


@router.put("/{activity_id}")
def edit_activity(activity_id: int, body: ActivityIn, conn: Conn) -> dict:
    repo.update_activity(conn, activity_id, body)
    return repo.get_activity(conn, activity_id)


@router.post("/{activity_id}/done")
def mark_done(activity_id: int, conn: Conn) -> dict:
    repo.mark_done(conn, activity_id)
    return repo.get_activity(conn, activity_id)


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, conn: Conn) -> Response:
    repo.delete_activity(conn, activity_id)
    return Response(status_code=204)
