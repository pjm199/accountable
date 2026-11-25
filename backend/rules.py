"""Business rules: stages, probabilities, open or closed, late, expected revenue."""

from collections.abc import Iterable, Mapping
from datetime import date

STAGES = ("new", "qualified", "proposal", "negotiation", "won", "lost")
OPEN_STAGES = ("new", "qualified", "proposal", "negotiation")
CLOSED_STAGES = ("won", "lost")
# The stages of the funnel, in order; Lost isn't one (R37).
FUNNEL_STAGES = ("new", "qualified", "proposal", "negotiation", "won")

STAGE_LABELS = {
    "new": "New",
    "qualified": "Qualified",
    "proposal": "Proposal",
    "negotiation": "Negotiation",
    "won": "Won",
    "lost": "Lost",
}

USUAL_PROBABILITY = {
    "new": 10,
    "qualified": 25,
    "proposal": 50,
    "negotiation": 75,
    "won": 100,
    "lost": 0,
}

CONTACT_STATUSES = ("lead", "qualified", "customer")
ACTIVITY_TYPES = ("note", "call", "email")


def usual_probability(stage: str) -> int:
    return USUAL_PROBABILITY[stage]


def is_open(stage: str) -> bool:
    return stage in OPEN_STAGES


def is_closed(stage: str) -> bool:
    return stage in CLOSED_STAGES


def is_late(stage: str, close_date: date | None, today: date) -> bool:
    """An open deal whose close date is before today. No date, never late (R9)."""
    return is_open(stage) and close_date is not None and close_date < today


def expected_cents(value_cents: int, probability: int) -> float:
    return value_cents * probability / 100


def expected_revenue_cents(deals: Iterable[Mapping]) -> int:
    """Sum of value x probability over open deals (R10), in whole cents."""
    total = sum(
        expected_cents(d["value_cents"], d["probability"]) for d in deals if is_open(d["stage"])
    )
    return round(total)


def stage_change_text(from_stage: str | None, to_stage: str) -> str:
    if from_stage is None:
        return f"Created in {STAGE_LABELS[to_stage]}"
    return f"Moved from {STAGE_LABELS[from_stage]} to {STAGE_LABELS[to_stage]}"


def furthest_funnel_stage(stages: Iterable[str]) -> str | None:
    """The latest stage, New to Won, among the ones given; Lost doesn't count."""
    reached = [FUNNEL_STAGES.index(s) for s in stages if s in FUNNEL_STAGES]
    return FUNNEL_STAGES[max(reached)] if reached else None
