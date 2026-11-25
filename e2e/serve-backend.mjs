// Starts the backend for the end-to-end tests on its own port with a fresh
// database of its own. The backend creates and seeds the file on first start.
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const testDb = join(root, "data", "e2e-test.db");

for (const suffix of ["", "-wal", "-shm", "-journal"]) {
  rmSync(testDb + suffix, { force: true });
}

const child = spawn(
  "uv",
  ["run", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8100"],
  { cwd: root, stdio: "inherit", env: { ...process.env, ACCOUNTABLE_DB: testDb } },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
