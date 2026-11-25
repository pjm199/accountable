import { expect, resetDatabase, row, test } from "./fixtures";

test.beforeAll(resetDatabase);

test("organization page lists its contacts and deals, and links work both ways", async ({ page }) => {
  await page.goto("/organizations");
  await page.getByRole("link", { name: "Greenleaf Grocers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Greenleaf Grocers" })).toBeVisible();
  const contacts = page.getByRole("list", { name: "Contacts" });
  const deals = page.getByRole("list", { name: "Deals" });
  await expect(contacts.getByRole("link", { name: "Hana Kim" })).toBeVisible();
  await expect(deals.getByRole("link", { name: "Inventory module" })).toBeVisible();
  await expect(deals).toContainText("US$41,000");

  await contacts.getByRole("link", { name: "Hana Kim" }).click();
  await expect(page.getByRole("heading", { name: /Hana Kim/ })).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Greenleaf Grocers" }).first().click();
  await expect(page.getByRole("heading", { name: "Greenleaf Grocers" })).toBeVisible();
});

test("contact page shows its organization, deals and timeline", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("link", { name: "Hana Kim", exact: true }).click();
  await expect(page.getByText("Head of Operations at Greenleaf Grocers")).toBeVisible();
  const deals = page.getByRole("list", { name: "Deals" });
  await expect(deals.getByRole("link", { name: "Inventory module" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await deals.getByRole("link", { name: "Inventory module" }).click();
  await expect(page.getByRole("heading", { name: /Inventory module/ })).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Hana Kim" }).first().click();
  await expect(page).toHaveURL(/\/contacts\/\d+/);
});

test("deal page shows its details, Late badge, links and stage history", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("link", { name: "Data migration", exact: true }).click();
  const head = page.getByRole("heading", { name: /Data migration/ });
  await expect(head.getByText("Late")).toBeVisible();
  await expect(page.getByRole("main")).toContainText("US$27,000");
  await expect(page.getByRole("main")).toContainText("75%");
  const timeline = page.getByRole("list", { name: "Timeline entries" });
  await expect(timeline).toContainText("Moved from Proposal to Negotiation");
  await expect(timeline.getByRole("listitem").last()).toContainText("Created in New");

  await page.getByRole("main").getByRole("link", { name: "Northline Freight" }).first().click();
  await expect(page.getByRole("list", { name: "Deals" }).getByRole("link", { name: "Data migration" })).toBeVisible();
});

test("deleting from a record page goes back to the list", async ({ page }) => {
  await page.goto("/deals");
  await page.getByRole("link", { name: "Brand refresh", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete deal" }).click();
  await expect(page).toHaveURL("/deals");
  await expect(row(page, "Brand refresh")).toHaveCount(0);
});

test("adding a contact from an organization page links it", async ({ page }) => {
  await page.goto("/organizations");
  await page.getByRole("link", { name: "Summit Fitness", exact: true }).click();
  await page.getByRole("button", { name: "Add contact" }).click();
  const dialog = page.getByRole("dialog", { name: "Add contact" });
  await expect(dialog.getByLabel("Organization")).toHaveText(/Summit Fitness/);
  await dialog.getByLabel("Name").fill("Pat Morgan");
  await dialog.getByRole("button", { name: "Add contact" }).click();
  await expect(page.getByRole("list", { name: "Contacts" }).getByRole("link", { name: "Pat Morgan" })).toBeVisible();
});
