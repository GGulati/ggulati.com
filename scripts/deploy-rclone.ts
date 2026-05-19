import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function loadEnv(path: string) {
  const values: Record<string, string> = {};
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    values[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return values;
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const distDir = resolve(projectRoot, "dist");
const env = loadEnv(resolve(projectRoot, ".deploy.env"));
const mode = argValue("--mode") || env.RCLONE_DEPLOY_MODE || "copy";
const dryRun = hasArg("--dry-run");
const usingInlineFtp = env.RCLONE_REMOTE === ":ftp";
const required = usingInlineFtp
  ? ["FTP_HOST", "FTP_USER", "FTP_PASSWORD", "RCLONE_REMOTE_DIR"]
  : ["RCLONE_REMOTE", "RCLONE_REMOTE_DIR"];
const missing = required.filter((key) => !env[key]);

if (missing.length) {
  throw new Error(`Missing deploy env values: ${missing.join(", ")}`);
}

if (!["copy", "sync"].includes(mode)) {
  throw new Error(`Invalid deploy mode "${mode}". Use "copy" or "sync".`);
}

if (mode === "sync" && env.RCLONE_ALLOW_SYNC !== "true") {
  throw new Error("Set RCLONE_ALLOW_SYNC=true in .deploy.env before using sync mode.");
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  throw new Error("Missing Astro build output: run npm run build before deploying.");
}

function obscurePassword(password: string) {
  const result = spawnSync("rclone", ["obscure", "-"], {
    cwd: projectRoot,
    input: password,
    shell: true,
    encoding: "utf8",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || "Unable to obscure FTP password with rclone.");
  }

  return result.stdout.trim();
}

const destination = usingInlineFtp
  ? `:ftp:${env.RCLONE_REMOTE_DIR}`
  : `${env.RCLONE_REMOTE}:${env.RCLONE_REMOTE_DIR}`;
const args = [
  mode,
  distDir,
  destination,
  "--verbose",
  "--progress",
];

if (dryRun) args.push("--dry-run");

if (usingInlineFtp) {
  const skipCertificateCheck =
    env.RCLONE_FTP_NO_CHECK_CERTIFICATE === "true" ||
    env.FTP_NO_CHECK_CERTIFICATE === "true";
  const ftpHost = skipCertificateCheck
    ? env.FTP_HOST
    : env.FTP_TLS_SERVERNAME || env.FTP_HOST;

  args.push(
    "--ftp-host",
    ftpHost,
    "--ftp-user",
    env.FTP_USER,
    "--ftp-pass",
    obscurePassword(env.FTP_PASSWORD),
  );

  if (env.FTP_SECURE === "true") args.push("--ftp-explicit-tls");
  if (env.FTP_SECURE === "implicit") args.push("--ftp-tls");
  if (skipCertificateCheck) args.push("--ftp-no-check-certificate");
  args.push("--inplace");
}

const result = spawnSync("rclone", args, {
  cwd: projectRoot,
  shell: true,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
