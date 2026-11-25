"""Pydantic models for requests. Replies are plain dicts built by the repo."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, Field, StringConstraints, model_validator

Stage = Literal["new", "qualified", "proposal", "negotiation", "won", "lost"]
ContactStatus = Literal["lead", "qualified", "customer"]
ActivityType = Literal["note", "call", "email"]
DeleteKind = Literal["organizations", "contacts", "deals"]


def _blank_to_none(value):
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


Required = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Optional = Annotated[str | None, BeforeValidator(_blank_to_none)]
OptionalDate = Annotated[date | None, BeforeValidator(_blank_to_none)]


class OrganizationIn(BaseModel):
    name: Required
    website: Optional = None
    industry: Optional = None
    notes: Optional = None


class ContactIn(BaseModel):
    name: Required
    status: ContactStatus = "lead"
    email: Optional = None
    phone: Optional = None
    job_title: Optional = None
    organization_id: int | None = None


class DealIn(BaseModel):
    name: Required
    stage: Stage
    value_cents: int = Field(ge=0)
    # Left out, it takes the stage's usual probability (R7).
    probability: int | None = Field(default=None, ge=0, le=100)
    close_date: OptionalDate = None
    organization_id: int | None = None
    contact_id: int | None = None


class MoveIn(BaseModel):
    stage: Stage
    index: int = Field(ge=0)


class ActivityIn(BaseModel):
    type: ActivityType
    description: Required
    happened_at: datetime
    contact_id: int | None = None
    deal_id: int | None = None
    follow_up_date: OptionalDate = None
    done: bool = False

    @model_validator(mode="after")
    def contact_or_deal(self):
        if (self.contact_id is None) == (self.deal_id is None):
            raise ValueError("An activity needs a contact or a deal, but not both.")
        return self
