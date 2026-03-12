import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { useHostStore } from "../store/host-store";

describe("api host headers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useHostStore.setState({
      hostTheme: "ember",
      deviceType: "browser",
      hostUserId: null,
      hostUserToken: null,
      hostLocale: "zh-CN",
      hostCapabilities: [],
      embedMode: "standalone",
      bridgeStatus: "disconnected",
      contextSource: "default"
    });
  });

  it("sends host identity headers with exam requests", async () => {
    useHostStore.setState({
      hostUserId: "real-user-7",
      hostUserToken: "opaque-token",
      hostLocale: "en-US",
      deviceType: "mobile-shell",
      hostCapabilities: ["share", "clipboard"],
      embedMode: "webview-first"
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ item: { id: "exam-force", title: "样卷", durationMinutes: 60, sections: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    await api.getExam("exam-force");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get("x-host-user-id")).toBe("real-user-7");
    expect(headers.get("x-host-user-token")).toBe("opaque-token");
    expect(headers.get("x-host-locale")).toBe("en-US");
    expect(headers.get("x-host-device-type")).toBe("mobile-shell");
    expect(headers.get("x-host-capabilities")).toBe("share,clipboard");
    expect(headers.get("x-embed-mode")).toBe("webview-first");
  });
});
