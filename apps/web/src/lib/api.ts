import { getHostContextSnapshot, resolveActiveUserId } from "../store/host-store";
import { emitHostEvent } from "./host-bridge";

export type ExamContent = {
  id: string;
  title: string;
  durationMinutes: number;
  sections: string[];
  instructions?: string[];
  fullScore?: number;
  header?: {
    schoolYear?: string;
    grade?: string;
    subjectLabel?: string;
    examType?: string;
    volume?: string;
  };
  answerSheetRules?: string[];
};

export type QuestionAsset = {
  id: string;
  stage: string;
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
  material?: string;
  choices: string[];
  answer: string;
  analysis: string;
  difficulty: string;
  score?: number;
  sourceLabel?: string;
  rubric?: string;
};

export type PaperBankItem = {
  id: string;
  title: string;
  durationMinutes: number;
};

export type PaperAsset = {
  id: string;
  title: string;
  stage: string;
  subject: string;
  chapter: {
    id: string;
    title: string;
  };
  durationMinutes: number;
  fullScore?: number;
  header?: {
    schoolYear?: string;
    grade?: string;
    subjectLabel?: string;
    examType?: string;
    volume?: string;
  };
  instructions?: string[];
  answerSheetRules?: string[];
  questionIds: string[];
  sections: Array<{
    id: string;
    title: string;
    targetCount: number;
    score?: number;
    answerMode?: string;
    note?: string;
    questionIds: string[];
  }>;
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
  getExam: (examId: string) => fetchJson<{ item: ExamContent }>(`/content/exams/${examId}`),
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
    fetchJson<{ userId: string; item: { id: string } }>("/user/exam-results", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      emitHostEvent("checkpoint_saved", {
        kind: "exam_result",
        examId: payload.examId,
        score: payload.score
      });
      return response;
    }),
  trackLearningEvent: (payload: {
    type: string;
    targetId: string;
    title: string;
    metadata?: Record<string, string | number | boolean>;
    userId?: string;
  }) =>
    fetchJson<{ userId: string; item: { id: string } }>("/user/events", {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: resolveUserId(payload.userId) }),
      headers: { "Content-Type": "application/json" }
    } as RequestInit).then((response) => {
      if (payload.type === "exam_viewed") {
        emitHostEvent("lesson_started", {
          eventId: response.item.id,
          targetId: payload.targetId,
          title: payload.title,
          metadata: payload.metadata || {}
        });
      }
      return response;
    })
};
