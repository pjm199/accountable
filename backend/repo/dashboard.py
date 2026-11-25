"""Every dashboard figure, worked out from the database on each load (R32 to R40)."""

import calendar
from datetime import date, timedelta

from sqlalchemy import Connection, select

from backend import rules
from backend.db import activities, contacts, deals, stage_changes
from backend.repo.activities import newest_first


def month_starts(today: date, count: int = 12) -> list[date]:
    """The first day of each of the last `count` months, oldest first, this one last."""
    index = today.year * 12 + today.month - 1
    return [date((index - i) // 12, (index - i) % 12 + 1, 1) for i in range(count - 1, -1, -1)]


def monthly_wins(all_deals: list[dict], today: date) -> list[dict]:
    """Won revenue and number of wins by month of close date, zeros included (R34, R35)."""
    months = month_starts(today)
    by_month = {m: {"won_cents": 0, "won_count": 0} for m in months}
    for deal in all_deals:
        closed = deal["close_date"]
        if deal["stage"] != "won" or closed is None:
            continue
        key = closed.replace(day=1)
        if key in by_month:
            by_month[key]["won_cents"] += deal["value_cents"]
            by_month[key]["won_count"] += 1
    return [
        {"month": m.isoformat()[:7], "label": calendar.month_abbr[m.month], **by_month[m]}
        for m in months
    ]


def funnel(all_deals: list[dict], history: list[dict]) -> list[dict]:
    """Value that reached each stage New to Won, over every deal (R37, concern 15)."""
    seen: dict[int, set[str]] = {d["id"]: {d["stage"]} for d in all_deals}
    for entry in history:
        seen.setdefault(entry["deal_id"], set()).add(entry["to_stage"])
    totals = {stage: {"value_cents": 0, "count": 0} for stage in rules.FUNNEL_STAGES}
    for deal in all_deals:
        furthest = rules.furthest_funnel_stage(seen[deal["id"]])
        if furthest is None:
            continue
        for stage in rules.FUNNEL_STAGES[: rules.FUNNEL_STAGES.index(furthest) + 1]:
            totals[stage]["value_cents"] += deal["value_cents"]
            totals[stage]["count"] += 1
    return [{"stage": s, **totals[s]} for s in rules.FUNNEL_STAGES]


def follow_ups(conn: Connection, today: date) -> list[dict]:
    """Every follow-up not done, however far ahead: overdue first, then soonest (R38)."""
    rows = conn.execute(
        select(
            activities,
            contacts.c.name.label("contact_name"),
            deals.c.name.label("deal_name"),
        )
        .select_from(
            activities.outerjoin(contacts, activities.c.contact_id == contacts.c.id).outerjoin(
                deals, activities.c.deal_id == deals.c.id
            )
        )
        .where(activities.c.follow_up_date.is_not(None), activities.c.done.is_(False))
        .order_by(activities.c.follow_up_date, activities.c.happened_at, activities.c.id)
    ).mappings()
    return [
        {
            "id": r["id"],
            "type": r["type"],
            "description": r["description"],
            "follow_up_date": r["follow_up_date"],
            "overdue": r["follow_up_date"] < today,
            "contact_id": r["contact_id"],
            "contact_name": r["contact_name"],
            "deal_id": r["deal_id"],
            "deal_name": r["deal_name"],
        }
        for r in rows
    ]


def recent_activity(conn: Connection, limit: int = 10) -> list[dict]:
    """The newest activities and stage changes, each with its contact or deal (R39)."""
    acts = conn.execute(
        select(
            activities.c.id,
            activities.c.type,
            activities.c.description,
            activities.c.happened_at.label("at"),
            activities.c.contact_id,
            contacts.c.name.label("contact_name"),
            activities.c.deal_id,
            deals.c.name.label("deal_name"),
        )
        .select_from(
            activities.outerjoin(contacts, activities.c.contact_id == contacts.c.id).outerjoin(
                deals, activities.c.deal_id == deals.c.id
            )
        )
        .order_by(activities.c.happened_at.desc(), activities.c.id.desc())
        .limit(limit)
    ).mappings()
    changes = conn.execute(
        select(
            stage_changes.c.id,
            stage_changes.c.from_stage,
            stage_changes.c.to_stage,
            stage_changes.c.changed_at.label("at"),
            stage_changes.c.deal_id,
            deals.c.name.label("deal_name"),
        )
        .select_from(stage_changes.join(deals, stage_changes.c.deal_id == deals.c.id))
        .order_by(stage_changes.c.changed_at.desc(), stage_changes.c.id.desc())
        .limit(limit)
    ).mappings()
    entries = [{"kind": "activity", **dict(r)} for r in acts] + [
        {
            "kind": "stage_change",
            "type": "stage",
            "description": rules.stage_change_text(r["from_stage"], r["to_stage"]),
            "contact_id": None,
            "contact_name": None,
            **dict(r),
        }
        for r in changes
    ]
    return newest_first(entries)[:limit]


def dashboard(conn: Connection, today: date) -> dict:
    all_deals = [dict(r) for r in conn.execute(select(deals)).mappings()]
    history = [dict(r) for r in conn.execute(select(stage_changes)).mappings()]
    open_deals = [d for d in all_deals if rules.is_open(d["stage"])]
    late = [d for d in open_deals if rules.is_late(d["stage"], d["close_date"], today)]
    closing_soon = [
        d
        for d in open_deals
        if d["close_date"] is not None and today <= d["close_date"] <= today + timedelta(days=7)
    ]
    months = monthly_wins(all_deals, today)
    pending = follow_ups(conn, today)

    return {
        "today": today,
        "attention_count": len(late) + len(closing_soon),
        "follow_ups_due_count": sum(f["follow_up_date"] <= today for f in pending),
        "expected_revenue_cents": rules.expected_revenue_cents(open_deals),
        "open_value_cents": sum(d["value_cents"] for d in open_deals),
        "won_12_months_cents": sum(m["won_cents"] for m in months),
        "open_count": len(open_deals),
        "late_count": len(late),
        "months": months,
        "open_by_stage": [
            {
                "stage": stage,
                "value_cents": sum(d["value_cents"] for d in open_deals if d["stage"] == stage),
                "count": sum(1 for d in open_deals if d["stage"] == stage),
            }
            for stage in rules.OPEN_STAGES
        ],
        "funnel": funnel(all_deals, history),
        "follow_ups": pending,
        "recent": recent_activity(conn),
    }
