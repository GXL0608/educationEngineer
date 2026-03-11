// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { bootstrapHostBridge, emitHostEvent } from "./host-bridge";
import { getHostContextSnapshot, useHostStore } from "../store/host-store";

function resetHostState() {
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
}

describe("host bridge", () => {
  afterEach(() => {
    resetHostState();
    window.history.replaceState({}, "", "/");
    delete window.__EDU_HOST_CONTEXT__;
    delete window.EducationEngineerHost;
  });

  it("bootstraps host context from query string and window injection", () => {
    window.history.replaceState(
      {},
      "",
      "/?hostUserId=host-user-42&hostDeviceType=mobile-shell&hostCapabilities=share,clipboard"
    );
    window.__EDU_HOST_CONTEXT__ = {
      hostTheme: "ocean",
      hostLocale: "en-US"
    };

    bootstrapHostBridge();
    const snapshot = getHostContextSnapshot();

    expect(snapshot.hostUserId).toBe("host-user-42");
    expect(snapshot.deviceType).toBe("mobile-shell");
    expect(snapshot.hostTheme).toBe("ocean");
    expect(snapshot.hostLocale).toBe("en-US");
    expect(snapshot.hostCapabilities).toEqual(["share", "clipboard"]);
    expect(snapshot.bridgeStatus).toBe("bootstrapped");
  });

  it("forwards host events through the JS bridge", () => {
    const emitEvent = vi.fn();
    window.EducationEngineerHost = { emitEvent };
    useHostStore.setState({ hostUserId: "host-user-99" });

    emitHostEvent("checkpoint_saved", { examId: "exam-force-unit" });

    expect(emitEvent).toHaveBeenCalledTimes(1);
    expect(emitEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "education-engineer:event",
      eventType: "checkpoint_saved",
      userId: "host-user-99"
    });
  });
});
