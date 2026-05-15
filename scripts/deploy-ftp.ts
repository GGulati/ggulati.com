import { Client } from "basic-ftp";
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

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const distDir = resolve(projectRoot, "dist");
const env = loadEnv(resolve(projectRoot, ".deploy.env"));
const required = ["FTP_HOST", "FTP_USER", "FTP_PASSWORD", "FTP_REMOTE_DIR"];
const missing = required.filter((key) => !env[key]);
if (missing.length) {
  throw new Error(`Missing deploy env values: ${missing.join(", ")}`);
}

if (env.FTP_CLEAR_REMOTE !== "true") {
  throw new Error("Set FTP_CLEAR_REMOTE=true in .deploy.env to replace the remote directory with dist/.");
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  throw new Error("Missing Astro build output: run npm run build before npm run deploy.");
}

const client = new Client();
client.ftp.verbose = true;

try {
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    secure: env.FTP_SECURE === "true",
    secureOptions: env.FTP_TLS_SERVERNAME ? { servername: env.FTP_TLS_SERVERNAME } : undefined,
  });

  await client.cd(env.FTP_REMOTE_DIR);
  await client.clearWorkingDir();
  await client.uploadFromDir(distDir);
} finally {
  client.close();
}
