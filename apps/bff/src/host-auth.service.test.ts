import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { HostAuthService } from "./host-auth.service.js";

function writeRegistry(filePath: string) {
  writeFileSync(
    filePath,
    JSON.stringify(
      {
        version: 1,
        mode: "optional",
        provider: "test-host",
        users: [
          {
            hostUserId: "host-user-42",
            tokenSha256: "ad09f5ce19d8729fbc88815a17403f32a60a3d48549a752fecbee49272cdd629",
            scopes: ["education-engineer"],
            locale: "zh-CN",
            capabilities: ["share", "clipboard"]
          }
        ]
      },
      null,
      2
    )
  );
}

test("authenticates a registered host user", () => {
  const dir = mkdtempSync(join(tmpdir(), "edu-host-auth-"));
  const filePath = join(dir, "registry.json");
  const previous = process.env.HOST_AUTH_REGISTRY_PATH;

  try {
    writeRegistry(filePath);
    process.env.HOST_AUTH_REGISTRY_PATH = filePath;
    const service = new HostAuthService();
    const session = service.evaluateHeaders({
      hostUserId: "host-user-42",
      hostUserToken: "host-demo-token-42",
      hostLocale: "en-US",
      hostCapabilities: "share,clipboard",
      embedMode: "webview-first"
    });

    assert.equal(session.authenticated, true);
    assert.equal(session.reason, "authenticated");
    assert.equal(session.userId, "host-user-42");
    assert.equal(session.provider, "test-host");
    assert.deepEqual(session.capabilities, ["share", "clipboard"]);
    assert.equal(session.locale, "en-US");
  } finally {
    if (previous === undefined) {
      delete process.env.HOST_AUTH_REGISTRY_PATH;
    } else {
      process.env.HOST_AUTH_REGISTRY_PATH = previous;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects an invalid host token", () => {
  const dir = mkdtempSync(join(tmpdir(), "edu-host-auth-"));
  const filePath = join(dir, "registry.json");
  const previous = process.env.HOST_AUTH_REGISTRY_PATH;

  try {
    writeRegistry(filePath);
    process.env.HOST_AUTH_REGISTRY_PATH = filePath;
    const service = new HostAuthService();
    const session = service.evaluateHeaders({
      hostUserId: "host-user-42",
      hostUserToken: "wrong-token"
    });

    assert.equal(session.authenticated, false);
    assert.equal(session.reason, "token_mismatch");
    assert.equal(session.mode, "host");
  } finally {
    if (previous === undefined) {
      delete process.env.HOST_AUTH_REGISTRY_PATH;
    } else {
      process.env.HOST_AUTH_REGISTRY_PATH = previous;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("allows standalone requests without host headers", () => {
  const service = new HostAuthService();
  const session = service.evaluateHeaders({});

  assert.equal(session.mode, "standalone");
  assert.equal(session.authenticated, false);
  assert.equal(session.reason, "standalone");
});
