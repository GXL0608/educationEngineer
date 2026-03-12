import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type StageId = "K12" | "undergraduate" | "master" | "doctor";

type ExamContent = {
  id: string;
  title: string;
  durationMinutes: number;
  sections: string[];
};

type QuestionBankItem = {
  id: string;
  stage: StageId;
  subject: string;
  courseId: string;
  chapterId: string;
  type: string;
  difficulty: string;
  knowledgePoints: string[];
  stem: string;
};

type QuestionAsset = {
  id: string;
  stage: StageId;
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
  rubric?: string | null;
};

type PaperBankItem = {
  id: string;
  stage: StageId;
  subject: string;
  courseId: string;
  chapterId: string;
  title: string;
  paperType: string;
  durationMinutes: number;
  questionCount: number;
};

type PaperAsset = {
  id: string;
  title: string;
  stage: StageId;
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
  fullScore?: number;
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

export type LearningContext = {
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  knowledgePoints: string[];
};

const GENERATED_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "content", "generated");

function readJson<T>(...segments: string[]): T {
  const filePath = resolve(GENERATED_ROOT, ...segments);
  if (!existsSync(filePath)) {
    throw new Error(`Generated content asset missing: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function tryReadJson<T>(...segments: string[]): T | undefined {
  try {
    return readJson<T>(...segments);
  } catch {
    return undefined;
  }
}

function readQuestionBank() {
  return readJson<{ items: QuestionBankItem[] }>("question-bank.json").items;
}

function readPaperBank() {
  return readJson<{ items: PaperBankItem[] }>("paper-bank.json").items;
}

function getFallbackExamId() {
  return readPaperBank()[0]?.id || "exam-force-unit";
}

function getFallbackQuestionId() {
  return readQuestionBank()[0]?.id;
}

function readAsset<T>(directory: string, assetId: string, fallbackId: string): T {
  return tryReadJson<T>(directory, `${assetId}.json`) ?? readJson<T>(directory, `${fallbackId}.json`);
}

function collectKnowledgePointsByChapter(chapterId: string) {
  return [...new Set(readQuestionBank().filter((item) => item.chapterId === chapterId).flatMap((item) => item.knowledgePoints))];
}

export function getExam(examId: string) {
  return readAsset<ExamContent>("exams", examId, getFallbackExamId());
}

export function listQuestions(filters: { stage?: string; courseId?: string } = {}) {
  return readQuestionBank().filter((item) => {
    if (filters.stage && item.stage !== filters.stage) {
      return false;
    }
    if (filters.courseId && item.courseId !== filters.courseId) {
      return false;
    }
    return true;
  });
}

export function getQuestion(questionId: string) {
  const fallbackId = getFallbackQuestionId();
  if (!fallbackId) {
    throw new Error("Question bank is empty");
  }
  return readAsset<QuestionAsset>("questions", questionId, fallbackId);
}

export function listPapers(filters: { stage?: string; courseId?: string } = {}) {
  return readPaperBank().filter((item) => {
    if (filters.stage && item.stage !== filters.stage) {
      return false;
    }
    if (filters.courseId && item.courseId !== filters.courseId) {
      return false;
    }
    return true;
  });
}

export function getPaper(paperId: string) {
  return readAsset<PaperAsset>("papers", paperId, getFallbackExamId());
}

export function getExamContext(examId: string): LearningContext {
  const paper = getPaper(examId);
  return {
    courseId: paper.course.id,
    courseTitle: paper.course.title,
    chapterId: paper.chapter.id,
    chapterTitle: paper.chapter.title,
    knowledgePoints: collectKnowledgePointsByChapter(paper.chapter.id)
  };
}
