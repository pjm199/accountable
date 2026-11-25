// Runs the three test suites one after another and fails if any fails.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";

const suites = [
  ["Backend (pytest)", "uv", ["run", "pytest", "-q"]],
  ["Frontend (Vitest)", "npm", ["run", "test", "--workspace", "frontend"]],
  ["End to end (Playwright)", "npx", ["playwright", "test", "--config", "e2e/playwright.config.ts"]],
];

const failed = [];
for (const [name, cmd, args] of suites) {
  console.log(`\n=== ${name} ===\n`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: isWindows });
  if (result.status !== 0) failed.push(name);
}

console.log("");
if (failed.length) {
  console.log(`Failed: ${failed.join(", ")}`);
  process.exit(1);
}
console.log("All test suites passed.");
