"""Sample data, with every date relative to the day the seed runs (R41 to R43).

`python -m backend.seed` (or `npm run seed`) empties the database and loads the
sample data again, in one transaction (R3).
"""

import calendar
from datetime import date, datetime, time, timedelta

from sqlalchemy import Connection, Engine, delete, insert, select, update

from backend import clock, rules
from backend.config import db_path
from backend.db import (
    activities,
    contacts,
    create_tables,
    deals,
    make_engine,
    organizations,
    stage_changes,
)

ORGANIZATIONS = [
    ("Brightwave Media", "brightwavemedia.com", "Media", "Agency of 40. Rebuilding their site in the new year."),
    ("Harbor Dental", "harbordental.com", "Healthcare", "Three clinics on the coast."),
    ("Northline Freight", "northlinefreight.com", "Logistics", None),
    ("Alder & Finch Law", "alderfinch.law", "Legal", "Small firm, careful buyers. Partner sign-off needed."),
    ("Greenleaf Grocers", "greenleafgrocers.com", "Retail", "Eight stores. Inventory is their main pain."),
    ("Pixel Forge Studio", "pixelforge.studio", "Technology", None),
    ("Summit Fitness", "summitfitness.com", "Fitness", "Chain of gyms, growing fast."),
    ("Redwood Builders", "redwoodbuilders.com", "Construction", None),
    ("Lumen Education", "lumen.education", "Education", "Online courses for adults."),
    ("Coastline Clinics", "coastlineclinics.com", "Healthcare", "Five clinics. Long buying cycle."),
    ("Maple Street Bakery", "maplestreetbakery.com", "Food and drink", "Long-standing customer."),
    ("Bluebird Logistics", "bluebirdlogistics.com", "Logistics", None),
]

# name, status, job title, organization index (None for no organization)
CONTACTS = [
    ("Tara Nguyen", "customer", "Managing Director", 0),
    ("Leo Ortiz", "qualified", "Head of Digital", 0),
    ("Dr. Priya Shah", "customer", "Practice Owner", 1),
    ("Sam Okafor", "lead", "Office Manager", 1),
    ("Mara Bell", "qualified", "Operations Director", 2),
    ("Jonas Weber", "lead", "Fleet Manager", 2),
    ("Margaret Finch", "customer", "Partner", 3),
    ("Ben Alder", "lead", "Partner", 3),
    ("Hana Kim", "qualified", "Head of Operations", 4),
    ("Will Grant", "customer", "Store Manager", 4),
    ("Pia Sorensen", "qualified", "Founder", 5),
    ("Dev Malhotra", "lead", "Lead Developer", 5),
    ("Olivia Reyes", "customer", "Chief Executive", 6),
    ("Chris Doyle", "lead", "Marketing Lead", 6),
    ("Sofia Petrov", "qualified", "Project Director", 7),
    ("Ade Bankole", "customer", "Finance Director", 7),
    ("Dana Cole", "customer", "Head of Learning", 8),
    ("Ruth Ibarra", "lead", "Course Producer", 8),
    ("Jorge Alvarez", "qualified", "IT Manager", 9),
    ("Ines Laurent", "customer", "Clinical Director", 9),
    ("Ian Carter", "customer", "Owner", 10),
    ("Lucy Hart", "lead", "Bakery Manager", 10),
    ("Noah Walsh", "qualified", "Logistics Manager", 11),
    ("Ella Brooks", "customer", "Chief Operating Officer", 11),
    ("Marco Rossi", "lead", "Consultant", None),
    ("Grace Liu", "lead", "Buyer", 4),
    ("Tom Fischer", "qualified", "Procurement Lead", 2),
    ("Amara Diallo", "customer", "Head of Finance", 1),
    ("Kai Tanaka", "lead", "Freelance Designer", None),
    ("Rosa Mendes", "customer", "Operations Manager", 6),
]

# Open deals: name, organization, contact, stage, value in dollars, close date
# as days from today (negative is late), path of stages taken to get there.
OPEN_DEALS = [
    ("Website rebuild", 0, 0, "new", 18_000, 68, None),
    ("Annual support plan", 1, 3, "new", 9_500, 52, None),
    ("Fleet tracking pilot", 2, 5, "new", 32_000, 96, None),
    ("Course platform", 8, 17, "new", 21_000, None, None),
    ("Loyalty app", 4, 25, "new", 14_500, 85, None),
    ("CRM rollout", 3, 7, "qualified", 24_000, 24, None),
    ("Inventory module", 4, 8, "qualified", 41_000, 16, None),
    ("Onboarding package", 5, 11, "qualified", 12_500, -10, None),
    ("Booking system", 6, 13, "qualified", 27_000, 45, None),
    ("Freight portal", 11, 22, "qualified", 16_000, 38, ["new", "qualified"]),
    ("Q1 retainer", 6, 12, "proposal", 36_000, 11, None),
    ("Equipment lease", 7, 14, "proposal", 58_000, -5, None),
    ("Training series", 8, 16, "proposal", 15_500, 26, ["proposal"]),
    ("Patient portal", 1, 27, "proposal", 44_000, 57, None),
    ("Store analytics", 4, 9, "proposal", 22_500, 33, None),
    ("Multi-site licence", 9, 18, "negotiation", 92_000, 18, None),
    ("Renewal 2027", 10, 20, "negotiation", 14_000, 6, None),
    ("Data migration", 2, 26, "negotiation", 27_000, -3, None),
    ("Brand refresh", 0, 1, "negotiation", 19_500, 40, None),
    ("Site security audit", 7, 15, "negotiation", 11_000, -18, ["qualified", "proposal", "negotiation"]),
]

# Won deals: name, organization, contact, value, months ago it closed, day of month.
WON_DEALS = [
    ("Clinic scheduling", 1, 2, 26_000, 11, 14),
    ("Delivery tracking", 11, 23, 31_000, 10, 8),
    ("Store rollout phase 1", 4, 9, 38_500, 9, 21),
    ("Case management", 3, 6, 22_000, 8, 5),
    ("Membership app", 6, 12, 47_000, 7, 17),
    ("Website care plan", 10, 20, 6_500, 6, 26),
    ("Site analytics", 7, 15, 18_000, 5, 12),
    ("Learning portal", 8, 16, 34_000, 4, 9),
    ("Patient reminders", 9, 19, 29_500, 3, 3),
    ("Content hub", 0, 0, 16_000, 3, 22),
    ("Route planner", 2, 4, 42_000, 2, 15),
    ("Pilot program", 11, 22, 21_000, 1, 6),
    ("Staff training", 8, 16, 8_800, 1, 19),
    ("Payroll integration", 6, 29, 24_500, 0, 2),
]

# Lost deals: name, organization, contact, value, months ago, day, furthest stage.
LOST_DEALS = [
    ("Warehouse sensors", 2, 26, 35_000, 9, 11, "proposal"),
    ("Mobile ordering", 10, 21, 12_000, 6, 7, "qualified"),
    ("Analytics add-on", 7, 14, 19_000, 4, 28, "negotiation"),
    ("Digital signage", 4, 25, 9_000, 2, 18, "new"),
    ("Bulk order", 4, 8, 12_000, 1, 9, "negotiation"),
    ("Video production", 5, 10, 7_500, 0, 1, "proposal"),
]

ACTIVITY_TEXT = {
    "call": [
        "Called about licence terms. They want a 12-month price lock.",
        "Intro call. Budget confirmed for January.",
        "Quick check-in. Waiting on their finance team.",
        "Walked through the proposal line by line.",
        "Call with the partners. Two questions on support hours.",
        "Discussed timelines. They would like to start before spring.",
        "Called to follow up on the demo. Positive.",
        "Talked through pricing for extra sites.",
    ],
    "email": [
        "Sent the revised proposal.",
        "Emailed the case study they asked for.",
        "Sent a summary of today's meeting.",
        "Shared the onboarding plan.",
        "Sent the contract for signature.",
        "Replied with answers on data security.",
        "Sent pricing for the extra modules.",
        "Emailed a thank-you and next steps.",
    ],
    "note": [
        "Comparing us with one other supplier.",
        "Decision maker is the finance director.",
        "Prefers email to calls before 10am.",
        "Interested in a second phase next year.",
        "Asked for references in their industry.",
        "Budget is tight this quarter.",
        "Happy with the support so far.",
        "Moving offices in the spring. Timing matters.",
    ],
}

FOLLOW_UP_TEXT = [
    "Chase signed order form",
    "Send data migration plan",
    "Call about price lock",
    "Book demo with the team",
    "Send updated quote",
    "Check in after the trial",
    "Confirm start date",
    "Share references",
    "Ask for feedback on the proposal",
    "Arrange site visit",
    "Prepare renewal pricing",
    "Follow up on the invoice",
]


def _month_day(today: date, months_ago: int, day: int) -> date:
    year, month = today.year, today.month - months_ago
    while month < 1:
        month += 12
        year -= 1
    day = min(day, calendar.monthrange(year, month)[1])
    result = date(year, month, day)
    return min(result, today)


class _Clock:
    """Turns days and times into datetimes that are never in the future."""

    def __init__(self, now: datetime):
        self.now = now
        self.today = now.date()

    def at(self, day: date, hour: int, minute: int = 0) -> datetime:
        return min(datetime.combine(day, time(hour, minute)), self.now - timedelta(minutes=5))


def _path_to(stage: str) -> list[str]:
    """The stages a deal passed on its way to an open stage or Won."""
    return list(rules.FUNNEL_STAGES[: rules.FUNNEL_STAGES.index(stage) + 1])


def _history(c: _Clock, deal_id: int, path: list[str], start: date, end: date) -> list[dict]:
    """Stage changes along a path, spread evenly between two days."""
    span = max((end - start).days, len(path))
    entries = []
    previous = None
    for i, stage in enumerate(path):
        day = start + timedelta(days=round(span * i / max(len(path) - 1, 1))) if i else start
        day = min(day, end)
        entries.append(
            {
                "deal_id": deal_id,
                "from_stage": previous,
                "to_stage": stage,
                "changed_at": c.at(day, 9 + (deal_id + i) % 8, (deal_id * 7) % 60),
            }
        )
        previous = stage
    return entries


def reset(conn: Connection) -> None:
    for table in (stage_changes, activities, deals, contacts, organizations):
        conn.execute(delete(table))


def load(conn: Connection, now: datetime) -> None:
    c = _Clock(now)
    today = c.today
    created_long_ago = c.at(today - timedelta(days=400), 9)

    org_ids = [
        conn.execute(
            insert(organizations).values(
                name=name, website=website, industry=industry, notes=notes, created_at=created_long_ago
            )
        ).inserted_primary_key[0]
        for name, website, industry, notes in ORGANIZATIONS
    ]

    contact_ids = []
    for name, status, job_title, org in CONTACTS:
        first, last = name.replace("Dr. ", "").lower().split(" ", 1)
        domain = ORGANIZATIONS[org][1] if org is not None else "mail.com"
        contact_ids.append(
            conn.execute(
                insert(contacts).values(
                    name=name,
                    status=status,
                    job_title=job_title,
                    email=f"{first}.{last.replace(' ', '')}@{domain}",
                    phone=f"+1 555 {100 + len(contact_ids) * 7:03d} {2000 + len(contact_ids) * 113:04d}",
                    organization_id=org_ids[org] if org is not None else None,
                    created_at=created_long_ago,
                )
            ).inserted_primary_key[0]
        )

    positions: dict[str, int] = {stage: 0 for stage in rules.STAGES}
    history: list[dict] = []
    deal_rows: list[tuple[int, str]] = []

    def add_deal(name, org, contact, stage, dollars, close_date, created_on) -> int:
        deal_id = conn.execute(
            insert(deals).values(
                name=name,
                stage=stage,
                value_cents=dollars * 100,
                probability=rules.usual_probability(stage),
                close_date=close_date,
                position=positions[stage],
                organization_id=org_ids[org],
                contact_id=contact_ids[contact],
                created_at=c.at(created_on, 9),
            )
        ).inserted_primary_key[0]
        positions[stage] += 1
        deal_rows.append((deal_id, name))
        return deal_id

    for i, (name, org, contact, stage, dollars, close_in, path) in enumerate(OPEN_DEALS):
        close_date = today + timedelta(days=close_in) if close_in is not None else None
        created_on = today - timedelta(days=12 + (i * 5) % 50)
        deal_id = add_deal(name, org, contact, stage, dollars, close_date, created_on)
        history += _history(c, deal_id, path or _path_to(stage), created_on, today - timedelta(days=1 + i % 6))

    for i, (name, org, contact, dollars, months_ago, day) in enumerate(WON_DEALS):
        closed_on = _month_day(today, months_ago, day)
        created_on = closed_on - timedelta(days=35 + (i * 11) % 50)
        deal_id = add_deal(name, org, contact, "won", dollars, closed_on, created_on)
        # Some deals were created further along, at Qualified or Proposal.
        path = _path_to("won")[[0, 0, 1, 0, 2][i % 5] :]
        history += _history(c, deal_id, path, created_on, closed_on)

    for i, (name, org, contact, dollars, months_ago, day, furthest) in enumerate(LOST_DEALS):
        closed_on = _month_day(today, months_ago, day)
        created_on = closed_on - timedelta(days=30 + (i * 13) % 40)
        deal_id = add_deal(name, org, contact, "lost", dollars, closed_on, created_on)
        history += _history(c, deal_id, [*_path_to(furthest), "lost"], created_on, closed_on)

    # Closed columns show the most recent first.
    for stage in rules.CLOSED_STAGES:
        ids = conn.execute(
            select(deals.c.id).where(deals.c.stage == stage).order_by(deals.c.close_date.desc(), deals.c.id.desc())
        ).scalars().all()
        for position, deal_id in enumerate(ids):
            conn.execute(update(deals).where(deals.c.id == deal_id).values(position=position))

    conn.execute(insert(stage_changes), history)
    _load_activities(conn, c, contact_ids, deal_rows)


def _load_activities(conn: Connection, c: _Clock, contact_ids: list[int], deal_rows: list) -> None:
    today = c.today
    rows = []
    types = rules.ACTIVITY_TYPES
    open_deal_ids = [deal_id for deal_id, _ in deal_rows[: len(OPEN_DEALS)]]

    # Follow-ups: overdue, due today, due in the next two weeks, further ahead, and done.
    follow_up_days = [-9, -4, -2, -1, 0, 1, 2, 4, 6, 9, 13, 45]
    for i, days in enumerate(follow_up_days):
        on_deal = i % 2 == 0
        rows.append(
            {
                "type": types[i % 3],
                "description": FOLLOW_UP_TEXT[i],
                "happened_at": c.at(today - timedelta(days=max(3, 6 - days) + i % 4), 10 + i % 6, 15),
                "contact_id": None if on_deal else contact_ids[(i * 5) % len(contact_ids)],
                "deal_id": open_deal_ids[(i * 3) % len(open_deal_ids)] if on_deal else None,
                "follow_up_date": today + timedelta(days=days),
                "done": False,
            }
        )
    for i in range(6):
        rows.append(
            {
                "type": types[(i + 1) % 3],
                "description": FOLLOW_UP_TEXT[(i + 4) % len(FOLLOW_UP_TEXT)],
                "happened_at": c.at(today - timedelta(days=20 + i * 3), 11, 30),
                "contact_id": contact_ids[(i * 7 + 2) % len(contact_ids)],
                "deal_id": None,
                "follow_up_date": today - timedelta(days=10 + i * 2),
                "done": True,
            }
        )

    # Plain activities, spread over the past two months, newest first.
    count = 60 - len(rows)
    for i in range(count):
        kind = types[i % 3]
        texts = ACTIVITY_TEXT[kind]
        on_deal = i % 3 != 2
        deal_id, _ = deal_rows[(i * 7) % len(deal_rows)]
        rows.append(
            {
                "type": kind,
                "description": texts[(i // 3) % len(texts)],
                "happened_at": c.at(today - timedelta(days=i * 60 // count), 8 + (i * 5) % 10, (i * 17) % 60),
                "contact_id": None if on_deal else contact_ids[(i * 11) % len(contact_ids)],
                "deal_id": deal_id if on_deal else None,
                "follow_up_date": None,
                "done": False,
            }
        )

    for row in rows:
        row["created_at"] = row["happened_at"]
    conn.execute(insert(activities), rows)


def seed(engine: Engine, now: datetime | None = None) -> None:
    """Empties every table and loads the sample data, in one transaction."""
    create_tables(engine)
    with engine.begin() as conn:
        reset(conn)
        load(conn, now or clock.now())


def main() -> None:
    path = db_path()
    engine = make_engine(path)
    seed(engine)
    engine.dispose()
    print(f"Sample data loaded into {path}")


if __name__ == "__main__":
    main()
