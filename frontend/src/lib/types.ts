// Shapes of the backend's JSON replies. Money is in integer cents; dates are
// "YYYY-MM-DD" and date-times "YYYY-MM-DDTHH:MM:SS", both local.

export type Stage = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type ContactStatus = "lead" | "qualified" | "customer";
export type ActivityType = "note" | "call" | "email";

export interface Organization {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrganizationRow extends Organization {
  contact_count: number;
  open_deal_count: number;
  open_value_cents: number;
}

export interface Contact {
  id: number;
  name: string;
  status: ContactStatus;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
  organization_name: string | null;
  created_at: string;
}

export interface Deal {
  id: number;
  name: string;
  stage: Stage;
  value_cents: number;
  probability: number;
  close_date: string | null;
  position: number;
  organization_id: number | null;
  organization_name: string | null;
  contact_id: number | null;
  contact_name: string | null;
  is_late: boolean;
  created_at: string;
}

export interface Activity {
  id: number;
  type: ActivityType;
  description: string;
  happened_at: string;
  contact_id: number | null;
  deal_id: number | null;
  follow_up_date: string | null;
  done: boolean;
}

export interface TimelineActivity {
  kind: "activity";
  id: number;
  at: string;
  type: ActivityType;
  description: string;
  follow_up_date: string | null;
  done: boolean;
  contact_id: number | null;
  contact_name: string | null;
  deal_id: number | null;
  deal_name: string | null;
}

export interface TimelineStageChange {
  kind: "stage_change";
  id: number;
  at: string;
  from_stage: Stage | null;
  to_stage: Stage;
  description: string;
  deal_id: number;
  deal_name: string | null;
}

export type TimelineEntry = TimelineActivity | TimelineStageChange;

export interface OrganizationDetail extends Organization {
  contacts: Contact[];
  deals: Deal[];
}

export interface ContactDetail extends Contact {
  deals: Deal[];
  timeline: TimelineEntry[];
}

export interface DealDetail extends Deal {
  timeline: TimelineEntry[];
}

export interface FollowUp {
  id: number;
  type: ActivityType;
  description: string;
  follow_up_date: string;
  overdue: boolean;
  contact_id: number | null;
  contact_name: string | null;
  deal_id: number | null;
  deal_name: string | null;
}

export interface RecentEntry {
  kind: "activity" | "stage_change";
  id: number;
  type: ActivityType | "stage";
  description: string;
  at: string;
  contact_id: number | null;
  contact_name: string | null;
  deal_id: number | null;
  deal_name: string | null;
}

export interface Dashboard {
  today: string;
  attention_count: number;
  follow_ups_due_count: number;
  expected_revenue_cents: number;
  open_value_cents: number;
  won_12_months_cents: number;
  open_count: number;
  late_count: number;
  months: { month: string; label: string; won_cents: number; won_count: number }[];
  open_by_stage: { stage: Stage; value_cents: number; count: number }[];
  funnel: { stage: Stage; value_cents: number; count: number }[];
  follow_ups: FollowUp[];
  recent: RecentEntry[];
}

export type DeleteKind = "organizations" | "contacts" | "deals";
export type DeleteImpact = Record<string, number>;

export interface OrganizationInput {
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
}

export interface ContactInput {
  name: string;
  status: ContactStatus;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
}

export interface DealInput {
  name: string;
  stage: Stage;
  value_cents: number;
  probability: number;
  close_date: string | null;
  organization_id: number | null;
  contact_id: number | null;
}

export interface ActivityInput {
  type: ActivityType;
  description: string;
  happened_at: string;
  contact_id: number | null;
  deal_id: number | null;
  follow_up_date: string | null;
  done: boolean;
}
