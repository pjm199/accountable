"""One database transaction per request."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import Connection


def get_conn(request: Request) -> Iterator[Connection]:
    with request.app.state.engine.begin() as conn:
        yield conn


Conn = Annotated[Connection, Depends(get_conn)]
