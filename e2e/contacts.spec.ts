import { API, expect, firstColumn, resetDatabase, row, test } from "./fixtures";

test.beforeAll(resetDatabase);

async function addContact(page: import("@playwright/test").Page, name: string, status: string, org?: string) {
  await page.getByRole("button", { name: "Add contact" }).click();
  const dialog = page.getByRole("dialog", { name: "Add contact" });
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("Status").selectOption({ label: status });
  if (org) {
    await dialog.getByLabel("Organization").click();
    await page.getByPlaceholder("Type to search").fill(org);
    await page.getByRole("option", { name: new RegExp(org) }).click();
  }
  await dialog.getByLabel("Email").fill(`${name.split(" ")[0].toLowerCase()}@example.com`);
  await dialog.getByRole("button", { name: "Add contact" }).click();
  await expect(dialog).toBeHidden();
}

test("add a lead, a qualified contact and a customer; filter by status", async ({ page }) => {
  await page.goto("/contacts");
  await addContact(page, "Quinn Lead", "Lead", "Harbor Dental");
  await addContact(page, "Riley Qualified", "Qualified");
  await addContact(page, "Sasha Customer", "Customer", "Summit");
  await expect(row(page, "Quinn Lead")).toContainText("Harbor Dental");
  await expect(row(page, "Riley Qualified").locator("td").nth(2)).toHaveText("—");

  const filter = page.getByRole("group", { name: "Filter by status" });
  for (const [label, status, mine, others] of [
    ["Leads", "lead", "Quinn Lead", ["Riley Qualified", "Sasha Customer"]],
    ["Qualified", "qualified", "Riley Qualified", ["Quinn Lead", "Sasha Customer"]],
    ["Customers", "customer", "Sasha Customer", ["Quinn Lead", "Riley Qualified"]],
  ] as const) {
    await filter.getByRole("button", { name: label }).click();
    const expected = await (await page.request.get(`${API}/contacts?status=${status}`)).json();
    await expect(page.locator("table.data-table tbody tr")).toHaveCount(expected.length);
    await expect(row(page, mine)).toBeVisible();
    for (const other of others) await expect(row(page, other)).toHaveCount(0);
  }
  await filter.getByRole("button", { name: "All" }).click();

  await page.reload();
  for (const name of ["Quinn Lead", "Riley Qualified", "Sasha Customer"]) await expect(row(page, name)).toBeVisible();
});

test("search, sort, edit and delete with confirmation", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("searchbox").fill("finch");
  // Matches by name (Margaret Finch) and by organization (Alder & Finch Law).
  expect((await firstColumn(page)).sort()).toEqual(["Ben Alder", "Margaret Finch"]);
  await page.getByRole("searchbox").fill("");

  await page.getByRole("button", { name: "Name" }).click();
  const names = await firstColumn(page);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

  await row(page, "Lucy Hart").getByRole("button", { name: "Edit Lucy Hart" }).click();
  const edit = page.getByRole("dialog", { name: "Edit contact" });
  await edit.getByLabel("Status").selectOption({ label: "Customer" });
  await edit.getByLabel("Job title").fill("Head Baker");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(row(page, "Lucy Hart")).toContainText("Customer");
  await expect(row(page, "Lucy Hart")).toContainText("Head Baker");

  const contacts = await (await page.request.get(`${API}/contacts`)).json();
  const tara = contacts.find((c: { name: string }) => c.name === "Tara Nguyen");
  const counts = await (await page.request.get(`${API}/delete-impact/contacts/${tara.id}`)).json();
  await row(page, "Tara Nguyen").getByRole("button", { name: "Delete Tara Nguyen" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete contact?" });
  await expect(dialog).toContainText(`Its ${counts.deals} deals will be kept, with no main contact.`);
  await expect(dialog).toContainText(`Its ${counts.activities} activit`);
  await dialog.getByRole("button", { name: "Delete contact" }).click();
  await expect(row(page, "Tara Nguyen")).toHaveCount(0);

  await page.reload();
  await expect(row(page, "Tara Nguyen")).toHaveCount(0);
  await expect(row(page, "Lucy Hart")).toContainText("Head Baker");
  await page.goto("/deals");
  await expect(row(page, "Website rebuild").locator("td").nth(2)).toHaveText("—");
});
