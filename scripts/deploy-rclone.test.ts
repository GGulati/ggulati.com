import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createDeployManifest,
  diffDeployManifests,
  readDeployManifest,
  runDeployment,
  writeDeployManifest,
} from "./deploy-rclone-lib.js";

function temporaryDirectory() {
  return mkdtempSync(join(tmpdir(), "ggulati-deploy-test-"));
}

function writeFixture(root: string, path: string, content: string) {
  const fullPath = join(root, ...path.split("/"));
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content, "utf8");
}

function withTemporaryDirectory(
  callback: (directory: string) => void,
) {
  const directory = temporaryDirectory();
  try {
    callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("manifest hashes are independent of file modification times", () => {
  withTemporaryDirectory((directory) => {
    writeFixture(directory, "index.html", "same bytes");
    const first = createDeployManifest(directory, "destination");

    const later = new Date(Date.now() + 60_000);
    utimesSync(join(directory, "index.html"), later, later);
    const second = createDeployManifest(directory, "destination");

    assert.deepEqual(second, first);
  });
});

test("manifest diff detects same-size changes, additions, and deletions", () => {
  withTemporaryDirectory((directory) => {
    const previousDirectory = join(directory, "previous");
    const currentDirectory = join(directory, "current");
    mkdirSync(previousDirectory);
    mkdirSync(currentDirectory);

    writeFixture(previousDirectory, "same.html", "same");
    writeFixture(previousDirectory, "changed.html", "old!");
    writeFixture(previousDirectory, "deleted.html", "gone");
    writeFixture(currentDirectory, "same.html", "same");
    writeFixture(currentDirectory, "changed.html", "new!");
    writeFixture(currentDirectory, "new.html", "new");

    const delta = diffDeployManifests(
      createDeployManifest(previousDirectory, "destination"),
      createDeployManifest(currentDirectory, "destination"),
    );

    assert.deepEqual(delta.upload, ["changed.html", "new.html"]);
    assert.deepEqual(delta.delete, ["deleted.html"]);
    assert.deepEqual(delta.unchanged, ["same.html"]);
  });
});

test("incremental deploy uploads before deleting and advances the manifest", () => {
  withTemporaryDirectory((directory) => {
    const previousDirectory = join(directory, "previous");
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(previousDirectory);
    mkdirSync(distDirectory);

    writeFixture(previousDirectory, "same.html", "same");
    writeFixture(previousDirectory, "changed.html", "old!");
    writeFixture(previousDirectory, "deleted.html", "gone");
    writeFixture(distDirectory, "same.html", "same");
    writeFixture(distDirectory, "changed.html", "new!");
    writeFixture(distDirectory, "new.html", "new");
    writeDeployManifest(
      manifestPath,
      createDeployManifest(previousDirectory, "destination"),
    );

    const calls: Array<{ args: string[]; files: string[] }> = [];
    runDeployment({
      mode: "incremental",
      dryRun: false,
      allowSync: false,
      distDir: distDirectory,
      manifestPath,
      destination: "remote:/site",
      destinationFingerprint: "destination",
      remoteArgs: ["--remote-option"],
      transferArgs: ["--inplace"],
      runRclone: (args) => {
        const listIndex = args.indexOf("--files-from");
        const files =
          listIndex === -1
            ? []
            : readFileSync(args[listIndex + 1], "utf8").trim().split("\n");
        calls.push({ args: [...args], files });
      },
      log: () => {},
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].args[0], "copy");
    assert.deepEqual(calls[0].files, ["changed.html", "new.html"]);
    assert.ok(calls[0].args.includes("--ignore-times"));
    assert.ok(calls[0].args.includes("--no-traverse"));
    assert.ok(calls[0].args.includes("--inplace"));
    assert.equal(calls[1].args[0], "delete");
    assert.deepEqual(calls[1].files, ["deleted.html"]);
    assert.ok(calls[1].args.includes("--no-traverse"));
    assert.ok(!calls[1].args.includes("--inplace"));

    assert.deepEqual(
      readDeployManifest(manifestPath).manifest,
      createDeployManifest(distDirectory, "destination"),
    );
  });
});

test("failed deletion leaves the previous manifest untouched", () => {
  withTemporaryDirectory((directory) => {
    const previousDirectory = join(directory, "previous");
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(previousDirectory);
    mkdirSync(distDirectory);

    writeFixture(previousDirectory, "changed.html", "old!");
    writeFixture(previousDirectory, "deleted.html", "gone");
    writeFixture(distDirectory, "changed.html", "new!");
    writeDeployManifest(
      manifestPath,
      createDeployManifest(previousDirectory, "destination"),
    );
    const originalManifest = readFileSync(manifestPath, "utf8");
    let callCount = 0;

    assert.throws(
      () =>
        runDeployment({
          mode: "incremental",
          dryRun: false,
          allowSync: false,
          distDir: distDirectory,
          manifestPath,
          destination: "remote:/site",
          destinationFingerprint: "destination",
          remoteArgs: [],
          runRclone: () => {
            callCount += 1;
            if (callCount === 2) throw new Error("delete failed");
          },
          log: () => {},
        }),
      /delete failed/,
    );

    assert.equal(readFileSync(manifestPath, "utf8"), originalManifest);
  });
});

test("dry runs show the delta without updating the manifest", () => {
  withTemporaryDirectory((directory) => {
    const previousDirectory = join(directory, "previous");
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(previousDirectory);
    mkdirSync(distDirectory);

    writeFixture(previousDirectory, "old.html", "old");
    writeFixture(distDirectory, "new.html", "new");
    writeDeployManifest(
      manifestPath,
      createDeployManifest(previousDirectory, "destination"),
    );
    const originalManifest = readFileSync(manifestPath, "utf8");
    const calls: string[][] = [];
    const logs: string[] = [];

    runDeployment({
      mode: "incremental",
      dryRun: true,
      allowSync: false,
      distDir: distDirectory,
      manifestPath,
      destination: "remote:/site",
      destinationFingerprint: "destination",
      remoteArgs: [],
      transferArgs: ["--inplace"],
      runRclone: (args) => calls.push([...args]),
      log: (message) => logs.push(message),
    });

    assert.equal(calls.length, 2);
    assert.ok(calls.every((args) => args.includes("--dry-run")));
    assert.ok(logs.includes("Upload: new.html"));
    assert.ok(logs.includes("Delete: old.html"));
    assert.equal(readFileSync(manifestPath, "utf8"), originalManifest);
  });
});

test("missing manifest requires an allowed full-sync baseline", () => {
  withTemporaryDirectory((directory) => {
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(distDirectory);
    writeFixture(distDirectory, "index.html", "site");

    assert.throws(
      () =>
        runDeployment({
          mode: "incremental",
          dryRun: false,
          allowSync: false,
          distDir: distDirectory,
          manifestPath,
          destination: "remote:/site",
          destinationFingerprint: "destination",
          remoteArgs: [],
          runRclone: () => assert.fail("rclone should not run"),
          log: () => {},
        }),
      /RCLONE_ALLOW_SYNC=true/,
    );

    const calls: string[][] = [];
    runDeployment({
      mode: "incremental",
      dryRun: true,
      allowSync: true,
      distDir: distDirectory,
      manifestPath,
      destination: "remote:/site",
      destinationFingerprint: "destination",
      remoteArgs: [],
      transferArgs: ["--inplace"],
      runRclone: (args) => calls.push([...args]),
      log: () => {},
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "sync");
    assert.ok(calls[0].includes("--ignore-times"));
    assert.ok(calls[0].includes("--inplace"));
    assert.ok(calls[0].includes("--dry-run"));
    assert.equal(readDeployManifest(manifestPath).manifest, undefined);
  });
});

test("invalid or wrong-destination manifests trigger a full-sync baseline", () => {
  withTemporaryDirectory((directory) => {
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(distDirectory);
    mkdirSync(join(directory, "cache"));
    writeFixture(distDirectory, "index.html", "site");
    writeFileSync(manifestPath, "{invalid", "utf8");

    assert.throws(
      () =>
        runDeployment({
          mode: "incremental",
          dryRun: false,
          allowSync: false,
          distDir: distDirectory,
          manifestPath,
          destination: "remote:/site",
          destinationFingerprint: "destination",
          remoteArgs: [],
          runRclone: () => assert.fail("rclone should not run"),
          log: () => {},
        }),
      /RCLONE_ALLOW_SYNC=true/,
    );

    writeDeployManifest(
      manifestPath,
      createDeployManifest(distDirectory, "old-destination"),
    );
    const calls: string[][] = [];
    runDeployment({
      mode: "incremental",
      dryRun: false,
      allowSync: true,
      distDir: distDirectory,
      manifestPath,
      destination: "remote:/site",
      destinationFingerprint: "new-destination",
      remoteArgs: [],
      runRclone: (args) => calls.push([...args]),
      log: () => {},
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "sync");
    assert.equal(
      readDeployManifest(manifestPath).manifest?.destination,
      "new-destination",
    );
  });
});

test("explicit sync refreshes the manifest", () => {
  withTemporaryDirectory((directory) => {
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(distDirectory);
    writeFixture(distDirectory, "index.html", "site");
    const calls: string[][] = [];

    runDeployment({
      mode: "sync",
      dryRun: false,
      allowSync: true,
      distDir: distDirectory,
      manifestPath,
      destination: "remote:/site",
      destinationFingerprint: "destination",
      remoteArgs: [],
      runRclone: (args) => calls.push([...args]),
      log: () => {},
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "sync");
    assert.deepEqual(
      readDeployManifest(manifestPath).manifest,
      createDeployManifest(distDirectory, "destination"),
    );
  });
});

test("zero delta skips rclone", () => {
  withTemporaryDirectory((directory) => {
    const distDirectory = join(directory, "dist");
    const manifestPath = join(directory, "cache", "manifest.json");
    mkdirSync(distDirectory);
    writeFixture(distDirectory, "index.html", "site");
    writeDeployManifest(
      manifestPath,
      createDeployManifest(distDirectory, "destination"),
    );

    runDeployment({
      mode: "incremental",
      dryRun: false,
      allowSync: false,
      distDir: distDirectory,
      manifestPath,
      destination: "remote:/site",
      destinationFingerprint: "destination",
      remoteArgs: [],
      runRclone: () => assert.fail("rclone should not run"),
      log: () => {},
    });
  });
});
