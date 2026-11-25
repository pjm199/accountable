import { test as base, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const testDb = join(root, "data", "e2e-test.db");
export const API = "http://127.0.0.1:8100/api";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Fails the test on any browser console error, and on any request that
 * leaves this computer (R5). A test that makes the server refuse on purpose
 * can allow the console message that refusal causes, and nothing else. */
export const test = base.extend<{ guard: void; expectedConsoleErrors: RegExp[] }>({
  expectedConsoleErrors: [[], { option: true }],
  guard: [
    async ({ page, expectedConsoleErrors }, use) => {
      const problems: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        if (expectedConsoleErrors.some((pattern) => pattern.test(msg.text()))) return;
        problems.push(`console error: ${msg.text()}`);
      });
      page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.protocol.startsWith("http") && !LOCAL_HOSTS.has(url.hostname)) {
          problems.push(`outside request: ${url.href}`);
          return route.abort();
        }
        return route.continue();
      });
      await use();
      expect(problems, "browser problems").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Puts the sample data back in the test database. Each spec file calls it
 * in beforeAll, so files don't depend on each other. */
export function resetDatabase() {
  execFileSync("uv", ["run", "python", "-m", "backend.seed"], {
    cwd: root,
    env: { ...process.env, ACCOUNTABLE_DB: testDb },
    stdio: "pipe",
  });
}

export async function api<T = unknown>(page: Page, path: string): Promise<T> {
  const reply = await page.request.get(`${API}${path}`);
  expect(reply.ok()).toBeTruthy();
  return (await reply.json()) as T;
}

/** The table row whose name link is `name`. */
export function row(page: Page, name: string) {
  return page.getByRole("row").filter({ has: page.getByRole("link", { name, exact: true }) });
}

/** The names in a table's first column, top to bottom. */
export async function firstColumn(page: Page): Promise<string[]> {
  return page.locator("table.data-table tbody tr td:first-child").allInnerTexts();
}

/** The app's US$12.5K format, to compare figures read from the API. */
export function moneyShort(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, "");
  if (dollars >= 999_950) return `US$${trim(dollars / 1_000_000)}M`;
  if (dollars >= 1_000) return `US$${trim(dollars / 1_000)}K`;
  return `US$${Math.round(dollars).toLocaleString("en-US")}`;
}

/** The app's US$12,500 format. */
export function money(cents: number): string {
  return `US$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
