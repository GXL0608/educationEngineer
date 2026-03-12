import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getExamContext, type LearningContext } from "./content-store.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNTIME_DIR = resolve(ROOT, "runtime");
const DEFAULT_USER_STATE_PATH = resolve(RUNTIME_DIR, "user-state.json");

type StoredLearningContext = {
  courseId?: string;
  courseTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  knowledgePoints?: string[];
};

type LearningEvent = {
  id: string;
  type: string;
  targetId: string;
  title: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

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
  learningEvents?: LearningEvent[];
  examResults?: ExamResult[];
  [key: string]: unknown;
};

type UserStateFile = {
  version: number;
  users: Record<string, UserBucket>;
};

function utcNow() {
  return new Date().toISOString();
}

function ensureDirectory(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function getUserStatePath() {
  const override = process.env.EDU_USER_STATE_PATH;
  if (!override) {
    return DEFAULT_USER_STATE_PATH;
  }
  return override.startsWith("/") ? override : resolve(process.cwd(), override);
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
      learningEvents: [],
      examResults: []
    };
  }
  const bucket = file.users[userId];
  bucket.learningEvents ||= [];
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

export function listUserLearningEvents(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).learningEvents || [];
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
    id: `event-${slugify(input.type)}-${(bucket.learningEvents || []).length + 1}`,
    type: input.type,
    targetId: input.targetId,
    title: input.title,
    createdAt: utcNow(),
    metadata: input.metadata
  };
  bucket.learningEvents!.unshift(event);
  writeUserState(file);
  return event;
}

export function listUserExamResults(userId: string) {
  const file = readUserState();
  return ensureUserBucket(file, userId).examResults || [];
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
    id: `exam-result-${slugify(input.examId)}-${(bucket.examResults || []).length + 1}`,
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

  bucket.examResults!.unshift(result);
  bucket.learningEvents!.unshift({
    id: `event-exam-result-${slugify(input.examId)}-${(bucket.learningEvents || []).length + 1}`,
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
