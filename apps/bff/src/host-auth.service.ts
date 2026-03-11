import { Injectable } from "@nestjs/common";
import { createHash, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type HostAuthMode = "optional" | "strict";

type HostAuthRecord = {
  hostUserId: string;
  tokenSha256: string;
  provider?: string;
  scopes?: string[];
  expiresAt?: string;
  locale?: string;
  capabilities?: string[];
};

type HostAuthRegistry = {
  version: number;
  mode: HostAuthMode;
  provider: string;
  users: HostAuthRecord[];
};

type HostAuthHeaders = {
  hostUserId?: string;
  hostUserToken?: string;
  hostLocale?: string;
  hostCapabilities?: string;
  embedMode?: string;
};

export type HostAuthSession = {
  mode: "standalone" | "host";
  authenticated: boolean;
  strict: boolean;
  reason: string;
  userId: string | null;
  provider: string | null;
  scopes: string[];
  expiresAt: string | null;
  locale: string | null;
  capabilities: string[];
  embedMode: string | null;
  tokenPresent: boolean;
  registryPath: string;
  registryVersion: number | null;
  verifiedAt: string | null;
};

type CachedRegistry = {
  path: string;
  mtimeMs: number;
  registry: HostAuthRegistry;
};

function sanitizeCapabilities(values?: string[] | null) {
  if (!values) {
    return [];
  }
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function parseCapabilities(value?: string | null) {
  if (!value) {
    return [];
  }
  return sanitizeCapabilities(value.split(","));
}

function isDigestHex(value: string) {
  return /^[a-f0-9]{64}$/i.test(value);
}

@Injectable()
export class HostAuthService {
  private cache: CachedRegistry | null = null;
  private lastLoadError: "registry_missing" | "registry_invalid" | null = null;

  getRegistryPath() {
    const envPath = process.env.HOST_AUTH_REGISTRY_PATH;
    if (envPath) {
      return isAbsolute(envPath) ? envPath : resolve(process.cwd(), envPath);
    }
    return fileURLToPath(new URL("../../../runtime/host-auth-registry.json", import.meta.url));
  }

  getConfigSummary() {
    const registry = this.loadRegistry();
    return {
      authMode: "token-registry",
      strict: this.isStrict(registry),
      registryPath: this.getRegistryPath(),
      registryVersion: registry?.version ?? null,
      registryStatus: this.lastLoadError || (registry ? "loaded" : "unavailable")
    };
  }

  evaluateHeaders(headers: HostAuthHeaders): HostAuthSession {
    const registry = this.loadRegistry();
    const strict = this.isStrict(registry);
    const hostUserId = headers.hostUserId?.trim() || null;
    const hostUserToken = headers.hostUserToken?.trim() || null;
    const requestedCapabilities = parseCapabilities(headers.hostCapabilities);
    const requestedLocale = headers.hostLocale?.trim() || null;
    const embedMode = headers.embedMode?.trim() || null;

    const base = {
      strict,
      scopes: [] as string[],
      expiresAt: null,
      locale: requestedLocale,
      capabilities: requestedCapabilities,
      embedMode,
      tokenPresent: Boolean(hostUserToken),
      registryPath: this.getRegistryPath(),
      registryVersion: registry?.version ?? null,
      verifiedAt: null
    };

    if (!hostUserId && !hostUserToken) {
      return {
        ...base,
        mode: "standalone",
        authenticated: false,
        reason: "standalone",
        userId: null,
        provider: null
      };
    }

    if (!hostUserId) {
      return {
        ...base,
        mode: "host",
        authenticated: false,
        reason: "missing_user_id",
        userId: null,
        provider: null
      };
    }

    if (!hostUserToken) {
      return {
        ...base,
        mode: "host",
        authenticated: false,
        reason: "missing_token",
        userId: hostUserId,
        provider: registry?.provider ?? "local-registry"
      };
    }

    if (!registry) {
      return {
        ...base,
        mode: "host",
        authenticated: false,
        reason: this.lastLoadError || "registry_missing",
        userId: hostUserId,
        provider: null
      };
    }

    const record = registry.users.find((item) => item.hostUserId === hostUserId);
    if (!record) {
      return {
        ...base,
        mode: "host",
        authenticated: false,
        reason: "user_not_registered",
        userId: hostUserId,
        provider: registry.provider
      };
    }

    if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) {
      return {
        ...base,
        mode: "host",
        authenticated: false,
        reason: "token_expired",
        userId: hostUserId,
        provider: record.provider || registry.provider,
        expiresAt: record.expiresAt
      };
    }

    const expectedDigest = Buffer.from(record.tokenSha256, "hex");
    const actualDigest = createHash("sha256").update(hostUserToken).digest();
    const digestMatched =
      expectedDigest.length === actualDigest.length && timingSafeEqual(expectedDigest, actualDigest);

    if (!digestMatched) {
      return {
        ...base,
        mode: "host",
        authenticated: false,
        reason: "token_mismatch",
        userId: hostUserId,
        provider: record.provider || registry.provider,
        expiresAt: record.expiresAt || null,
        scopes: record.scopes || [],
        locale: requestedLocale || record.locale || null,
        capabilities: requestedCapabilities.length > 0 ? requestedCapabilities : sanitizeCapabilities(record.capabilities)
      };
    }

    return {
      ...base,
      mode: "host",
      authenticated: true,
      reason: "authenticated",
      userId: hostUserId,
      provider: record.provider || registry.provider,
      scopes: record.scopes || [],
      expiresAt: record.expiresAt || null,
      locale: requestedLocale || record.locale || null,
      capabilities: requestedCapabilities.length > 0 ? requestedCapabilities : sanitizeCapabilities(record.capabilities),
      verifiedAt: new Date().toISOString()
    };
  }

  private isStrict(registry: HostAuthRegistry | null) {
    if (process.env.HOST_AUTH_STRICT === "1") {
      return true;
    }
    return registry?.mode === "strict";
  }

  private loadRegistry(): HostAuthRegistry | null {
    const path = this.getRegistryPath();
    if (!existsSync(path)) {
      this.lastLoadError = "registry_missing";
      return null;
    }

    const mtimeMs = statSync(path).mtimeMs;
    if (this.cache && this.cache.path === path && this.cache.mtimeMs === mtimeMs) {
      this.lastLoadError = null;
      return this.cache.registry;
    }

    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<HostAuthRegistry> & {
        users?: Array<Partial<HostAuthRecord>>;
      };
      const users = Array.isArray(raw.users)
        ? raw.users
            .filter((item): item is HostAuthRecord => Boolean(item.hostUserId) && Boolean(item.tokenSha256))
            .map((item) => ({
              hostUserId: String(item.hostUserId).trim(),
              tokenSha256: isDigestHex(String(item.tokenSha256)) ? String(item.tokenSha256).toLowerCase() : "",
              provider: typeof item.provider === "string" ? item.provider : undefined,
              scopes: Array.isArray(item.scopes) ? item.scopes.map((scope) => String(scope).trim()).filter(Boolean) : [],
              expiresAt: typeof item.expiresAt === "string" ? item.expiresAt : undefined,
              locale: typeof item.locale === "string" ? item.locale : undefined,
              capabilities: Array.isArray(item.capabilities)
                ? item.capabilities.map((capability) => String(capability).trim()).filter(Boolean)
                : []
            }))
            .filter((item) => item.hostUserId && item.tokenSha256)
        : [];

      const registry: HostAuthRegistry = {
        version: Number(raw.version) || 1,
        mode: raw.mode === "strict" ? "strict" : "optional",
        provider: typeof raw.provider === "string" ? raw.provider : "local-registry",
        users
      };

      this.cache = { path, mtimeMs, registry };
      this.lastLoadError = null;
      return registry;
    } catch {
      this.lastLoadError = "registry_invalid";
      return null;
    }
  }
}
