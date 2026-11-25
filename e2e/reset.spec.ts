import { API, expect, resetDatabase, row, test } from "./fixtures";

test("after changes, running the seed brings the sample data back", async ({ page }) => {
  resetDatabase();
  const orgs = await (await page.request.get(`${API}/organizations`)).json();
  const harbor = orgs.find((o: { name: string }) => o.name === "Harbor Dental");
  await page.request.delete(`${API}/organizations/${harbor.id}`);
  await page.request.post(`${API}/organizations`, { data: { name: "Added before the reset" } });

  await page.goto("/organizations");
  await expect(row(page, "Harbor Dental")).toHaveCount(0);
  await expect(row(page, "Added before the reset")).toBeVisible();

  // The same command as `npm run seed`, on the test database, with the app running.
  resetDatabase();
  await page.reload();
  await expect(row(page, "Harbor Dental")).toBeVisible();
  await expect(row(page, "Added before the reset")).toHaveCount(0);
  await expect(page.locator("table.data-table tbody tr")).toHaveCount(12);
});
