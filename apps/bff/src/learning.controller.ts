import { Controller, Get } from "@nestjs/common";
import { getReportOverview, getReviewQueue } from "./content-store.js";

@Controller("learning")
export class LearningController {
  @Get("report-overview")
  getReportOverview() {
    return getReportOverview();
  }

  @Get("review-queue")
  getReviewQueue() {
    return { items: getReviewQueue() };
  }
}
