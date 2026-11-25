import { z } from "zod";
import { parseDollars } from "../../lib/format";

// Form values are kept as the text typed; the schemas check them and the
// to*Input functions turn them into what the API takes.

const required = (label: string) => z.string().trim().min(1, `${label} is required.`);
const optionalText = z.string();
const link = z.number().int().nullable();

export const organizationSchema = z.object({
  name: required("Name"),
  website: optionalText,
  industry: optionalText,
  notes: optionalText,
});

export const contactSchema = z.object({
  name: required("Name"),
  status: z.enum(["lead", "qualified", "customer"], { error: "Status is required." }),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter an email such as name@example.com."),
  phone: optionalText,
  job_title: optionalText,
  organization_id: link,
});

export const dealSchema = z.object({
  name: required("Name"),
  stage: z.enum(["new", "qualified", "proposal", "negotiation", "won", "lost"], { error: "Stage is required." }),
  value: required("Value").refine((v) => v.trim() === "" || parseDollars(v) !== null, "Value must be a number, 0 or more."),
  probability: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 100), "Probability must be a whole number from 0 to 100."),
  close_date: optionalText,
  organization_id: link,
  contact_id: link,
});

export const activitySchema = z.object({
  type: z.enum(["note", "call", "email"], { error: "Type is required." }),
  description: required("Description"),
  happened_at: required("When"),
  follow_up_date: optionalText,
  done: z.boolean(),
});

export type OrganizationValues = z.infer<typeof organizationSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
export type DealValues = z.infer<typeof dealSchema>;
export type ActivityValues = z.infer<typeof activitySchema>;

export const blank = (text: string) => (text.trim() === "" ? null : text.trim());
