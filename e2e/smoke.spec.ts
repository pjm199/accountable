import { expect, resetDatabase, test } from "./fixtures";

test.beforeAll(resetDatabase);

test("the app opens on the dashboard and every nav link opens its screen with data", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toHaveClass(/active/);

  const screens = [
    ["Organizations", "/organizations", "Brightwave Media"],
    ["Contacts", "/contacts", "Tara Nguyen"],
    ["Deals", "/deals", "Website rebuild"],
    ["Pipeline", "/pipeline", null],
    ["Dashboard", "/", null],
  ] as const;
  for (const [name, path, sample] of screens) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(nav.getByRole("link", { name, exact: true })).toHaveClass(/active/);
    if (sample) await expect(page.getByRole("link", { name: sample, exact: true }).first()).toBeVisible();
  }
});

test("an unknown address shows Page not found", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByText("Page not found")).toBeVisible();
  await page.getByRole("link", { name: "Go to the dashboard" }).click();
  await expect(page).toHaveURL("/");
});
