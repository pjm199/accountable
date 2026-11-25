import type { Page } from "@playwright/test";
import { expect, resetDatabase, test } from "./fixtures";

test.beforeAll(resetDatabase);

async function log(page: Page, type: string, description: string, when?: string, followUp?: string) {
  await page.getByRole("button", { name: "Log activity" }).click();
  const dialog = page.getByRole("dialog", { name: "Log activity" });
  await dialog.getByLabel("Type").selectOption({ label: type });
  await dialog.getByLabel("Description").fill(description);
  if (when) await dialog.getByLabel("When").fill(when);
  if (followUp) await dialog.getByLabel("Follow-up date").fill(followUp);
  await dialog.getByRole("button", { name: "Log activity" }).click();
  await expect(dialog).toBeHidden();
}

const timeline = (page: Page) => page.getByRole("list", { name: "Timeline entries" });
const entry = (page: Page, text: string) => timeline(page).getByRole("listitem").filter({ hasText: text });

test("log a note, call and email on a contact; newest first", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("link", { name: "Noah Walsh", exact: true }).click();
  await log(page, "Note", "E2E note, oldest", "2030-01-01T09:00");
  await log(page, "Call", "E2E call, middle", "2030-01-02T09:00");
  await log(page, "Email", "E2E email, newest", "2030-01-03T09:00");
  const items = timeline(page).getByRole("listitem");
  await expect(items.nth(0)).toContainText("E2E email, newest");
  await expect(items.nth(1)).toContainText("E2E call, middle");
  await expect(items.nth(2)).toContainText("E2E note, oldest");
  await page.reload();
  await expect(items.nth(0)).toContainText("E2E email, newest");
});

test("an activity on a deal shows on its main contact's timeline", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("link", { name: "Freight portal", exact: true }).click();
  await log(page, "Call", "E2E call on the deal", "2030-02-01T10:00");
  await expect(entry(page, "E2E call on the deal")).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Noah Walsh" }).first().click();
  const onContact = entry(page, "E2E call on the deal");
  await expect(onContact).toBeVisible();
  await expect(onContact.getByRole("link", { name: "Freight portal" })).toBeVisible();
});

test("edit, tick Done and delete with confirmation", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("link", { name: "Ella Brooks", exact: true }).click();
  await log(page, "Call", "E2E follow-up call", undefined, "2030-03-01");
  await expect(entry(page, "E2E follow-up call")).toContainText("Follow-up 1 Mar 2030");

  await entry(page, "E2E follow-up call").hover();
  await page.getByRole("button", { name: "Edit activity: E2E follow-up call" }).click();
  const edit = page.getByRole("dialog", { name: "Edit activity" });
  await edit.getByLabel("Description").fill("E2E follow-up call, edited");
  await edit.getByLabel("Done").check();
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(entry(page, "E2E follow-up call, edited")).toContainText("Follow-up done");

  await entry(page, "E2E follow-up call, edited").hover();
  await page.getByRole("button", { name: "Delete activity: E2E follow-up call, edited" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete activity?" });
  await expect(confirm).toContainText("E2E follow-up call, edited");
  await confirm.getByRole("button", { name: "Delete activity" }).click();
  await expect(entry(page, "E2E follow-up call")).toHaveCount(0);
  await page.reload();
  await expect(entry(page, "E2E follow-up call")).toHaveCount(0);
});

test("a stage change appears in the timeline by itself", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("link", { name: "Booking system", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit deal" });
  await edit.getByLabel("Stage").selectOption({ label: "Proposal" });
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(timeline(page).getByRole("listitem").first()).toContainText("Moved from Qualified to Proposal");
  // Stage changes can't be edited or deleted.
  await expect(timeline(page).getByRole("listitem").first().getByRole("button")).toHaveCount(0);
});

test("the form won't save without a description", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("link", { name: "Ian Carter", exact: true }).click();
  await page.getByRole("button", { name: "Log activity" }).click();
  const dialog = page.getByRole("dialog", { name: "Log activity" });
  await dialog.getByRole("button", { name: "Log activity" }).click();
  await expect(dialog.getByText("Description is required.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});
