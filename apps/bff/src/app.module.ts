import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AssessmentController } from "./assessment.controller.js";
import { ContentController } from "./content.controller.js";
import { HealthController } from "./health.controller.js";
import { HostAuthGuard } from "./host-auth.guard.js";
import { HostAuthService } from "./host-auth.service.js";
import { HostController } from "./host.controller.js";
import { UserController } from "./user.controller.js";

@Module({
  controllers: [HealthController, HostController, ContentController, AssessmentController, UserController],
  providers: [
    HostAuthService,
    {
      provide: APP_GUARD,
      useClass: HostAuthGuard
    }
  ]
})
export class AppModule {}
