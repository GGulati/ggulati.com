import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";

export const DEPLOY_MANIFEST_VERSION = 1;

export type DeployMode = "incremental" | "sync";

export interface FileManifestEntry {
  sha256: string;
  size: number;
}

export interface DeployManifest {
  version: typeof DEPLOY_MANIFEST_VERSION;
  destination: string;
  files: Record<string, FileManifestEntry>;
}

export interface DeployDelta {
  upload: string[];
  delete: string[];
  unchanged: string[];
}

export interface ManifestReadResult {
  manifest?: DeployManifest;
  reason?: string;
}

interface RunDeploymentOptions {
  mode: DeployMode;
  dryRun: boolean;
  allowSync: boolean;
  distDir: string;
  manifestPath: string;
  destination: string;
  destinationFingerprint: string;
  remoteArgs: string[];
  transferArgs?: string[];
  runRclone: (args: string[]) => void;
  log?: (message: string) => void;
}

function normalizedRelativePath(root: string, path: string) {
  return relative(root, path).split(sep).join("/");
}

function hashFile(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function collectFiles(root: string, directory: string, paths: string[]) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(root, fullPath, paths);
    } else if (entry.isFile()) {
      paths.push(normalizedRelativePath(root, fullPath));
    } else {
      throw new Error(`Unsupported deploy output entry: ${fullPath}`);
    }
  }
}

function isSafeManifestPath(path: string) {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.startsWith("#") &&
    !path.startsWith(";") &&
    path.trim() === path &&
    !path.includes("\\") &&
    !path.includes("\r") &&
    !path.includes("\n") &&
    path.split("/").every((part) => part && part !== "." && part !== "..")
  );
}

function isFileEntry(value: unknown): value is FileManifestEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<FileManifestEntry>;
  return (
    typeof entry.sha256 === "string" &&
    /^[a-f0-9]{64}$/.test(entry.sha256) &&
    typeof entry.size === "number" &&
    Number.isSafeInteger(entry.size) &&
    entry.size >= 0
  );
}

export function fingerprintDestination(identity: string) {
  return createHash("sha256").update(identity).digest("hex");
}

export function createDeployManifest(
  distDir: string,
  destinationFingerprint: string,
): DeployManifest {
  const paths: string[] = [];
  collectFiles(distDir, distDir, paths);
  paths.sort();

  const files: Record<string, FileManifestEntry> = {};
  for (const path of paths) {
    if (!isSafeManifestPath(path)) {
      throw new Error(`Unsupported deploy path: ${path}`);
    }
    const fullPath = join(distDir, ...path.split("/"));
    files[path] = {
      sha256: hashFile(fullPath),
      size: statSync(fullPath).size,
    };
  }

  return {
    version: DEPLOY_MANIFEST_VERSION,
    destination: destinationFingerprint,
    files,
  };
}

export function readDeployManifest(path: string): ManifestReadResult {
  if (!existsSync(path)) {
    return { reason: "deployment manifest is missing" };
  }

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { reason: "deployment manifest is not valid JSON" };
  }

  if (!value || typeof value !== "object") {
    return { reason: "deployment manifest is not an object" };
  }

  const manifest = value as Partial<DeployManifest>;
  if (manifest.version !== DEPLOY_MANIFEST_VERSION) {
    return { reason: "deployment manifest version is unsupported" };
  }
  if (typeof manifest.destination !== "string") {
    return { reason: "deployment manifest destination is invalid" };
  }
  if (!manifest.files || typeof manifest.files !== "object") {
    return { reason: "deployment manifest files are invalid" };
  }

  for (const [filePath, entry] of Object.entries(manifest.files)) {
    if (!isSafeManifestPath(filePath) || !isFileEntry(entry)) {
      return { reason: `deployment manifest entry is invalid: ${filePath}` };
    }
  }

  return { manifest: manifest as DeployManifest };
}

export function diffDeployManifests(
  previous: DeployManifest,
  current: DeployManifest,
): DeployDelta {
  const upload: string[] = [];
  const unchanged: string[] = [];

  for (const [path, entry] of Object.entries(current.files)) {
    const oldEntry = previous.files[path];
    if (
      oldEntry &&
      oldEntry.sha256 === entry.sha256 &&
      oldEntry.size === entry.size
    ) {
      unchanged.push(path);
    } else {
      upload.push(path);
    }
  }

  const deleted = Object.keys(previous.files).filter(
    (path) => !(path in current.files),
  );

  return {
    upload: upload.sort(),
    delete: deleted.sort(),
    unchanged: unchanged.sort(),
  };
}

export function writeDeployManifest(path: string, manifest: DeployManifest) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;

  try {
    writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    renameSync(temporaryPath, path);
  } finally {
    if (existsSync(temporaryPath)) rmSync(temporaryPath, { force: true });
  }
}

function withCommonArgs(
  args: string[],
  dryRun: boolean,
  remoteArgs: string[],
) {
  args.push("--verbose", "--progress");
  if (dryRun) args.push("--dry-run");
  args.push(...remoteArgs);
  return args;
}

function requireSyncPermission(allowSync: boolean) {
  if (!allowSync) {
    throw new Error(
      "Set RCLONE_ALLOW_SYNC=true in .deploy.env before running a full sync or establishing an incremental baseline.",
    );
  }
}

function writeFileList(directory: string, name: string, paths: string[]) {
  const path = join(directory, name);
  writeFileSync(path, `${paths.join("\n")}\n`, "utf8");
  return path;
}

function logPaths(log: (message: string) => void, label: string, paths: string[]) {
  for (const path of paths) log(`${label}: ${path}`);
}

export function runDeployment(options: RunDeploymentOptions) {
  const {
    mode,
    dryRun,
    allowSync,
    distDir,
    manifestPath,
    destination,
    destinationFingerprint,
    remoteArgs,
    transferArgs = [],
    runRclone,
    log = console.log,
  } = options;
  const current = createDeployManifest(distDir, destinationFingerprint);

  const runFullSync = (reason: string) => {
    requireSyncPermission(allowSync);
    log(`Full sync required: ${reason}.`);
    runRclone(
      withCommonArgs(
        [
          "sync",
          distDir,
          destination,
          "--ignore-times",
          ...transferArgs,
        ],
        dryRun,
        remoteArgs,
      ),
    );
    if (!dryRun) writeDeployManifest(manifestPath, current);
  };

  if (mode === "sync") {
    runFullSync("sync mode requested");
    return;
  }

  const previousResult = readDeployManifest(manifestPath);
  if (!previousResult.manifest) {
    runFullSync(previousResult.reason || "deployment manifest is unavailable");
    return;
  }
  if (previousResult.manifest.destination !== destinationFingerprint) {
    runFullSync("deployment destination changed");
    return;
  }

  const delta = diffDeployManifests(previousResult.manifest, current);
  log(
    `Deployment delta: ${delta.upload.length} upload, ${delta.delete.length} delete, ${delta.unchanged.length} unchanged.`,
  );

  if (dryRun) {
    logPaths(log, "Upload", delta.upload);
    logPaths(log, "Delete", delta.delete);
  }

  if (!delta.upload.length && !delta.delete.length) {
    log("Deployment is already up to date.");
    return;
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "ggulati-deploy-"));

  try {
    if (delta.upload.length) {
      const uploadList = writeFileList(
        temporaryDirectory,
        "upload.txt",
        delta.upload,
      );
      runRclone(
        withCommonArgs(
          [
            "copy",
            distDir,
            destination,
            "--files-from",
            uploadList,
            "--no-traverse",
            "--ignore-times",
            ...transferArgs,
          ],
          dryRun,
          remoteArgs,
        ),
      );
    }

    if (delta.delete.length) {
      const deleteList = writeFileList(
        temporaryDirectory,
        "delete.txt",
        delta.delete,
      );
      runRclone(
        withCommonArgs(
          [
            "delete",
            destination,
            "--files-from",
            deleteList,
            "--no-traverse",
          ],
          dryRun,
          remoteArgs,
        ),
      );
    }

    if (!dryRun) writeDeployManifest(manifestPath, current);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
