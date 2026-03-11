import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AssessmentController } from "./assessment.controller.js";
import { CatalogController } from "./catalog.controller.js";
import { ContentController } from "./content.controller.js";
import { HealthController } from "./health.controller.js";
import { HostAuthGuard } from "./host-auth.guard.js";
import { HostAuthService } from "./host-auth.service.js";
import { HostController } from "./host.controller.js";
import { LearningController } from "./learning.controller.js";
import { OpsController } from "./ops.controller.js";
import { SearchController } from "./search.controller.js";
import { UserController } from "./user.controller.js";

@Module({
  controllers: [HealthController, HostController, CatalogController, ContentController, LearningController, SearchController, AssessmentController, OpsController, UserController],
  providers: [
    HostAuthService,
    {
      provide: APP_GUARD,
      useClass: HostAuthGuard
    }
  ]
})
export class AppModule {}
