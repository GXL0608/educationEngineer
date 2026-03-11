import { create } from "zustand";

export type HostTheme = "ember" | "ocean";
export type DeviceType = "browser" | "desktop-shell" | "mobile-shell";
export type EmbedMode = "standalone" | "webview-first" | "iframe" | "js-bridge";
export type BridgeStatus = "disconnected" | "bootstrapped" | "listening";

export type HostContext = {
  hostTheme: HostTheme;
  deviceType: DeviceType;
  hostUserId: string | null;
  hostUserToken: string | null;
  hostLocale: string;
  hostCapabilities: string[];
  embedMode: EmbedMode;
  bridgeStatus: BridgeStatus;
  contextSource: "default" | "query" | "window" | "bridge" | "message";
};

type HostState = HostContext & {
  setTheme: (theme: HostTheme) => void;
  setDeviceType: (device: DeviceType) => void;
  applyContext: (context: Partial<HostContext>) => void;
  setBridgeStatus: (status: BridgeStatus) => void;
};

const defaultHostContext: HostContext = {
  hostTheme: "ember",
  deviceType: "browser",
  hostUserId: null,
  hostUserToken: null,
  hostLocale: "zh-CN",
  hostCapabilities: [],
  embedMode: "standalone",
  bridgeStatus: "disconnected",
  contextSource: "default"
};

function sanitizeTheme(theme?: string | null): HostTheme | undefined {
  return theme === "ember" || theme === "ocean" ? theme : undefined;
}

function sanitizeDeviceType(deviceType?: string | null): DeviceType | undefined {
  return deviceType === "browser" || deviceType === "desktop-shell" || deviceType === "mobile-shell"
    ? deviceType
    : undefined;
}

function sanitizeEmbedMode(embedMode?: string | null): EmbedMode | undefined {
  return embedMode === "standalone" || embedMode === "webview-first" || embedMode === "iframe" || embedMode === "js-bridge"
    ? embedMode
    : undefined;
}

function sanitizeBridgeStatus(status?: string | null): BridgeStatus | undefined {
  return status === "disconnected" || status === "bootstrapped" || status === "listening" ? status : undefined;
}

function sanitizeCapabilities(capabilities?: string[] | null): string[] | undefined {
  if (!capabilities) {
    return undefined;
  }
  return [...new Set(capabilities.map((item) => item.trim()).filter(Boolean))];
}

function normalizeContext(current: HostContext, context: Partial<HostContext>): HostContext {
  return {
    hostTheme: sanitizeTheme(context.hostTheme) || current.hostTheme,
    deviceType: sanitizeDeviceType(context.deviceType) || current.deviceType,
    hostUserId: context.hostUserId === undefined ? current.hostUserId : context.hostUserId,
    hostUserToken: context.hostUserToken === undefined ? current.hostUserToken : context.hostUserToken,
    hostLocale: context.hostLocale?.trim() || current.hostLocale,
    hostCapabilities: sanitizeCapabilities(context.hostCapabilities) || current.hostCapabilities,
    embedMode: sanitizeEmbedMode(context.embedMode) || current.embedMode,
    bridgeStatus: sanitizeBridgeStatus(context.bridgeStatus) || current.bridgeStatus,
    contextSource: context.contextSource || current.contextSource
  };
}

export const useHostStore = create<HostState>((set) => ({
  ...defaultHostContext,
  setTheme: (hostTheme) => set({ hostTheme }),
  setDeviceType: (deviceType) => set({ deviceType }),
  applyContext: (context) =>
    set((state) => ({
      ...normalizeContext(state, context)
    })),
  setBridgeStatus: (bridgeStatus) => set({ bridgeStatus })
}));

export function applyHostContext(context: Partial<HostContext>) {
  useHostStore.getState().applyContext(context);
}

export function getHostContextSnapshot(): HostContext {
  const {
    hostTheme,
    deviceType,
    hostUserId,
    hostUserToken,
    hostLocale,
    hostCapabilities,
    embedMode,
    bridgeStatus,
    contextSource
  } = useHostStore.getState();
  return {
    hostTheme,
    deviceType,
    hostUserId,
    hostUserToken,
    hostLocale,
    hostCapabilities,
    embedMode,
    bridgeStatus,
    contextSource
  };
}

export function resolveActiveUserId() {
  return getHostContextSnapshot().hostUserId || "demo-user";
}
