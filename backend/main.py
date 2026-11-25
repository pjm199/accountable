"""The FastAPI app: every route lives under /api.

On start, a database file that doesn't exist yet is created and filled with the
sample data (R2).
"""

from pathlib import Path

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.config import db_path
from backend.db import create_tables, make_engine
from backend.errors import Invalid, NotFound

health = APIRouter()


@health.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


FIELD_NAMES = {
    "value_cents": "Value",
    "organization_id": "Organization",
    "contact_id": "Contact",
    "deal_id": "Deal",
    "happened_at": "When",
    "follow_up_date": "Follow-up date",
    "close_date": "Close date",
    "job_title": "Job title",
}


def _field(loc: tuple) -> str:
    name = next((str(part) for part in reversed(loc) if isinstance(part, str) and part != "body"), "")
    return FIELD_NAMES.get(name, name.replace("_", " ").capitalize())


def plain_message(errors: list[dict]) -> str:
    """Pydantic errors in plain words, such as "Name is required."."""
    messages = []
    for error in errors:
        field = _field(tuple(error.get("loc", ())))
        kind = error.get("type", "")
        ctx = error.get("ctx") or {}
        if kind in ("missing", "string_too_short") or (kind.endswith("_type") and error.get("input") is None):
            message = f"{field} is required."
        elif kind == "greater_than_equal":
            message = f"{field} must be {ctx.get('ge')} or more."
        elif kind == "less_than_equal":
            message = f"{field} must be {ctx.get('le')} or less."
        elif kind == "literal_error":
            message = f"{field} must be one of {ctx.get('expected')}."
        elif kind == "value_error":
            message = str(ctx.get("error") or error.get("msg"))
        else:
            message = f"{field}: {error.get('msg', 'is not valid')}."
        if message not in messages:
            messages.append(message)
    return " ".join(messages) or "Some fields are not valid."


def create_app(path: Path | None = None, seed_if_new: bool = True) -> FastAPI:
    path = path or db_path()
    is_new = not path.exists()
    engine = make_engine(path)
    create_tables(engine)
    if is_new and seed_if_new:
        from backend.seed import seed

        seed(engine)

    app = FastAPI(title="Accountable")
    app.state.engine = engine

    @app.exception_handler(NotFound)
    def not_found(_request: Request, exc: NotFound):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(Invalid)
    def invalid(_request: Request, exc: Invalid):
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    @app.exception_handler(RequestValidationError)
    def validation(_request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"detail": plain_message(exc.errors())})

    from backend.routes import ROUTERS

    api = APIRouter(prefix="/api")
    api.include_router(health)
    for router in ROUTERS:
        api.include_router(router)
    app.include_router(api)
    return app


def __getattr__(name: str):
    # `uvicorn backend.main:app` builds the app on first use, so importing this
    # module (as the tests do) doesn't touch the real database.
    if name == "app":
        global app
        app = create_app()
        return app
    raise AttributeError(name)
