import type { Locator, Page } from "@playwright/test";
import { API, expect, resetDatabase, row, test } from "./fixtures";

test.beforeEach(resetDatabase);
// Tall enough that dragging never comes near the window's edge, where the
// board would scroll the page and move the cards under the mouse.
test.use({ viewport: { width: 1440, height: 1400 } });

const column = (page: Page, stage: string) => page.getByRole("region", { name: `${stage} column` });
const card = (page: Page, name: string) => page.locator("li.card", { hasText: name });
async function names(page: Page, stage: string) {
  await column(page, stage).locator("li.card").first().waitFor();
  return column(page, stage).locator("li.card .card-name").allInnerTexts();
}

/** Drags with the real mouse, in small steps, the way a person would.
 * "above" drops into another column just above the target card; "onto" drops
 * within a column in the target card's place. */
async function drag(page: Page, source: Locator, target: Locator, where: "above" | "onto") {
  const from = (await source.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 8, from.y + from.height / 2 + 8, { steps: 4 });
  await page.waitForTimeout(400);
  const to = (await target.boundingBox())!;
  const y = where === "above" ? to.y + to.height * 0.25 : to.y + to.height * 0.5;
  await page.mouse.move(to.x + to.width / 2, y, { steps: 25 });
  await page.waitForTimeout(400);
  await page.mouse.up();
}

async function figure(page: Page, testId: string, scope: Locator | Page = page) {
  return (await scope.getByTestId(testId).first().innerText()).trim();
}

test("drag to another column changes stage and probability, also in the deals table", async ({ page }) => {
  await page.goto("/pipeline");
  const newCount = Number(await figure(page, "column-count", column(page, "New")));
  await drag(page, card(page, "Website rebuild"), card(page, "CRM rollout"), "above");

  // The totals change straight away, before the server replies.
  await expect(column(page, "New").getByTestId("column-count")).toHaveText(String(newCount - 1));
  await expect(column(page, "Qualified").locator("li.card").first()).toContainText("Website rebuild");
  await expect(card(page, "Website rebuild")).toContainText("25%");

  await page.reload();
  expect((await names(page, "Qualified"))[0]).toBe("Website rebuild");
  await page.goto("/deals");
  await expect(row(page, "Website rebuild")).toContainText("Qualified");
  await expect(row(page, "Website rebuild")).toContainText("25%");
});

test("drag within a column to a middle spot survives a refresh", async ({ page }) => {
  await page.goto("/pipeline");
  const before = await names(page, "Proposal");
  // Take the top card and drop it below the third.
  await drag(page, card(page, before[0]), card(page, before[2]), "onto");
  const expected = [before[1], before[2], before[0], ...before.slice(3)];
  await expect.poll(() => names(page, "Proposal")).toEqual(expected);
  await expect.poll(async () => {
    const deals: { name: string; stage: string; position: number }[] = await (await page.request.get(`${API}/deals`)).json();
    return deals.filter((d) => d.stage === "proposal").sort((a, b) => a.position - b.position).map((d) => d.name);
  }).toEqual(expected);
  await page.reload();
  expect(await names(page, "Proposal")).toEqual(expected);
});

test("moving to Won takes the deal out of the open totals and sets today's date", async ({ page }) => {
  await page.goto("/pipeline");
  const openCount = Number(await figure(page, "open-count"));
  const deals = await (await page.request.get(`${API}/deals`)).json();
  const renewal = deals.find((d: { name: string }) => d.name === "Renewal 2027");
  const wonTop = (await names(page, "Won"))[0];

  await drag(page, card(page, "Renewal 2027"), card(page, wonTop), "above");
  await expect(page.getByTestId("open-count")).toHaveText(String(openCount - 1));
  await expect(column(page, "Won").locator("li.card").first()).toContainText("Renewal 2027");
  await expect(card(page, "Renewal 2027")).toContainText("100%");

  await expect.poll(async () => {
    const after = await (await page.request.get(`${API}/deals/${renewal.id}`)).json();
    return [after.stage, after.probability, after.close_date === new Date().toLocaleDateString("en-CA")];
  }).toEqual(["won", 100, true]);
  await page.goto(`/deals/${renewal.id}`);
  await expect(page.getByRole("list", { name: "Timeline entries" }).getByRole("listitem").first()).toContainText(
    "Moved from Negotiation to Won",
  );
});

test("cards can be moved with the keyboard", async ({ page }) => {
  await page.goto("/pipeline");
  const target = card(page, "Loyalty app");
  await target.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(column(page, "Qualified").locator("li.card", { hasText: "Loyalty app" })).toBeVisible();
  await expect.poll(async () => {
    const deals = await (await page.request.get(`${API}/deals`)).json();
    return deals.find((d: { name: string }) => d.name === "Loyalty app").stage;
  }).toBe("qualified");
});

test("clicking a card opens its deal page", async ({ page }) => {
  await page.goto("/pipeline");
  await card(page, "Multi-site licence").click({ position: { x: 20, y: 60 } });
  await expect(page.getByRole("heading", { name: /Multi-site licence/ })).toBeVisible();
});

test("add a deal in a column, and from the top bar; both land at the top", async ({ page }) => {
  await page.goto("/pipeline");
  await page.getByRole("button", { name: "Add deal in Proposal" }).click();
  let dialog = page.getByRole("dialog", { name: "Add deal" });
  await expect(dialog.getByLabel("Stage")).toHaveValue("proposal");
  await expect(dialog.getByLabel("Probability of close")).toHaveValue("50");
  await dialog.getByLabel("Name").fill("Column deal");
  await dialog.getByLabel("Value").fill("7000");
  await dialog.getByRole("button", { name: "Add deal" }).click();
  await expect(column(page, "Proposal").locator("li.card").first()).toContainText("Column deal");

  await page.getByRole("banner").getByRole("button", { name: "Add deal" }).click();
  dialog = page.getByRole("dialog", { name: "Add deal" });
  await expect(dialog.getByLabel("Stage")).toHaveValue("new");
  await dialog.getByLabel("Name").fill("Top bar deal");
  await dialog.getByLabel("Value").fill("1500");
  await dialog.getByRole("button", { name: "Add deal" }).click();
  await expect(column(page, "New").locator("li.card").first()).toContainText("Top bar deal");

  await page.getByRole("button", { name: "Add deal in Won" }).click();
  dialog = page.getByRole("dialog", { name: "Add deal" });
  await expect(dialog.getByLabel("Close date")).toHaveValue(new Date().toLocaleDateString("en-CA"));
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("late cards stand out", async ({ page }) => {
  const deals = await (await page.request.get(`${API}/deals`)).json();
  const late = deals.filter((d: { is_late: boolean }) => d.is_late);
  await page.goto("/pipeline");
  await expect(page.locator("li.card.late")).toHaveCount(late.length);
  for (const deal of late) await expect(card(page, deal.name)).toContainText("Late ·");
});

test("column and board figures match the deals", async ({ page }) => {
  const deals: { stage: string; value_cents: number; probability: number }[] = await (await page.request.get(`${API}/deals`)).json();
  const open = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const money = (cents: number) => `US$${Math.round(cents / 100).toLocaleString("en-US")}`;
  await page.goto("/pipeline");
  await expect(page.getByTestId("open-count")).toHaveText(String(open.length));
  await expect(page.getByTestId("open-value")).toHaveText(money(open.reduce((s, d) => s + d.value_cents, 0)));
  await expect(page.getByTestId("expected-revenue")).toHaveText(
    money(open.reduce((s, d) => s + (d.value_cents * d.probability) / 100, 0)),
  );
  const won = deals.filter((d) => d.stage === "won");
  await expect(column(page, "Won").getByTestId("column-value")).toHaveText(money(won.reduce((s, d) => s + d.value_cents, 0)));
});

test.describe("when the server refuses a move", () => {
  test.use({ expectedConsoleErrors: [/status of 422/] });

  test("the card goes back and a message says so", async ({ page }) => {
    await page.route("**/api/deals/*/move", (route) =>
      route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ detail: "That move isn't allowed." }) }),
    );
    await page.goto("/pipeline");
    const before = await names(page, "New");
    await drag(page, card(page, "Website rebuild"), card(page, "CRM rollout"), "above");
    await expect(page.locator(".toasts")).toContainText("The card was put back. That move isn't allowed.");
    await expect.poll(() => names(page, "New")).toEqual(before);
    await expect(column(page, "Qualified").locator("li.card", { hasText: "Website rebuild" })).toHaveCount(0);
  });
});
