import { Controller, Get, Param, Query } from "@nestjs/common";
import { getPaper, getQuestion, listPapers, listQuestions } from "./content-store.js";

@Controller("assessment")
export class AssessmentController {
  @Get("questions")
  getQuestions(@Query("stage") stage?: string, @Query("courseId") courseId?: string) {
    return { items: listQuestions({ stage, courseId }) };
  }

  @Get("questions/:questionId")
  getQuestion(@Param("questionId") questionId: string) {
    return { item: getQuestion(questionId) };
  }

  @Get("papers")
  getPapers(@Query("stage") stage?: string, @Query("courseId") courseId?: string) {
    return { items: listPapers({ stage, courseId }) };
  }

  @Get("papers/:paperId")
  getPaper(@Param("paperId") paperId: string) {
    return { item: getPaper(paperId) };
  }
}
