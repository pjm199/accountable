import type { Page } from "@playwright/test";
import { API, expect, money, moneyShort, resetDatabase, test } from "./fixtures";

test.beforeEach(resetDatabase);

interface Dashboard {
  expected_revenue_cents: number;
  open_value_cents: number;
  won_12_months_cents: number;
  open_count: number;
  late_count: number;
  attention_count: number;
  follow_ups: { description: string }[];
  funnel: { stage: string; value_cents: number }[];
  recent: { description: string }[];
}

const dashboard = async (page: Page): Promise<Dashboard> => (await page.request.get(`${API}/dashboard`)).json();
const summary = (page: Page) => page.getByRole("region", { name: "Summary" });

test("the figures match the API", async ({ page }) => {
  const data = await dashboard(page);
  await page.goto("/");
  await expect(page.getByTestId("expected-revenue")).toHaveText(money(data.expected_revenue_cents));
  await expect(page.getByTestId("open-value")).toHaveText(moneyShort(data.open_value_cents));
  await expect(page.getByTestId("won-12-months")).toHaveText(moneyShort(data.won_12_months_cents));
  await expect(page.getByTestId("open-count")).toHaveText(String(data.open_count));
  await expect(page.getByTestId("late-count")).toHaveText(String(data.late_count));
  for (const stage of data.funnel) {
    await expect(page.getByTestId(`funnel-${stage.stage}`)).toHaveText(moneyShort(stage.value_cents));
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText("need you this week");
  const recent = page.getByRole("list", { name: "Recent activity" }).getByRole("listitem");
  await expect(recent).toHaveCount(10);
  await expect(recent.first()).toContainText(data.recent[0].description);
});

test("charts, donut and funnel are drawn", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".recharts-area-curve")).toHaveCount(1);
  await expect(page.locator(".recharts-bar-rectangle")).toHaveCount(12);
  await expect(page.locator(".recharts-pie-sector")).toHaveCount(4);
  await expect(page.getByRole("list", { name: "Sales funnel" }).getByRole("listitem")).toHaveCount(5);
});

test("marking a deal won raises the won figures", async ({ page }) => {
  const before = await dashboard(page);
  const deals = await (await page.request.get(`${API}/deals`)).json();
  const deal = deals.find((d: { name: string }) => d.name === "Multi-site licence");

  await page.goto(`/deals/${deal.id}`);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit deal" });
  await dialog.getByLabel("Stage").selectOption({ label: "Won" });
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  const after = before.won_12_months_cents + deal.value_cents;
  await expect(page.getByTestId("won-12-months")).toHaveText(moneyShort(after));
  await expect(page.getByTestId("open-count")).toHaveText(String(before.open_count - 1));
  expect((await dashboard(page)).won_12_months_cents).toBe(after);
  await expect(page.getByRole("list", { name: "Recent activity" })).toContainText("Moved from Negotiation to Won");
});

test("a new follow-up appears, even months ahead under Show all, and Done removes it", async ({ page }) => {
  const ahead = new Date();
  ahead.setMonth(ahead.getMonth() + 5);
  await page.goto("/contacts");
  await page.getByRole("link", { name: "Grace Liu", exact: true }).click();
  await page.getByRole("button", { name: "Log activity" }).click();
  const dialog = page.getByRole("dialog", { name: "Log activity" });
  await dialog.getByLabel("Description").fill("E2E check in after the season");
  await dialog.getByLabel("Follow-up date").fill(ahead.toLocaleDateString("en-CA"));
  await dialog.getByRole("button", { name: "Log activity" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  const total = (await dashboard(page)).follow_ups.length;
  await summary(page).getByRole("button", { name: `Show all ${total}` }).click();
  const all = page.getByRole("dialog", { name: "All follow-ups" });
  const item = all.getByRole("listitem").filter({ hasText: "E2E check in after the season" });
  await expect(item).toBeVisible();
  await expect(item).toContainText("Grace Liu");
  await item.getByRole("button", { name: "Done: E2E check in after the season" }).click();
  await expect(item).toHaveCount(0);
  await page.keyboard.press("Escape");
  expect((await dashboard(page)).follow_ups.map((f) => f.description)).not.toContain("E2E check in after the season");
});

test("Done on the panel removes a follow-up and the first five refill", async ({ page }) => {
  const data = await dashboard(page);
  await page.goto("/");
  const list = page.getByRole("list", { name: "Follow-ups" });
  await expect(list.getByRole("listitem")).toHaveCount(5);
  await expect(list.getByRole("listitem").first()).toContainText("Overdue");
  const first = data.follow_ups[0].description;
  await list.getByRole("button", { name: `Done: ${first}` }).click();
  await expect(list).not.toContainText(first);
  await expect(list.getByRole("listitem")).toHaveCount(5);
  await expect(list.getByRole("listitem").last()).toContainText(data.follow_ups[5].description);
});
