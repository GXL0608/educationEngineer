import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getExamContext, getPracticeContext, type LearningContext } from "./content-store.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNTIME_DIR = resolve(ROOT, "runtime");
const DEFAULT_USER_STATE_PATH = resolve(RUNTIME_DIR, "user-state.json");
const DEFAULT_IMPORT_PIPELINE_STATE_PATH = resolve(RUNTIME_DIR, "import-pipeline-state.json");

type StoredLearningContext = {
  courseId?: string;
  courseTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  knowledgePoints?: string[];
};

type UserNote = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewProgress = {
  status: "pending" | "completed" | "snoozed";
  nextReviewAt: string;
  completedCount: number;
  lastActionAt: string;
};

type FeedbackItem = {
  id: string;
  category: string;
  message: string;
  createdAt: string;
  status: "received";
};

type SearchHistoryItem = {
  id: string;
  query: string;
  resultCount: number;
  createdAt: string;
};

type LearningEvent = {
  id: string;
  type: string;
  targetId: string;
  title: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

type PracticeResult = {
  id: string;
  practiceId: string;
  title: string;
  totalCount: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  weakFocuses: string[];
  durationMinutes: number;
  completedAt: string;
} & StoredLearningContext;

type ExamResult = {
  id: string;
  examId: string;
  title: string;
  score: number;
  maxScore: number;
  accuracy: number;
  durationMinutes: number;
  sectionCount: number;
  weakSections: string[];
  completedAt: string;
} & StoredLearningContext;

type UserBucket = {
  notes: UserNote[];
  reviewProgress: Record<string, ReviewProgress>;
  feedback: FeedbackItem[];
  searchHistory: SearchHistoryItem[];
  learningEvents: LearningEvent[];
  practiceResults: PracticeResult[];
  examResults: ExamResult[];
};

type UserStateFile = {
  version: 1;
  users: Record<string, UserBucket>;
};

type ImportReviewTask = {
  id: string;
  importJobId: string;
  title: string;
  status: string;
  reviewer?: string | null;
  notes?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type ImportPipelineState = {
  jobCount: number;
  pendingReviewCount: number;
  approvedCount: number;
  changesRequestedCount: number;
  jobs: Array<Record<string, unknown>>;
  reviews: ImportReviewTask[];
};

function utcNow() {
  return new Date().toISOString();
}

function ensureDirectory(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function resolveRuntimePath(envName: "EDU_USER_STATE_PATH" | "EDU_IMPORT_PIPELINE_STATE_PATH", fallbackPath: string) {
  const override = process.env[envName];
  if (!override) {
    return fallbackPath;
  }
  return override.startsWith("/") ? override : resolve(process.cwd(), override);
}

function getUserStatePath() {
  return resolveRuntimePath("EDU_USER_STATE_PATH", DEFAULT_USER_STATE_PATH);
}

function getImportPipelineStatePath() {
  return resolveRuntimePath("EDU_IMPORT_PIPELINE_STATE_PATH", DEFAULT_IMPORT_PIPELINE_STATE_PATH);
}

function ensureUserStateFile() {
  const userStatePath = getUserStatePath();
  ensureDirectory(dirname(userStatePath));
  if (!existsSync(userStatePath)) {
    writeFileSync(userStatePath, JSON.stringify({ version: 1, users: {} }, null, 2) + "\n", "utf-8");
  }
}

function readJsonFile<T>(path: string, fallback: T): T {
  if (!existsSync(path)) {
    return fallback;
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJsonFile(path: string, payload: unknown) {
  ensureDirectory(dirname(path));
  writeFileSync(path, JSON.stringify(payload, null, 2) + "\n", "utf-8");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueValues(items: Array<string | undefined> = []) {
  return [...new Set(items.map((item) => item?.trim()).filter((item): item is string => Boolean(item)))];
}

function ensureUserBucket(file: UserStateFile, userId: string) {
  if (!file.users[userId]) {
    file.users[userId] = {
      notes: [],
      reviewProgress: {},
      feedback: [],
      searchHistory: [],
      learningEvents: [],
      practiceResults: [],
      examResults: []
    };
  }
  const bucket = file.users[userId];
  bucket.notes ||= [];
  bucket.reviewProgress ||= {};
  bucket.feedback ||= [];
  bucket.searchHistory ||= [];
  bucket.learningEvents ||= [];
  bucket.practiceResults ||= [];
  bucket.examResults ||= [];
  return bucket;
}

function readUserState() {
  ensureUserStateFile();
  return readJsonFile<UserStateFile>(getUserStatePath(), { version: 1, users: {} });
}

function writeUserState(file: UserStateFile) {
  writeJsonFile(getUserStatePath(), file);
}

function normalizeLearningContext(context: LearningContext, fallbackKnowledgePoints: string[] = []) {
  return {
    courseId: context.courseId,
    courseTitle: context.courseTitle,
    chapterId: context.chapterId,
    chapterTitle: context.chapterTitle,
    knowledgePoints: uniqueValues(context.knowledgePoints.length > 0 ? context.knowledgePoints : fallbackKnowledgePoints)
  };
}

function resolvePracticeResultContext(result: PracticeResult) {
  if (result.courseId && result.courseTitle && result.chapterId && result.chapterTitle) {
    return {
      courseId: result.courseId,
      courseTitle: result.courseTitle,
      chapterId: result.chapterId,
      chapterTitle: result.chapterTitle,
      knowledgePoints: uniqueValues(result.knowledgePoints || result.weakFocuses)
    };
  }
  return normalizeLearningContext(getPracticeContext(result.practiceId), result.weakFocuses);
}

function resolveExamResultContext(result: ExamResult) {
  if (result.courseId && result.courseTitle && result.chapterId && result.chapterTitle) {
    return {
      courseId: result.courseId,
      courseTitle: result.courseTitle,
      chapterId: result.chapterId,
      chapterTitle: result.chapterTitle,
      knowledgePoints: uniqueValues(result.knowledgePoints || result.weakSections)
    };
  }
  return normalizeLearningContext(getExamContext(result.examId), result.weakSections);
}

export function getImportPipelineState() {
  return readJsonFile<ImportPipelineState>(getImportPipelineStatePath(), {
    jobCount: 0,
    pendingReviewCount: 0,
    approvedCount: 0,
    changesRequestedCount: 0,
    jobs: [],
    reviews: []
  });
}

export function getImportReviewTask(taskId: string) {
  return getImportPipelineState().reviews.find((task) => task.id === taskId);
}

export function listUserNotes(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).notes;
}

export function createUserNote(userId: string, input: { title: string; summary: string; tag: string }) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const timestamp = utcNow();
  const note: UserNote = {
    id: `user-note-${slugify(input.title)}-${bucket.notes.length + 1}`,
    title: input.title,
    summary: input.summary,
    tag: input.tag,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  bucket.notes.unshift(note);
  bucket.learningEvents.unshift({
    id: `event-note-${slugify(input.title)}-${bucket.learningEvents.length + 1}`,
    type: "note_created",
    targetId: note.id,
    title: input.title,
    createdAt: timestamp,
    metadata: { tag: input.tag }
  });
  writeUserState(file);
  return note;
}

export function listUserFeedback(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).feedback;
}

export function createUserFeedback(userId: string, input: { category: string; message: string }) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const createdAt = utcNow();
  const feedback: FeedbackItem = {
    id: `feedback-${slugify(input.category)}-${bucket.feedback.length + 1}`,
    category: input.category,
    message: input.message,
    createdAt,
    status: "received"
  };
  bucket.feedback.unshift(feedback);
  bucket.learningEvents.unshift({
    id: `event-feedback-${slugify(input.category)}-${bucket.learningEvents.length + 1}`,
    type: "feedback_created",
    targetId: feedback.id,
    title: input.category,
    createdAt,
    metadata: { status: feedback.status }
  });
  writeUserState(file);
  return feedback;
}

export function getUserReviewProgress(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).reviewProgress;
}

export function updateUserReviewProgress(
  userId: string,
  reviewId: string,
  action: "completed" | "snoozed",
  nextReviewAt: string
) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const previous = bucket.reviewProgress[reviewId];
  const progress: ReviewProgress = {
    status: action,
    nextReviewAt,
    completedCount: action === "completed" ? (previous?.completedCount ?? 0) + 1 : previous?.completedCount ?? 0,
    lastActionAt: utcNow()
  };
  bucket.reviewProgress[reviewId] = progress;
  bucket.learningEvents.unshift({
    id: `event-review-${slugify(reviewId)}-${bucket.learningEvents.length + 1}`,
    type: action === "completed" ? "review_completed" : "review_snoozed",
    targetId: reviewId,
    title: reviewId,
    createdAt: progress.lastActionAt,
    metadata: { completedCount: progress.completedCount }
  });
  writeUserState(file);
  return progress;
}

export function listUserSearchHistory(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).searchHistory;
}

export function createUserSearchHistory(userId: string, input: { query: string; resultCount: number }) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const createdAt = utcNow();
  const entry: SearchHistoryItem = {
    id: `search-${slugify(input.query)}-${bucket.searchHistory.length + 1}`,
    query: input.query,
    resultCount: input.resultCount,
    createdAt
  };
  bucket.searchHistory.unshift(entry);
  bucket.learningEvents.unshift({
    id: `event-search-${slugify(input.query)}-${bucket.learningEvents.length + 1}`,
    type: "search_executed",
    targetId: entry.id,
    title: input.query,
    createdAt,
    metadata: { resultCount: input.resultCount }
  });
  writeUserState(file);
  return entry;
}

export function listUserLearningEvents(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).learningEvents;
}

export function trackUserLearningEvent(
  userId: string,
  input: {
    type: string;
    targetId: string;
    title: string;
    metadata?: Record<string, string | number | boolean>;
  }
) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const event: LearningEvent = {
    id: `event-${slugify(input.type)}-${bucket.learningEvents.length + 1}`,
    type: input.type,
    targetId: input.targetId,
    title: input.title,
    createdAt: utcNow(),
    metadata: input.metadata
  };
  bucket.learningEvents.unshift(event);
  writeUserState(file);
  return event;
}

export function listUserPracticeResults(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).practiceResults;
}

export function createUserPracticeResult(
  userId: string,
  input: {
    practiceId: string;
    title: string;
    totalCount: number;
    correctCount: number;
    wrongCount: number;
    weakFocuses: string[];
    durationMinutes: number;
  }
) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const completedAt = utcNow();
  const accuracy = input.totalCount === 0 ? 0 : Math.round((input.correctCount / input.totalCount) * 100);
  const context = normalizeLearningContext(getPracticeContext(input.practiceId), input.weakFocuses);
  const result: PracticeResult = {
    id: `practice-result-${slugify(input.practiceId)}-${bucket.practiceResults.length + 1}`,
    practiceId: input.practiceId,
    title: input.title,
    totalCount: input.totalCount,
    correctCount: input.correctCount,
    wrongCount: input.wrongCount,
    accuracy,
    weakFocuses: input.weakFocuses,
    durationMinutes: input.durationMinutes,
    completedAt,
    ...context
  };

  bucket.practiceResults.unshift(result);
  bucket.learningEvents.unshift({
    id: `event-practice-result-${slugify(input.practiceId)}-${bucket.learningEvents.length + 1}`,
    type: "practice_completed",
    targetId: result.id,
    title: input.title,
    createdAt: completedAt,
    metadata: {
      accuracy,
      wrongCount: input.wrongCount,
      durationMinutes: input.durationMinutes,
      primaryWeakFocus: input.weakFocuses[0] || "none",
      courseId: context.courseId,
      chapterId: context.chapterId
    }
  });
  writeUserState(file);
  return result;
}

export function listUserExamResults(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).examResults;
}

export function createUserExamResult(
  userId: string,
  input: {
    examId: string;
    title: string;
    score: number;
    maxScore: number;
    durationMinutes: number;
    sectionCount: number;
    weakSections: string[];
  }
) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const completedAt = utcNow();
  const normalizedMaxScore = input.maxScore <= 0 ? 100 : input.maxScore;
  const accuracy = Math.round((input.score / normalizedMaxScore) * 100);
  const context = normalizeLearningContext(getExamContext(input.examId), input.weakSections);
  const result: ExamResult = {
    id: `exam-result-${slugify(input.examId)}-${bucket.examResults.length + 1}`,
    examId: input.examId,
    title: input.title,
    score: input.score,
    maxScore: normalizedMaxScore,
    accuracy,
    durationMinutes: input.durationMinutes,
    sectionCount: input.sectionCount,
    weakSections: input.weakSections,
    completedAt,
    ...context
  };

  bucket.examResults.unshift(result);
  bucket.learningEvents.unshift({
    id: `event-exam-result-${slugify(input.examId)}-${bucket.learningEvents.length + 1}`,
    type: "exam_submitted",
    targetId: result.id,
    title: input.title,
    createdAt: completedAt,
    metadata: {
      score: result.score,
      maxScore: result.maxScore,
      accuracy,
      durationMinutes: result.durationMinutes,
      weakSectionCount: result.weakSections.length,
      courseId: context.courseId,
      chapterId: context.chapterId
    }
  });
  writeUserState(file);
  return result;
}

export function getUserReport(userId: string) {
  const file = readUserState();
  const bucket = ensureUserBucket(file, userId);
  const completedReviews = Object.values(bucket.reviewProgress).reduce((sum, item) => sum + item.completedCount, 0);
  const practiceAttempts = bucket.practiceResults.length;
  const examAttempts = bucket.examResults.length;
  const averagePracticeAccuracy =
    practiceAttempts === 0
      ? 0
      : Math.round(bucket.practiceResults.reduce((sum, item) => sum + item.accuracy, 0) / practiceAttempts);
  const averageExamAccuracy =
    examAttempts === 0
      ? 0
      : Math.round(bucket.examResults.reduce((sum, item) => sum + item.accuracy, 0) / examAttempts);
  const latestExam = bucket.examResults[0];
  const weaknessCounter = new Map<string, number>();
  const courseMasteryMap = new Map<
    string,
    {
      id: string;
      title: string;
      subtitle: string;
      weightedScore: number;
      weight: number;
      evidenceCount: number;
      history: Array<{ completedAt: string; score: number }>;
    }
  >();
  const chapterMasteryMap = new Map<
    string,
    {
      id: string;
      title: string;
      subtitle: string;
      weightedScore: number;
      weight: number;
      evidenceCount: number;
      history: Array<{ completedAt: string; score: number }>;
    }
  >();
  const knowledgeMasteryMap = new Map<
    string,
    {
      id: string;
      title: string;
      subtitle: string;
      weightedScore: number;
      weight: number;
      evidenceCount: number;
      history: Array<{ completedAt: string; score: number }>;
    }
  >();

  function clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function recordMastery(
    collection: Map<
      string,
      {
        id: string;
        title: string;
        subtitle: string;
        weightedScore: number;
        weight: number;
        evidenceCount: number;
        history: Array<{ completedAt: string; score: number }>;
      }
    >,
    payload: { id: string; title: string; subtitle?: string; score: number; weight: number; completedAt: string }
  ) {
    const current =
      collection.get(payload.id) || {
        id: payload.id,
        title: payload.title,
        subtitle: payload.subtitle || "",
        weightedScore: 0,
        weight: 0,
        evidenceCount: 0,
        history: []
      };
    current.weightedScore += payload.score * payload.weight;
    current.weight += payload.weight;
    current.evidenceCount += 1;
    current.history.push({ completedAt: payload.completedAt, score: payload.score });
    collection.set(payload.id, current);
  }

  for (const item of bucket.practiceResults) {
    const context = resolvePracticeResultContext(item);
    const courseScore = clampScore(item.accuracy - item.wrongCount * 4);
    const chapterScore = clampScore(item.accuracy - item.weakFocuses.length * 8);
    const knowledgePoints = uniqueValues(context.knowledgePoints.length > 0 ? context.knowledgePoints : item.weakFocuses);

    recordMastery(courseMasteryMap, {
      id: context.courseId,
      title: context.courseTitle,
      score: courseScore,
      weight: 1.1,
      completedAt: item.completedAt
    });
    recordMastery(chapterMasteryMap, {
      id: context.chapterId,
      title: context.chapterTitle,
      subtitle: context.courseTitle,
      score: chapterScore,
      weight: 1.2,
      completedAt: item.completedAt
    });

    for (const knowledgePoint of knowledgePoints) {
      recordMastery(knowledgeMasteryMap, {
        id: `${context.chapterId}:${knowledgePoint}`,
        title: knowledgePoint,
        subtitle: `${context.courseTitle} / ${context.chapterTitle}`,
        score: clampScore(item.accuracy - (item.weakFocuses.includes(knowledgePoint) ? 16 : 4)),
        weight: 1,
        completedAt: item.completedAt
      });
    }

    for (const focus of item.weakFocuses) {
      weaknessCounter.set(focus, (weaknessCounter.get(focus) || 0) + 1);
    }
  }

  for (const item of bucket.examResults) {
    const context = resolveExamResultContext(item);
    const courseScore = clampScore(item.accuracy - item.weakSections.length * 5);
    const chapterScore = clampScore(item.accuracy - item.weakSections.length * 9);
    const knowledgePoints = uniqueValues(context.knowledgePoints.length > 0 ? context.knowledgePoints : item.weakSections);

    recordMastery(courseMasteryMap, {
      id: context.courseId,
      title: context.courseTitle,
      score: courseScore,
      weight: 1.4,
      completedAt: item.completedAt
    });
    recordMastery(chapterMasteryMap, {
      id: context.chapterId,
      title: context.chapterTitle,
      subtitle: context.courseTitle,
      score: chapterScore,
      weight: 1.5,
      completedAt: item.completedAt
    });

    for (const knowledgePoint of knowledgePoints) {
      recordMastery(knowledgeMasteryMap, {
        id: `${context.chapterId}:${knowledgePoint}`,
        title: knowledgePoint,
        subtitle: `${context.courseTitle} / ${context.chapterTitle}`,
        score: clampScore(item.accuracy - Math.max(6, item.weakSections.length * 4)),
        weight: 1.25,
        completedAt: item.completedAt
      });
    }

    for (const section of item.weakSections) {
      weaknessCounter.set(section, (weaknessCounter.get(section) || 0) + 1);
    }
  }

  function classifyStatus(score: number) {
    if (score >= 85) {
      return "strong";
    }
    if (score >= 65) {
      return "steady";
    }
    return "risk";
  }

  function classifyTrend(history: Array<{ completedAt: string; score: number }>) {
    const sorted = [...history].sort((left, right) => left.completedAt.localeCompare(right.completedAt));
    const latest = sorted.at(-1);
    const previous = sorted.at(-2);
    if (!latest || !previous) {
      return "steady";
    }
    const delta = latest.score - previous.score;
    if (delta >= 5) {
      return "rising";
    }
    if (delta <= -5) {
      return "falling";
    }
    return "steady";
  }

  function buildNextAction(score: number, title: string) {
    if (score < 65) {
      return `先回到 ${title} 的精读与针对练习，再进入下一轮复习。`;
    }
    if (score < 85) {
      return `继续做一次迁移题和一次错题复盘，稳定 ${title}。`;
    }
    return `可以把 ${title} 作为已掌握内容，进入更高阶任务。`;
  }

  function finalizeMastery(
    collection: Map<
      string,
      {
        id: string;
        title: string;
        subtitle: string;
        weightedScore: number;
        weight: number;
        evidenceCount: number;
        history: Array<{ completedAt: string; score: number }>;
      }
    >,
    limit: number
  ) {
    return [...collection.values()]
      .map((item) => {
        const score = item.weight === 0 ? 0 : Math.round(item.weightedScore / item.weight);
        return {
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          score,
          status: classifyStatus(score),
          trend: classifyTrend(item.history),
          evidenceCount: item.evidenceCount,
          nextAction: buildNextAction(score, item.title)
        };
      })
      .sort((left, right) => left.score - right.score || right.evidenceCount - left.evidenceCount)
      .slice(0, limit);
  }

  const outcomeWeaknesses = [...weaknessCounter.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, value: `${count} 次失分 / 需巩固` }));
  const courseMastery = finalizeMastery(courseMasteryMap, 4);
  const chapterMastery = finalizeMastery(chapterMasteryMap, 6);
  const knowledgeMastery = finalizeMastery(knowledgeMasteryMap, 8);
  const recommendedNextSteps = [...knowledgeMastery.slice(0, 2), ...chapterMastery.slice(0, 2)]
    .slice(0, 4)
    .map((item, index) => ({
      id: `next-step-${index + 1}-${slugify(item.id)}`,
      targetId: item.id,
      targetType: item.id.includes(":")
        ? ("knowledge" as const)
        : chapterMastery.some((entry) => entry.id === item.id)
          ? ("chapter" as const)
          : ("course" as const),
      title: item.title,
      reason: `${item.score}% 掌握度，趋势 ${item.trend}，证据 ${item.evidenceCount} 次。`,
      action: item.nextAction
    }));

  const recentResults = [
    ...bucket.practiceResults.map((item) => ({
      id: item.id,
      kind: "practice" as const,
      title: item.title,
      summary: `${item.correctCount}/${item.totalCount} 正确 · ${item.accuracy}% · ${item.durationMinutes} 分钟`,
      completedAt: item.completedAt
    })),
    ...bucket.examResults.map((item) => ({
      id: item.id,
      kind: "exam" as const,
      title: item.title,
      summary: `${item.score}/${item.maxScore} · ${item.accuracy}% · ${item.durationMinutes} 分钟`,
      completedAt: item.completedAt
    }))
  ]
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
    .slice(0, 6);

  const recentActivity = [...bucket.learningEvents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return {
    userId,
    stats: [
      { label: "个人笔记", value: String(bucket.notes.length) },
      { label: "搜索记录", value: String(bucket.searchHistory.length) },
      { label: "复习完成", value: String(completedReviews) },
      { label: "学习事件", value: String(bucket.learningEvents.length) }
    ],
    resultStats: [
      { label: "练习提交", value: `${practiceAttempts} 次` },
      { label: "平均正确率", value: `${averagePracticeAccuracy}%` },
      { label: "考试提交", value: `${examAttempts} 次` },
      { label: "最近考试得分", value: latestExam ? `${latestExam.score}/${latestExam.maxScore}` : "暂无" },
      { label: "平均考试得分率", value: `${averageExamAccuracy}%` }
    ],
    masteryStats: [
      {
        label: "课程掌握均值",
        value: `${courseMastery.length === 0 ? 0 : Math.round(courseMastery.reduce((sum, item) => sum + item.score, 0) / courseMastery.length)}%`
      },
      { label: "章节风险点", value: `${chapterMastery.filter((item) => item.status === "risk").length} 个` },
      { label: "知识点覆盖", value: `${knowledgeMasteryMap.size} 个` },
      { label: "推荐动作", value: `${recommendedNextSteps.length} 条` }
    ],
    courseMastery,
    chapterMastery,
    knowledgeMastery,
    recommendedNextSteps,
    outcomeWeaknesses,
    recentResults,
    recentSearches: bucket.searchHistory.slice(0, 6),
    recentActivity
  };
}
