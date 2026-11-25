import { API, expect, firstColumn, resetDatabase, row, test } from "./fixtures";

test.beforeAll(resetDatabase);

test("add, search, edit and keep after a refresh", async ({ page }) => {
  await page.goto("/organizations");
  await page.getByRole("button", { name: "Add organization" }).click();
  const dialog = page.getByRole("dialog", { name: "Add organization" });
  await dialog.getByRole("button", { name: "Add organization" }).click();
  await expect(dialog.getByText("Name is required.")).toBeVisible();
  await dialog.getByLabel("Name").fill("Zephyr Analytics");
  await dialog.getByLabel("Industry").fill("Technology");
  await dialog.getByLabel("Website").fill("zephyr.io");
  await dialog.getByRole("button", { name: "Add organization" }).click();
  await expect(dialog).toBeHidden();
  await expect(row(page, "Zephyr Analytics")).toContainText("Technology");

  await page.getByRole("searchbox").fill("ZEPHYR");
  expect(await firstColumn(page)).toEqual(["Zephyr Analytics"]);
  await page.getByRole("searchbox").fill("");

  await row(page, "Zephyr Analytics").getByRole("button", { name: "Edit Zephyr Analytics" }).click();
  const edit = page.getByRole("dialog", { name: "Edit organization" });
  await expect(edit.getByLabel("Name")).toHaveValue("Zephyr Analytics");
  await edit.getByLabel("Name").fill("Zephyr Data");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(row(page, "Zephyr Data")).toBeVisible();

  await page.reload();
  await expect(row(page, "Zephyr Data")).toContainText("zephyr.io");
});

test("sort by clicking a heading, and again to reverse", async ({ page }) => {
  await page.goto("/organizations");
  await page.getByRole("button", { name: "Name" }).click();
  const sorted = await firstColumn(page);
  expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
  await page.getByRole("button", { name: "Name" }).click();
  expect(await firstColumn(page)).toEqual([...sorted].reverse());

  await page.getByRole("button", { name: "Open value" }).click();
  const values = await page.locator("table.data-table tbody tr td:nth-child(6)").allInnerTexts();
  const numbers = values.map((v) => Number(v.replace(/[^\d.]/g, "")));
  const ascending = [...numbers].sort((a, b) => a - b);
  expect([ascending, [...ascending].reverse()]).toContainEqual(numbers);
});

test("delete asks first; contacts and deals keep — after the delete", async ({ page }) => {
  const orgs = await (await page.request.get(`${API}/organizations`)).json();
  const greenleaf = orgs.find((o: { name: string }) => o.name === "Greenleaf Grocers");
  const counts = await (await page.request.get(`${API}/delete-impact/organizations/${greenleaf.id}`)).json();

  await page.goto("/organizations");
  await row(page, "Greenleaf Grocers").getByRole("button", { name: "Delete Greenleaf Grocers" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete organization?" });
  await expect(dialog).toContainText(`Its ${counts.contacts} contacts and ${counts.deals} deals will be kept, with no organization.`);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(row(page, "Greenleaf Grocers")).toBeVisible();

  await row(page, "Greenleaf Grocers").getByRole("button", { name: "Delete Greenleaf Grocers" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete organization" }).click();
  await expect(row(page, "Greenleaf Grocers")).toHaveCount(0);
  await page.reload();
  await expect(row(page, "Greenleaf Grocers")).toHaveCount(0);

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contacts" }).click();
  await expect(row(page, "Hana Kim").locator("td").nth(2)).toHaveText("—");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Deals" }).click();
  await expect(row(page, "Inventory module").locator("td").nth(1)).toHaveText("—");
});
