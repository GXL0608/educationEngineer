import { Controller, Get, Param } from "@nestjs/common";
import { getExam } from "./content-store.js";

@Controller("content")
export class ContentController {
  @Get("exams/:examId")
  getExam(@Param("examId") examId: string) {
    return { item: getExam(examId) };
  }
}
