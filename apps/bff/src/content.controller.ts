import { Controller, Get, Param } from "@nestjs/common";
import { getConcept, getExam, getLesson, getNotes, getPractice, getResearchPaper } from "./content-store.js";

@Controller("content")
export class ContentController {
  @Get("lessons/:lessonId")
  getLesson(@Param("lessonId") lessonId: string) {
    return { item: getLesson(lessonId) };
  }

  @Get("concepts/:conceptId")
  getConcept(@Param("conceptId") conceptId: string) {
    return { item: getConcept(conceptId) };
  }

  @Get("practices/:practiceId")
  getPractice(@Param("practiceId") practiceId: string) {
    return { item: getPractice(practiceId) };
  }

  @Get("exams/:examId")
  getExam(@Param("examId") examId: string) {
    return { item: getExam(examId) };
  }

  @Get("research/:paperId")
  getResearch(@Param("paperId") paperId: string) {
    return { item: getResearchPaper(paperId) };
  }

  @Get("notes")
  getNotes() {
    return { items: getNotes() };
  }
}
