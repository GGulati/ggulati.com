import { spawnSync } from "node:child_process";

const includeDrafts = process.argv.includes("--include-drafts");
const env = {
  ...process.env,
  ...(includeDrafts ? { INCLUDE_DRAFTS: "true" } : {}),
};

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    env,
    shell: true,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("astro", ["build"]);
run("tsx", ["scripts/fix-dist-paths.ts"]);
