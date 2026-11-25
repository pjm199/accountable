"""'Today' is the computer's local date (concern 7). Tests replace these."""

from datetime import date, datetime


def now() -> datetime:
    return datetime.now().replace(microsecond=0)


def today() -> date:
    return now().date()
