import { applyHostContext, getHostContextSnapshot, HostContext } from "../store/host-store";

type HostBootstrapPayload = {
  hostTheme?: string;
  deviceType?: string;
  hostUserId?: string;
  hostUserToken?: string;
  hostLocale?: string;
  hostCapabilities?: string[] | string;
  embedMode?: string;
};

type HostEventEnvelope = {
  type: "education-engineer:event";
  eventType: string;
  payload: Record<string, unknown>;
  issuedAt: string;
  userId: string | null;
};

declare global {
  interface Window {
    __EDU_HOST_CONTEXT__?: HostBootstrapPayload;
    EducationEngineerHost?: {
      getContext?: () => HostBootstrapPayload | null | undefined;
      emitEvent?: (event: HostEventEnvelope) => void;
    };
    webkit?: {
      messageHandlers?: Record<string, { postMessage: (payload: HostEventEnvelope) => void }>;
    };
  }
}

let bridgeStarted = false;

function sanitizeTheme(value?: string | null): HostContext["hostTheme"] | undefined {
  return value === "ember" || value === "ocean" ? value : undefined;
}

function sanitizeDeviceType(value?: string | null): HostContext["deviceType"] | undefined {
  return value === "browser" || value === "desktop-shell" || value === "mobile-shell" ? value : undefined;
}

function sanitizeEmbedMode(value?: string | null): HostContext["embedMode"] | undefined {
  return value === "standalone" || value === "webview-first" || value === "iframe" || value === "js-bridge"
    ? value
    : undefined;
}

function parseCapabilities(input?: string[] | string | null): string[] | undefined {
  if (!input) {
    return undefined;
  }
  if (Array.isArray(input)) {
    return input.map((item) => item.trim()).filter(Boolean);
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

function normalizePayload(payload?: HostBootstrapPayload | null, source: HostContext["contextSource"] = "default") {
  if (!payload) {
    return {};
  }
  return {
    hostTheme: sanitizeTheme(payload.hostTheme),
    deviceType: sanitizeDeviceType(payload.deviceType),
    hostUserId: payload.hostUserId === undefined ? undefined : payload.hostUserId || null,
    hostUserToken: payload.hostUserToken === undefined ? undefined : payload.hostUserToken || null,
    hostLocale: payload.hostLocale || undefined,
    hostCapabilities: parseCapabilities(payload.hostCapabilities),
    embedMode: sanitizeEmbedMode(payload.embedMode),
    contextSource: source
  } satisfies Partial<HostContext>;
}

function readQueryPayload(): HostBootstrapPayload {
  const params = new URLSearchParams(window.location.search);
  return {
    hostTheme: params.get("hostTheme") || undefined,
    deviceType: params.get("hostDeviceType") || undefined,
    hostUserId: params.get("hostUserId") || undefined,
    hostUserToken: params.get("hostUserToken") || undefined,
    hostLocale: params.get("hostLocale") || undefined,
    hostCapabilities: params.get("hostCapabilities") || undefined,
    embedMode: params.get("embedMode") || undefined
  };
}

function readWindowPayload(): HostBootstrapPayload | null {
  if (window.__EDU_HOST_CONTEXT__) {
    return window.__EDU_HOST_CONTEXT__;
  }
  return window.EducationEngineerHost?.getContext?.() ?? null;
}

function handleContextMessage(event: MessageEvent<unknown>) {
  const payload = event.data;
  if (!payload || typeof payload !== "object") {
    return;
  }

  const message = payload as { type?: string; payload?: HostBootstrapPayload };
  if (message.type !== "education-engineer:host-context" && message.type !== "edu-host-context") {
    return;
  }

  applyHostContext({
    ...normalizePayload(message.payload, "message"),
    bridgeStatus: "listening"
  });
}

function attachExceptionForwarding() {
  window.addEventListener("error", (event) => {
    emitHostEvent("exception_raised", {
      kind: "window_error",
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    emitHostEvent("exception_raised", {
      kind: "unhandled_rejection",
      reason: String(event.reason)
    });
  });
}

export function bootstrapHostBridge() {
  applyHostContext(normalizePayload(readQueryPayload(), "query"));
  applyHostContext(normalizePayload(readWindowPayload(), "window"));
  applyHostContext({ bridgeStatus: "bootstrapped" });
}

export function startHostBridge() {
  if (bridgeStarted) {
    return;
  }

  bridgeStarted = true;
  bootstrapHostBridge();
  window.addEventListener("message", handleContextMessage);
  attachExceptionForwarding();
  applyHostContext({ bridgeStatus: "listening" });
  emitHostEvent("module_ready", {
    pathname: window.location.pathname,
    embedMode: getHostContextSnapshot().embedMode
  });
}

export function emitHostEvent(eventType: string, payload: Record<string, unknown> = {}) {
  const snapshot = getHostContextSnapshot();
  const envelope: HostEventEnvelope = {
    type: "education-engineer:event",
    eventType,
    payload,
    issuedAt: new Date().toISOString(),
    userId: snapshot.hostUserId
  };

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(envelope, "*");
  }

  window.webkit?.messageHandlers?.educationEngineer?.postMessage(envelope);
  window.EducationEngineerHost?.emitEvent?.(envelope);
}
