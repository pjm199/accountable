"""Settings read from the environment."""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def db_path() -> Path:
    """The SQLite file. Tests point ACCOUNTABLE_DB at a file of their own."""
    value = os.environ.get("ACCOUNTABLE_DB")
    return Path(value) if value else ROOT / "data" / "accountable.db"
