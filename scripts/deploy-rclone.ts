import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type DeployMode,
  fingerprintDestination,
  runDeployment,
} from "./deploy-rclone-lib.js";

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

function runRclone(args: string[], options: { input?: string } = {}) {
  const result = spawnSync("rclone", args, {
    cwd: projectRoot,
    input: options.input,
    encoding: options.input === undefined ? undefined : "utf8",
    stdio: options.input === undefined ? "inherit" : ["pipe", "pipe", "pipe"],
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      typeof result.stderr === "string" && result.stderr.trim()
        ? result.stderr.trim()
        : `rclone exited with status ${result.status ?? 1}.`,
    );
  }

  return typeof result.stdout === "string" ? result.stdout.trim() : "";
}

function obscurePassword(password: string) {
  return runRclone(["obscure", "-"], { input: password });
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const distDir = resolve(projectRoot, "dist");
const manifestPath = resolve(
  projectRoot,
  ".deploy-cache",
  "rclone-manifest.json",
);
const env = loadEnv(resolve(projectRoot, ".deploy.env"));
const mode = (argValue("--mode") ||
  env.RCLONE_DEPLOY_MODE ||
  "incremental") as DeployMode;
const dryRun = hasArg("--dry-run");
const usingInlineFtp = env.RCLONE_REMOTE === ":ftp";
const required = usingInlineFtp
  ? ["FTP_HOST", "FTP_USER", "FTP_PASSWORD", "RCLONE_REMOTE_DIR"]
  : ["RCLONE_REMOTE", "RCLONE_REMOTE_DIR"];
const missing = required.filter((key) => !env[key]);

if (missing.length) {
  throw new Error(`Missing deploy env values: ${missing.join(", ")}`);
}

if (!["incremental", "sync"].includes(mode)) {
  throw new Error(
    `Invalid deploy mode "${mode}". Use "incremental" or "sync".`,
  );
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  throw new Error("Missing Astro build output: run npm run build before deploying.");
}

const destination = usingInlineFtp
  ? `:ftp:${env.RCLONE_REMOTE_DIR}`
  : `${env.RCLONE_REMOTE}:${env.RCLONE_REMOTE_DIR}`;
const remoteArgs: string[] = [];
const transferArgs: string[] = [];
let destinationIdentity: Record<string, string | boolean> = {
  remote: env.RCLONE_REMOTE,
  directory: env.RCLONE_REMOTE_DIR,
};

if (usingInlineFtp) {
  const skipCertificateCheck =
    env.RCLONE_FTP_NO_CHECK_CERTIFICATE === "true" ||
    env.FTP_NO_CHECK_CERTIFICATE === "true";
  const ftpHost = skipCertificateCheck
    ? env.FTP_HOST
    : env.FTP_TLS_SERVERNAME || env.FTP_HOST;

  remoteArgs.push(
    "--ftp-host",
    ftpHost,
    "--ftp-user",
    env.FTP_USER,
    "--ftp-pass",
    obscurePassword(env.FTP_PASSWORD),
  );

  if (env.FTP_SECURE === "true") remoteArgs.push("--ftp-explicit-tls");
  if (env.FTP_SECURE === "implicit") remoteArgs.push("--ftp-tls");
  if (skipCertificateCheck) remoteArgs.push("--ftp-no-check-certificate");
  transferArgs.push("--inplace");

  destinationIdentity = {
    remote: ":ftp",
    host: env.FTP_HOST,
    directory: env.RCLONE_REMOTE_DIR,
    secure: env.FTP_SECURE || "false",
    tlsServerName: env.FTP_TLS_SERVERNAME || "",
    skipCertificateCheck,
  };
}

runDeployment({
  mode,
  dryRun,
  allowSync: env.RCLONE_ALLOW_SYNC === "true",
  distDir,
  manifestPath,
  destination,
  destinationFingerprint: fingerprintDestination(
    JSON.stringify(destinationIdentity),
  ),
  remoteArgs,
  transferArgs,
  runRclone: (args) => {
    runRclone(args);
  },
});
