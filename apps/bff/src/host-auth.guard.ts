import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { HostAuthService } from "./host-auth.service.js";

@Injectable()
export class HostAuthGuard implements CanActivate {
  constructor(private readonly hostAuthService: HostAuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();

    const headers = request.headers || {};
    const readHeader = (name: string) => {
      const value = headers[name];
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    };

    const session = this.hostAuthService.evaluateHeaders({
      hostUserId: readHeader("x-host-user-id"),
      hostUserToken: readHeader("x-host-user-token"),
      hostLocale: readHeader("x-host-locale"),
      hostCapabilities: readHeader("x-host-capabilities"),
      embedMode: readHeader("x-embed-mode")
    });

    if (context.getClass().name === "HostController" && context.getHandler().name === "getHostSession") {
      return true;
    }

    if (session.mode === "host" && !session.authenticated) {
      throw new UnauthorizedException(`host_auth_failed:${session.reason}`);
    }

    return true;
  }
}
