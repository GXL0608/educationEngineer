import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { getNotes as getSystemNotes, getReviewQueue } from "./content-store.js";
import {
  createUserExamResult,
  createUserPracticeResult,
  createUserSearchHistory,
  createUserFeedback,
  createUserNote,
  getUserReport,
  listUserExamResults,
  listUserLearningEvents,
  listUserPracticeResults,
  getUserReviewProgress,
  listUserFeedback,
  listUserNotes,
  listUserSearchHistory,
  trackUserLearningEvent,
  updateUserReviewProgress
} from "./runtime-store.js";

type UserScoped = {
  userId?: string;
};

type CreateNoteBody = UserScoped & {
  title: string;
  summary: string;
  tag: string;
};

type CreateFeedbackBody = UserScoped & {
  category: string;
  message: string;
};

type SearchHistoryBody = UserScoped & {
  query: string;
  resultCount: number;
};

type PracticeResultBody = UserScoped & {
  practiceId: string;
  title: string;
  totalCount: number;
  correctCount: number;
  wrongCount: number;
  weakFocuses: string[];
  durationMinutes: number;
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

type ReviewActionBody = UserScoped & {
  nextReviewAt?: string;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIsoAfterDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

@Controller("user")
export class UserController {
  @Get("notes")
  getNotes(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return {
      userId: resolvedUserId,
      systemItems: getSystemNotes(),
      userItems: listUserNotes(resolvedUserId)
    };
  }

  @Post("notes")
  createNote(@Body() body: CreateNoteBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: createUserNote(resolvedUserId, {
        title: body.title,
        summary: body.summary,
        tag: body.tag
      })
    };
  }

  @Get("review-items")
  getReviewItems(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    const progress = getUserReviewProgress(resolvedUserId);
    const items = getReviewQueue().map((item) => {
      const id = `review-${slugify(item.title)}`;
      const persisted = progress[id];
      return {
        id,
        title: item.title,
        reason: item.reason,
        nextReviewAt: persisted?.nextReviewAt ?? item.nextReviewAt,
        status: persisted?.status ?? "pending",
        completedCount: persisted?.completedCount ?? 0,
        lastActionAt: persisted?.lastActionAt ?? null
      };
    });

    return { userId: resolvedUserId, items };
  }

  @Post("review-items/:reviewId/complete")
  completeReview(@Param("reviewId") reviewId: string, @Body() body: ReviewActionBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: updateUserReviewProgress(
        resolvedUserId,
        reviewId,
        "completed",
        body.nextReviewAt || toIsoAfterDays(2)
      )
    };
  }

  @Post("review-items/:reviewId/snooze")
  snoozeReview(@Param("reviewId") reviewId: string, @Body() body: ReviewActionBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: updateUserReviewProgress(
        resolvedUserId,
        reviewId,
        "snoozed",
        body.nextReviewAt || toIsoAfterDays(1)
      )
    };
  }

  @Get("feedback")
  getFeedback(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return { userId: resolvedUserId, items: listUserFeedback(resolvedUserId) };
  }

  @Post("feedback")
  createFeedback(@Body() body: CreateFeedbackBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: createUserFeedback(resolvedUserId, {
        category: body.category,
        message: body.message
      })
    };
  }

  @Get("search-history")
  getSearchHistory(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return { userId: resolvedUserId, items: listUserSearchHistory(resolvedUserId) };
  }

  @Post("search-history")
  createSearchHistory(@Body() body: SearchHistoryBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: createUserSearchHistory(resolvedUserId, {
        query: body.query,
        resultCount: body.resultCount
      })
    };
  }

  @Get("practice-results")
  getPracticeResults(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return { userId: resolvedUserId, items: listUserPracticeResults(resolvedUserId) };
  }

  @Post("practice-results")
  createPracticeResult(@Body() body: PracticeResultBody, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(body.userId, hostUserId);
    return {
      userId: resolvedUserId,
      item: createUserPracticeResult(resolvedUserId, {
        practiceId: body.practiceId,
        title: body.title,
        totalCount: body.totalCount,
        correctCount: body.correctCount,
        wrongCount: body.wrongCount,
        weakFocuses: body.weakFocuses,
        durationMinutes: body.durationMinutes
      })
    };
  }

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

  @Get("report")
  getReport(@Query("userId") userId?: string, @Headers("x-host-user-id") hostUserId?: string) {
    const resolvedUserId = resolveUserId(userId, hostUserId);
    return getUserReport(resolvedUserId);
  }
}
