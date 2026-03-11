import { Controller, Get, Param } from "@nestjs/common";
import { getChapter, getCourse, listCourses, listStages } from "./content-store.js";

@Controller("catalog")
export class CatalogController {
  @Get("stages")
  getStages() {
    return { items: listStages() };
  }

  @Get("courses")
  getCourses() {
    return { items: listCourses() };
  }

  @Get("courses/:courseId")
  getCourse(@Param("courseId") courseId: string) {
    return { item: getCourse(courseId) };
  }

  @Get("chapters/:chapterId")
  getChapter(@Param("chapterId") chapterId: string) {
    return { item: getChapter(chapterId) };
  }
}
