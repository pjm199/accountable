import { API, expect, resetDatabase, row, test } from "./fixtures";

test.beforeAll(resetDatabase);

test("late deals show the badge and a tinted row", async ({ page }) => {
  const deals = await (await page.request.get(`${API}/deals`)).json();
  const late = deals.filter((d: { is_late: boolean }) => d.is_late);
  expect(late.length).toBeGreaterThanOrEqual(3);
  await page.goto("/deals");
  await expect(page.locator("tr.row-late")).toHaveCount(late.length);
  for (const deal of late) {
    await expect(row(page, deal.name).getByText("Late", { exact: true })).toBeVisible();
  }
});

test("add a deal, search, sort, change its stage in the form, and refresh", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("main").getByRole("button", { name: "Add deal" }).click();
  const dialog = page.getByRole("dialog", { name: "Add deal" });
  await dialog.getByLabel("Name").fill("Kiosk rollout");
  await dialog.getByLabel("Value").fill("33,500");
  await dialog.getByLabel("Main contact").click();
  await page.getByPlaceholder("Type to search").fill("Hana");
  await page.getByRole("option", { name: /Hana Kim/ }).click();
  await expect(dialog.getByLabel("Organization")).toHaveText(/Greenleaf Grocers/);
  await dialog.getByRole("button", { name: "Add deal" }).click();
  await expect(dialog).toBeHidden();
  await expect(row(page, "Kiosk rollout")).toContainText("US$33,500");
  await expect(row(page, "Kiosk rollout")).toContainText("10%");

  await page.getByRole("searchbox").fill("kiosk");
  await expect(page.locator("table.data-table tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");

  await page.getByRole("button", { name: "Value" }).click();
  const values = (await page.locator("table.data-table tbody tr td:nth-child(5)").allInnerTexts()).map((v) => Number(v.replace(/[^\d.]/g, "")));
  const ascending = [...values].sort((a, b) => a - b);
  expect([ascending, [...ascending].reverse()]).toContainEqual(values);

  await row(page, "Kiosk rollout").getByRole("button", { name: "Edit Kiosk rollout" }).click();
  const edit = page.getByRole("dialog", { name: "Edit deal" });
  await edit.getByLabel("Stage").selectOption({ label: "Negotiation" });
  await expect(edit.getByLabel("Probability of close")).toHaveValue("75");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(row(page, "Kiosk rollout")).toContainText("Negotiation");
  await expect(row(page, "Kiosk rollout")).toContainText("75%");

  await page.reload();
  await expect(row(page, "Kiosk rollout")).toContainText("Negotiation");
  await expect(row(page, "Kiosk rollout")).toContainText("75%");
});

test("delete asks first and says what goes with it", async ({ page }) => {
  await page.goto("/deals");
  await row(page, "Q1 retainer").getByRole("button", { name: "Delete Q1 retainer" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete deal?" });
  await expect(dialog).toContainText("its stage history will be deleted.");
  await dialog.getByRole("button", { name: "Delete deal" }).click();
  await expect(row(page, "Q1 retainer")).toHaveCount(0);
  await page.reload();
  await expect(row(page, "Q1 retainer")).toHaveCount(0);
});
