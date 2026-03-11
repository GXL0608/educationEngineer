import { Controller, Get, Headers, Req } from "@nestjs/common";
import { HostAuthService, type HostAuthSession } from "./host-auth.service.js";

@Controller("host")
export class HostController {
  constructor(private readonly hostAuthService: HostAuthService) {}

  @Get("config")
  getHostConfig() {
    const auth = this.hostAuthService.getConfigSummary();
    return {
      version: "1.0.0",
      module: "education-engineer-web",
      embedMode: "webview-first",
      auth,
      contextMessageTypes: ["education-engineer:host-context", "edu-host-context"],
      bridgeMethods: {
        input: ["query-string", "window.__EDU_HOST_CONTEXT__", "window.EducationEngineerHost.getContext()", "postMessage"],
        output: ["window.parent.postMessage", "window.webkit.messageHandlers.educationEngineer.postMessage", "window.EducationEngineerHost.emitEvent()"]
      },
      headerContract: [
        "x-host-user-id",
        "x-host-user-token",
        "x-host-locale",
        "x-host-device-type",
        "x-host-capabilities",
        "x-embed-mode"
      ],
      supportedEvents: [
        "module_ready",
        "lesson_started",
        "lesson_progress_changed",
        "lesson_completed",
        "feedback_submitted",
        "checkpoint_saved",
        "exception_raised"
      ],
      supportedInputs: [
        "hostUserToken",
        "hostUserId",
        "hostTheme",
        "hostLocale",
        "hostDeviceType",
        "hostCapabilities"
      ],
      eventEnvelope: {
        type: "education-engineer:event",
        eventType: "lesson_started",
        payload: {},
        issuedAt: "ISO-8601",
        userId: "host-user-id"
      }
    };
  }

  @Get("session")
  getHostSession(
    @Req() request: { hostAuth?: HostAuthSession },
    @Headers("x-host-user-id") hostUserId?: string,
    @Headers("x-host-user-token") hostUserToken?: string,
    @Headers("x-host-locale") hostLocale?: string,
    @Headers("x-host-capabilities") hostCapabilities?: string,
    @Headers("x-embed-mode") embedMode?: string
  ) {
    return (
      request.hostAuth ||
      this.hostAuthService.evaluateHeaders({
        hostUserId,
        hostUserToken,
        hostLocale,
        hostCapabilities,
        embedMode
      })
    );
  }
}
