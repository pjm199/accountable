import { activitySchema, contactSchema, dealSchema, organizationSchema } from "./schemas";

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.message);

test("organization needs a name and nothing else", () => {
  expect(messages(organizationSchema.safeParse({ name: "  ", website: "", industry: "", notes: "" }))).toEqual(["Name is required."]);
  expect(organizationSchema.safeParse({ name: "Harbor Dental", website: "", industry: "", notes: "" }).success).toBe(true);
});

test("contact needs a name and status; email is checked only when given", () => {
  const base = { name: "Hana Kim", status: "lead", email: "", phone: "", job_title: "", organization_id: null };
  expect(contactSchema.safeParse(base).success).toBe(true);
  expect(messages(contactSchema.safeParse({ ...base, name: "" }))).toEqual(["Name is required."]);
  expect(contactSchema.safeParse({ ...base, status: "boss" }).success).toBe(false);
  expect(messages(contactSchema.safeParse({ ...base, email: "hana" }))).toEqual(["Enter an email such as name@example.com."]);
});

describe("deal", () => {
  const base = { name: "CRM rollout", stage: "new", value: "24000", probability: "10", close_date: "", organization_id: null, contact_id: null };

  test("needs a name, stage and value", () => {
    expect(dealSchema.safeParse(base).success).toBe(true);
    expect(messages(dealSchema.safeParse({ ...base, name: "", value: "" }))).toEqual(["Name is required.", "Value is required."]);
    expect(dealSchema.safeParse({ ...base, stage: "" }).success).toBe(false);
  });

  test("value is zero or more", () => {
    expect(dealSchema.safeParse({ ...base, value: "0" }).success).toBe(true);
    expect(dealSchema.safeParse({ ...base, value: "12,500.50" }).success).toBe(true);
    expect(messages(dealSchema.safeParse({ ...base, value: "-5" }))).toEqual(["Value must be a number, 0 or more."]);
    expect(dealSchema.safeParse({ ...base, value: "lots" }).success).toBe(false);
  });

  test("probability is a whole number from 0 to 100, or empty", () => {
    for (const ok of ["0", "100", "65", ""]) expect(dealSchema.safeParse({ ...base, probability: ok }).success).toBe(true);
    for (const bad of ["101", "-1", "12.5", "x"]) expect(dealSchema.safeParse({ ...base, probability: bad }).success).toBe(false);
  });
});

test("activity needs type, description and when; the follow-up is optional", () => {
  const base = { type: "call", description: "Called", happened_at: "2026-11-24T09:40", follow_up_date: "", done: false };
  expect(activitySchema.safeParse(base).success).toBe(true);
  expect(activitySchema.safeParse({ ...base, follow_up_date: "2026-12-01" }).success).toBe(true);
  expect(messages(activitySchema.safeParse({ ...base, description: " ", happened_at: "" }))).toEqual([
    "Description is required.",
    "When is required.",
  ]);
  expect(activitySchema.safeParse({ ...base, type: "meeting" }).success).toBe(false);
});
