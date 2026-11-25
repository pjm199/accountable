"""The database: engine, foreign keys and the five tables (SQLAlchemy Core)."""

from pathlib import Path

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Engine,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    event,
)

metadata = MetaData()

organizations = Table(
    "organizations",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("website", String),
    Column("industry", String),
    Column("notes", Text),
    Column("created_at", DateTime, nullable=False),
)

contacts = Table(
    "contacts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("status", String, nullable=False, default="lead"),
    Column("email", String),
    Column("phone", String),
    Column("job_title", String),
    Column(
        "organization_id",
        Integer,
        ForeignKey("organizations.id", ondelete="SET NULL"),
        index=True,
    ),
    Column("created_at", DateTime, nullable=False),
    CheckConstraint("status IN ('lead', 'qualified', 'customer')", name="contact_status"),
)

deals = Table(
    "deals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("stage", String, nullable=False),
    Column("value_cents", Integer, nullable=False),
    Column("probability", Integer, nullable=False),
    Column("close_date", Date),
    Column("position", Integer, nullable=False, default=0),
    Column(
        "organization_id",
        Integer,
        ForeignKey("organizations.id", ondelete="SET NULL"),
        index=True,
    ),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="SET NULL"), index=True),
    Column("created_at", DateTime, nullable=False),
    CheckConstraint(
        "stage IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')",
        name="deal_stage",
    ),
    CheckConstraint("value_cents >= 0", name="deal_value"),
    CheckConstraint("probability BETWEEN 0 AND 100", name="deal_probability"),
)

activities = Table(
    "activities",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("type", String, nullable=False),
    Column("description", Text, nullable=False),
    Column("happened_at", DateTime, nullable=False),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="CASCADE"), index=True),
    Column("deal_id", Integer, ForeignKey("deals.id", ondelete="CASCADE"), index=True),
    Column("follow_up_date", Date),
    Column("done", Boolean, nullable=False, default=False),
    Column("created_at", DateTime, nullable=False),
    CheckConstraint("type IN ('note', 'call', 'email')", name="activity_type"),
    # An activity belongs to a contact or a deal, never both (concern 4).
    CheckConstraint(
        "(contact_id IS NULL) != (deal_id IS NULL)", name="activity_contact_or_deal"
    ),
)

stage_changes = Table(
    "stage_changes",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("deal_id", Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("from_stage", String),
    Column("to_stage", String, nullable=False),
    Column("changed_at", DateTime, nullable=False),
)


def _foreign_keys_on(dbapi_connection, _record) -> None:
    # SQLite ignores foreign keys unless each connection switches them on.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def make_engine(path: Path) -> Engine:
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{path}")
    event.listen(engine, "connect", _foreign_keys_on)
    return engine


def create_tables(engine: Engine) -> None:
    metadata.create_all(engine)
