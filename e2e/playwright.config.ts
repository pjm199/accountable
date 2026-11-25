import { defineConfig } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  // One database is shared by every test, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [["list"]],
  outputDir: join(root, "test-results"),
  use: {
    baseURL: "http://localhost:5273",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node e2e/serve-backend.mjs",
      cwd: root,
      url: "http://127.0.0.1:8100/api/health",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "npm run dev --workspace frontend -- --port 5273 --strictPort",
      cwd: root,
      url: "http://localhost:5273",
      reuseExistingServer: false,
      env: { ACCOUNTABLE_API_PORT: "8100" },
      timeout: 60_000,
    },
  ],
});
