import { emitHostEvent } from "./host-bridge";
import { getHostContextSnapshot, resolveActiveUserId } from "../store/host-store";

export type StageSummary = {
  id: "K12" | "undergraduate" | "master" | "doctor";
  title: string;
  subtitle: string;
  subjects: number;
};

export type ChapterSummary = {
  id: string;
  title: string;
  summary: string;
  lessonId: string;
  conceptId: string;
  practiceId: string;
  examId: string;
  paperId?: string;
};

export type CourseDetail = {
  id: string;
  stage: StageSummary["id"];
  subject: string;
  title: string;
  audience: string;
  description: string;
  chapters: ChapterSummary[];
  metrics: {
    lessons: number;
    practices: number;
    reports: string;
  };
};

export type LessonContent = {
  id: string;
  title: string;
  paragraphs: string[];
  timeline: Array<{ label: string; time: string }>;
};

export type ConceptContent = {
  id: string;
  title: string;
  nodes: string[];
  chain: string[];
};

export type PracticeContent = {
  id: string;
  title: string;
  items: Array<{
    prompt: string;
    answer: string;
    focus: string;
  }>;
};

export type ExamContent = {
  id: string;
  title: string;
  durationMinutes: number;
  sections: string[];
};

export type ResearchContent = {
  id: string;
  title: string;
  paragraphs: string[];
  nodes: string[];
  chain: string[];
};

export type NoteCard = {
  id: string;
  title: string;
  tag: string;
  summary: string;
};

export type ReportOverview = {
  weeklyFocus: string;
  progress: Array<{ label: string; value: string }>;
  weakness: string[];
};

export type ReviewItem = {
  id?: string;
  title: string;
  reason: string;
  nextReviewAt: string;
  status?: string;
  completedCount?: number;
  lastActionAt?: string | null;
};

export type SearchItem = {
  id: string;
  type: string;
  title: string;
  summary: string;
};

export type QuestionBankItem = {
  id: string;
  stage: StageSummary["id"];
  subject: string;
  courseId: string;
  chapterId: string;
  type: string;
  difficulty: string;
  knowledgePoints: string[];
  stem: string;
};

export type QuestionAsset = {
  id: string;
  stage: StageSummary["id"];
  subject: string;
  course: {
    id: string;
    title: string;
  };
  chapter: {
    id: string;
    title: string;
  };
  knowledgePoints: string[];
  type: string;
  stem: string;
  choices: string[];
  answer: string;
  analysis: string;
  difficulty: string;
  source: {
    kind: string;
    practiceId: string;
  };
};

export type PaperBankItem = {
  id: string;
  stage: StageSummary["id"];
  subject: string;
  courseId: string;
  chapterId: string;
  title: string;
  paperType: string;
  durationMinutes: number;
  questionCount: number;
};

export type PaperAsset = {
  id: string;
  title: string;
  stage: StageSummary["id"];
  subject: string;
  course: {
    id: string;
    title: string;
  };
  chapter: {
    id: string;
    title: string;
  };
  paperType: string;
  durationMinutes: number;
  questionIds: string[];
  sections: Array<{
    id: string;
    title: string;
    targetCount: number;
    questionIds: string[];
  }>;
};

export type ReleaseManifest = {
  builtAt: string;
  catalogPath: string;
  manifestPath: string;
  courseCount: number;
  questionCount: number;
  paperCount: number;
  approvedImportCount: number;
  approvedImports: Array<{
    courseId: string;
    title: string;
    stage: StageSummary["id"];
    subject: string;
    sourceName: string;
    artifactPath: string;
  }>;
};

export type HostSession = {
  mode: "standalone" | "host";
  authenticated: boolean;
  strict: boolean;
  reason: string;
  userId: string | null;
  provider: string | null;
  scopes: string[];
  expiresAt: string | null;
  locale: string | null;
  capabilities: string[];
  embedMode: string | null;
  tokenPresent: boolean;
  registryPath: string;
  registryVersion: number | null;
  verifiedAt: string | null;
};

export type UserNote = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackItem = {
  id: string;
  category: string;
  message: string;
  createdAt: string;
  status: "received";
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  resultCount: number;
  createdAt: string;
};

export type LearningEvent = {
  id: string;
  type: string;
  targetId: string;
  title: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
};

export type PracticeResult = {
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
};

export type ExamResult = {
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
};

export type ImportReviewTask = {
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

export type ImportReviewState = {
  jobCount: number;
  pendingReviewCount: number;
  approvedCount: number;
  changesRequestedCount: number;
  jobs: Array<Record<string, unknown>>;
  reviews: ImportReviewTask[];
};

export type ReviewDecisionResponse = {
  review?: Record<string, unknown>;
  releaseTriggered: boolean;
  releaseSucceeded: boolean;
  releaseManifest?: ReleaseManifest;
  releaseError?: string;
};

export type MasteryEntry = {
  id: string;
  title: string;
  subtitle: string;
  score: number;
  status: "strong" | "steady" | "risk";
  trend: "rising" | "steady" | "falling";
  evidenceCount: number;
  nextAction: string;
};

export type RecommendationEntry = {
  id: string;
  targetId: string;
  targetType: "course" | "chapter" | "knowledge";
  title: string;
  reason: string;
  action: string;
};

export type UserReport = {
  userId: string;
  stats: Array<{ label: string; value: string }>;
  resultStats: Array<{ label: string; value: string }>;
  masteryStats: Array<{ label: string; value: string }>;
  courseMastery: MasteryEntry[];
  chapterMastery: MasteryEntry[];
  knowledgeMastery: MasteryEntry[];
  recommendedNextSteps: RecommendationEntry[];
  outcomeWeaknesses: Array<{ label: string; value: string }>;
  recentResults: Array<{
    id: string;
    kind: "practice" | "exam";
    title: string;
    summary: string;
    completedAt: string;
  }>;
  recentSearches: SearchHistoryItem[];
  recentActivity: LearningEvent[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_USER_ID = "demo-user";

function resolveUserId(value?: string) {
  return value || resolveActiveUserId() || DEFAULT_USER_ID;
}

function buildHostHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);
  const snapshot = getHostContextSnapshot();

  if (snapshot.hostUserId) {
    headers.set("X-Host-User-Id", snapshot.hostUserId);
  }
  if (snapshot.hostUserToken) {
    headers.set("X-Host-User-Token", snapshot.hostUserToken);
  }
  if (snapshot.hostLocale) {
    headers.set("X-Host-Locale", snapshot.hostLocale);
  }
  headers.set("X-Host-Device-Type", snapshot.deviceType);
  headers.set("X-Embed-Mode", snapshot.embedMode);
  if (snapshot.hostCapabilities.length > 0) {
    headers.set("X-Host-Capabilities", snapshot.hostCapabilities.join(","));
  }
  return headers;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: buildHostHeaders(init?.headers)
  });

  if (!response.ok) {
    emitHostEvent("exception_raised", {
      kind: "api_request_failed",
      path,
      status: response.status
    });
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getStages: () => fetchJson<{ items: StageSummary[] }>("/catalog/stages"),
  getCourses: () => fetchJson<{ items: CourseDetail[] }>("/catalog/courses"),
  getCourse: (courseId: string) => fetchJson<{ item: CourseDetail }>(`/catalog/courses/${courseId}`),
  getChapter: (chapterId: string) =>
    fetchJson<{ item: { course: { id: string; title: string; subject: string }; chapter: ChapterSummary } }>(
      `/catalog/chapters/${chapterId}`
    ),
  getLesson: (lessonId: string) => fetchJson<{ item: LessonContent }>(`/content/lessons/${lessonId}`),
  getConcept: (conceptId: string) => fetchJson<{ item: ConceptContent }>(`/content/concepts/${conceptId}`),
  getPractice: (practiceId: string) => fetchJson<{ item: PracticeContent }>(`/content/practices/${practiceId}`),
  getExam: (examId: string) => fetchJson<{ item: ExamContent }>(`/content/exams/${examId}`),
  getResearch: (paperId: string) => fetchJson<{ item: ResearchContent }>(`/content/research/${paperId}`),
  getNotes: () => fetchJson<{ items: NoteCard[] }>("/content/notes"),
  getUserNotes: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; systemItems: NoteCard[]; userItems: UserNote[] }>(`/user/notes?userId=${encodeURIComponent(userId)}`),
  createUserNote: (
    payload: {
      title: string;
      summary: string;
      tag: string;
      userId?: string;
    } = { title: "", summary: "", tag: "" }
  ) =>
    fetchJson<{ userId: string; item: UserNote }>("/user/notes", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("checkpoint_saved", {
        kind: "note_created",
        noteId: response.item.id
      });
      return response;
    }),
  getReportOverview: () => fetchJson<ReportOverview>("/learning/report-overview"),
  getReviewQueue: () => fetchJson<{ items: ReviewItem[] }>("/learning/review-queue"),
  getUserReviewItems: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; items: ReviewItem[] }>(`/user/review-items?userId=${encodeURIComponent(userId)}`),
  completeReviewItem: (reviewId: string, userId = resolveUserId()) =>
    fetchJson<{ userId: string; item: ReviewItem }>(`/user/review-items/${reviewId}/complete`, {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("checkpoint_saved", {
        kind: "review_completed",
        reviewId
      });
      return response;
    }),
  snoozeReviewItem: (reviewId: string, userId = resolveUserId()) =>
    fetchJson<{ userId: string; item: ReviewItem }>(`/user/review-items/${reviewId}/snooze`, {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("checkpoint_saved", {
        kind: "review_snoozed",
        reviewId
      });
      return response;
    }),
  search: (query: string) => fetchJson<{ query: string; items: SearchItem[] }>(`/search?q=${encodeURIComponent(query)}`),
  getQuestions: (params: { stage?: string; courseId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.stage) {
      searchParams.set("stage", params.stage);
    }
    if (params.courseId) {
      searchParams.set("courseId", params.courseId);
    }
    const suffix = searchParams.toString();
    return fetchJson<{ items: QuestionBankItem[] }>(`/assessment/questions${suffix ? `?${suffix}` : ""}`);
  },
  getQuestion: (questionId: string) => fetchJson<{ item: QuestionAsset }>(`/assessment/questions/${questionId}`),
  getPapers: (params: { stage?: string; courseId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.stage) {
      searchParams.set("stage", params.stage);
    }
    if (params.courseId) {
      searchParams.set("courseId", params.courseId);
    }
    const suffix = searchParams.toString();
    return fetchJson<{ items: PaperBankItem[] }>(`/assessment/papers${suffix ? `?${suffix}` : ""}`);
  },
  getPaper: (paperId: string) => fetchJson<{ item: PaperAsset }>(`/assessment/papers/${paperId}`),
  getHostSession: () => fetchJson<HostSession>("/host/session"),
  getReleaseManifest: () => fetchJson<ReleaseManifest>("/ops/release-manifest"),
  getImportReviewState: () => fetchJson<ImportReviewState>("/ops/import-reviews"),
  triggerReleaseBuild: () =>
    fetchJson<ReviewDecisionResponse>("/ops/release-build", {
      method: "POST"
    } as RequestInit),
  approveImportReview: (taskId: string, payload: { reviewer: string; notes: string; triggerRelease?: boolean }) =>
    fetchJson<ReviewDecisionResponse>(`/ops/import-reviews/${taskId}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    } as RequestInit),
  rejectImportReview: (taskId: string, payload: { reviewer: string; notes: string }) =>
    fetchJson<Record<string, unknown>>(`/ops/import-reviews/${taskId}/reject`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    } as RequestInit),
  getFeedback: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; items: FeedbackItem[] }>(`/user/feedback?userId=${encodeURIComponent(userId)}`),
  createFeedback: (payload: { category: string; message: string; userId?: string }) =>
    fetchJson<{ userId: string; item: FeedbackItem }>("/user/feedback", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("feedback_submitted", {
        category: response.item.category,
        feedbackId: response.item.id
      });
      return response;
    }),
  getSearchHistory: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; items: SearchHistoryItem[] }>(
      `/user/search-history?userId=${encodeURIComponent(userId)}`
    ),
  createSearchHistory: (payload: { query: string; resultCount: number; userId?: string }) =>
    fetchJson<{ userId: string; item: SearchHistoryItem }>("/user/search-history", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit),
  getPracticeResults: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; items: PracticeResult[] }>(`/user/practice-results?userId=${encodeURIComponent(userId)}`),
  createPracticeResult: (payload: {
    practiceId: string;
    title: string;
    totalCount: number;
    correctCount: number;
    wrongCount: number;
    weakFocuses: string[];
    durationMinutes: number;
    userId?: string;
  }) =>
    fetchJson<{ userId: string; item: PracticeResult }>("/user/practice-results", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("checkpoint_saved", {
        kind: "practice_result",
        practiceId: response.item.practiceId,
        accuracy: response.item.accuracy
      });
      return response;
    }),
  getExamResults: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; items: ExamResult[] }>(`/user/exam-results?userId=${encodeURIComponent(userId)}`),
  createExamResult: (payload: {
    examId: string;
    title: string;
    score: number;
    maxScore: number;
    durationMinutes: number;
    sectionCount: number;
    weakSections: string[];
    userId?: string;
  }) =>
    fetchJson<{ userId: string; item: ExamResult }>("/user/exam-results", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("checkpoint_saved", {
        kind: "exam_result",
        examId: response.item.examId,
        score: response.item.score
      });
      return response;
    }),
  getUserEvents: (userId = resolveUserId()) =>
    fetchJson<{ userId: string; items: LearningEvent[] }>(`/user/events?userId=${encodeURIComponent(userId)}`),
  trackLearningEvent: (payload: {
    type: string;
    targetId: string;
    title: string;
    metadata?: Record<string, string | number | boolean>;
    userId?: string;
  }) =>
    fetchJson<{ userId: string; item: LearningEvent }>("/user/events", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      const eventMap: Record<string, string> = {
        lesson_viewed: "lesson_started",
        practice_completed: "lesson_progress_changed",
        exam_submitted: "checkpoint_saved"
      };
      const hostEventType = eventMap[payload.type];
      if (hostEventType) {
        emitHostEvent(hostEventType, {
          eventId: response.item.id,
          targetId: payload.targetId,
          title: payload.title,
          metadata: payload.metadata || {}
        });
      }
      return response;
    }),
  getUserReport: (userId = resolveUserId()) =>
    fetchJson<UserReport>(`/user/report?userId=${encodeURIComponent(userId)}`)
};
