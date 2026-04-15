/**
 * Tests for /gsd scan command — pure functions only
 */

import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  parseScanArgs,
  resolveScanDocuments,
  buildScanOutputPaths,
  checkExistingDocuments,
  VALID_FOCUS_AREAS,
  DEFAULT_FOCUS,
} from "../commands-scan.js";

// ─── Test fixtures ────────────────────────────────────────────────────────────

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "gsd-scan-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
  tmpDirs.length = 0;
});

// ─── parseScanArgs ────────────────────────────────────────────────────────────

describe("parseScanArgs", () => {
  test("returns default focus when no args provided", () => {
    const result = parseScanArgs("");
    assert.equal(result.focus, DEFAULT_FOCUS);
  });

  test("returns default focus for whitespace-only args", () => {
    const result = parseScanArgs("   ");
    assert.equal(result.focus, DEFAULT_FOCUS);
  });

  test("parses --focus tech", () => {
    const result = parseScanArgs("--focus tech");
    assert.equal(result.focus, "tech");
  });

  test("parses --focus arch", () => {
    const result = parseScanArgs("--focus arch");
    assert.equal(result.focus, "arch");
  });

  test("parses --focus quality", () => {
    const result = parseScanArgs("--focus quality");
    assert.equal(result.focus, "quality");
  });

  test("parses --focus concerns", () => {
    const result = parseScanArgs("--focus concerns");
    assert.equal(result.focus, "concerns");
  });

  test("parses --focus tech+arch", () => {
    const result = parseScanArgs("--focus tech+arch");
    assert.equal(result.focus, "tech+arch");
  });

  test("is case-insensitive for focus value", () => {
    const result = parseScanArgs("--focus TECH");
    assert.equal(result.focus, "tech");
  });

  test("returns default for unknown focus value", () => {
    const result = parseScanArgs("--focus unknown");
    assert.equal(result.focus, DEFAULT_FOCUS);
  });

  test("ignores extra whitespace around flag value", () => {
    const result = parseScanArgs("  --focus   arch  ");
    assert.equal(result.focus, "arch");
  });

  test("rejects shell injection attempts — uses default", () => {
    const result = parseScanArgs("--focus tech; rm -rf /");
    assert.equal(result.focus, DEFAULT_FOCUS);
  });
});

// ─── resolveScanDocuments ────────────────────────────────────────────────────

describe("resolveScanDocuments", () => {
  test("tech focus returns STACK and INTEGRATIONS", () => {
    const docs = resolveScanDocuments("tech");
    assert.deepEqual(docs, ["STACK", "INTEGRATIONS"]);
  });

  test("arch focus returns ARCHITECTURE and STRUCTURE", () => {
    const docs = resolveScanDocuments("arch");
    assert.deepEqual(docs, ["ARCHITECTURE", "STRUCTURE"]);
  });

  test("quality focus returns CONVENTIONS and TESTING", () => {
    const docs = resolveScanDocuments("quality");
    assert.deepEqual(docs, ["CONVENTIONS", "TESTING"]);
  });

  test("concerns focus returns CONCERNS only", () => {
    const docs = resolveScanDocuments("concerns");
    assert.deepEqual(docs, ["CONCERNS"]);
  });

  test("tech+arch (default) returns all four tech and arch docs", () => {
    const docs = resolveScanDocuments("tech+arch");
    assert.deepEqual(docs, ["STACK", "INTEGRATIONS", "ARCHITECTURE", "STRUCTURE"]);
  });

  test("unknown focus falls back to default documents", () => {
    const docs = resolveScanDocuments("unknown-area");
    assert.deepEqual(docs, resolveScanDocuments(DEFAULT_FOCUS));
  });

  test("each valid focus area returns at least one document", () => {
    for (const area of VALID_FOCUS_AREAS) {
      const docs = resolveScanDocuments(area);
      assert.ok(docs.length > 0, `focus "${area}" should return at least one document`);
    }
  });
});

// ─── buildScanOutputPaths ────────────────────────────────────────────────────

describe("buildScanOutputPaths", () => {
  test("returns paths under .planning/codebase/ relative to basePath", () => {
    const base = "/some/project";
    const paths = buildScanOutputPaths("tech", base);
    assert.ok(paths.every((p) => p.startsWith(join(base, ".planning", "codebase"))));
  });

  test("each path ends with .md extension", () => {
    const base = "/some/project";
    const paths = buildScanOutputPaths("arch", base);
    assert.ok(paths.every((p) => p.endsWith(".md")));
  });

  test("number of paths matches number of documents for focus", () => {
    const base = "/some/project";
    const docs = resolveScanDocuments("quality");
    const paths = buildScanOutputPaths("quality", base);
    assert.equal(paths.length, docs.length);
  });

  test("document names are uppercased in filenames", () => {
    const base = "/some/project";
    const paths = buildScanOutputPaths("tech", base);
    assert.ok(paths.some((p) => p.includes("STACK.md")));
    assert.ok(paths.some((p) => p.includes("INTEGRATIONS.md")));
  });

  test("falls back to default focus documents for unknown focus", () => {
    const base = "/some/project";
    const paths = buildScanOutputPaths("nonexistent-area", base);
    const expected = buildScanOutputPaths(DEFAULT_FOCUS, base);
    assert.deepEqual(paths, expected);
  });
});

// ─── checkExistingDocuments ──────────────────────────────────────────────────

describe("checkExistingDocuments", () => {
  test("returns empty array when no documents exist", () => {
    const tmpDir = makeTmpDir();
    const paths = [join(tmpDir, "STACK.md"), join(tmpDir, "INTEGRATIONS.md")];
    const existing = checkExistingDocuments(paths);
    assert.deepEqual(existing, []);
  });

  test("returns only the paths that exist on disk", () => {
    const tmpDir = makeTmpDir();
    const stackPath = join(tmpDir, "STACK.md");
    const intPath = join(tmpDir, "INTEGRATIONS.md");

    writeFileSync(stackPath, "# Stack");

    const existing = checkExistingDocuments([stackPath, intPath]);
    assert.deepEqual(existing, [stackPath]);
  });

  test("returns all paths when all documents exist", () => {
    const tmpDir = makeTmpDir();
    const paths = [
      join(tmpDir, "STACK.md"),
      join(tmpDir, "INTEGRATIONS.md"),
    ];

    for (const p of paths) writeFileSync(p, "content");

    const existing = checkExistingDocuments(paths);
    assert.deepEqual(existing, paths);
  });

  test("returns empty array for empty input", () => {
    const existing = checkExistingDocuments([]);
    assert.deepEqual(existing, []);
  });
});
