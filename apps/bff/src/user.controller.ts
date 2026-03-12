import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { createUserExamResult, listUserExamResults, listUserLearningEvents, trackUserLearningEvent } from "./runtime-store.js";

type UserScoped = {
  userId?: string;
};

type ExamResultBody = UserScoped & {
  examId: string;
  title: string;
  score: number;
  maxScore: number;
  durationMinutes: number;
  sectionCount: number;
  weakSections: string[];
};

type LearningEventBody = UserScoped & {
  type: string;
  targetId: string;
  title: string;
  metadata?: Record<string, string | number | boolean>;
};

function resolveUserId(value?: string, hostUserId?: string) {
  return hostUserId?.trim() || value || "demo-user";
}

@Controller("user")
export class UserController {
  @Get("exam-results")
  getExamResults(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return { userId: resolvedUserId, items: listUserExamResults(resolvedUserId) };
  }

  @Post("exam-results")
  createExamResult(@Body() body: ExamResultBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: createUserExamResult(resolvedUserId, {
        examId: body.examId,
        title: body.title,
        score: body.score,
        maxScore: body.maxScore,
        durationMinutes: body.durationMinutes,
        sectionCount: body.sectionCount,
        weakSections: body.weakSections
      })
    };
  }

  @Get("events")
  getLearningEvents(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return { userId: resolvedUserId, items: listUserLearningEvents(resolvedUserId) };
  }

  @Post("events")
  createLearningEvent(@Body() body: LearningEventBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: trackUserLearningEvent(resolvedUserId, {
        type: body.type,
        targetId: body.targetId,
        title: body.title,
        metadata: body.metadata
      })
    };
  }
}
