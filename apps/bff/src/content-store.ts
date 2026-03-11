import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type StageId = "K12" | "undergraduate" | "master" | "doctor";

type StageSummary = {
  id: StageId;
  title: string;
  subtitle: string;
  subjects: number;
};

type ChapterSummary = {
  id: string;
  title: string;
  summary: string;
  lessonId: string;
  conceptId: string;
  practiceId: string;
  examId: string;
  paperId?: string;
};

type CourseDetail = {
  id: string;
  stage: StageId;
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

type ChapterPayload = {
  course: {
    id: string;
    title: string;
    subject: string;
  };
  chapter: ChapterSummary;
};

type LessonContent = {
  id: string;
  title: string;
  paragraphs: string[];
  timeline: Array<{ label: string; time: string }>;
};

type ConceptContent = {
  id: string;
  title: string;
  nodes: string[];
  chain: string[];
};

type PracticeContent = {
  id: string;
  title: string;
  items: Array<{
    prompt: string;
    answer: string;
    focus: string;
  }>;
};

type ExamContent = {
  id: string;
  title: string;
  durationMinutes: number;
  sections: string[];
};

type ResearchContent = {
  id: string;
  title: string;
  paragraphs: string[];
  nodes: string[];
  chain: string[];
};

type NoteCard = {
  id: string;
  title: string;
  tag: string;
  summary: string;
};

type ReportOverview = {
  weeklyFocus: string;
  progress: Array<{ label: string; value: string }>;
  weakness: string[];
};

type ReviewItem = {
  title: string;
  reason: string;
  nextReviewAt: string;
};

type SearchItem = {
  id: string;
  type: string;
  title: string;
  summary: string;
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
  choices: string[];
  answer: string;
  analysis: string;
  difficulty: string;
  source: {
    kind: string;
    practiceId: string;
  };
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
  questionIds: string[];
  sections: Array<{
    id: string;
    title: string;
    targetCount: number;
    questionIds: string[];
  }>;
};

type ReleaseManifest = {
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
    stage: StageId;
    subject: string;
    sourceName: string;
    artifactPath: string;
  }>;
};

export type LearningContext = {
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  knowledgePoints: string[];
};

type CatalogPayload = {
  stages: StageSummary[];
  courses: CourseDetail[];
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

function readCatalog(): CatalogPayload {
  return readJson<CatalogPayload>("catalog.json");
}

function getFallbackCourse(): CourseDetail {
  return readCatalog().courses[0];
}

function getFallbackChapterSummary(): ChapterSummary {
  return getFallbackCourse().chapters[0];
}

function getFallbackResearchId(): string {
  const catalog = readCatalog();

  for (const course of catalog.courses) {
    for (const chapter of course.chapters) {
      if (chapter.paperId) {
        return chapter.paperId;
      }
    }
  }

  return "paper-methodology";
}

function buildFallbackChapter(): ChapterPayload {
  const course = getFallbackCourse();
  return {
    course: {
      id: course.id,
      title: course.title,
      subject: course.subject
    },
    chapter: getFallbackChapterSummary()
  };
}

function readAsset<T>(directory: string, assetId: string, fallbackId: string): T {
  return tryReadJson<T>(directory, `${assetId}.json`) ?? readJson<T>(directory, `${fallbackId}.json`);
}

export function listStages() {
  return readCatalog().stages;
}

export function listCourses() {
  return readCatalog().courses;
}

export function getCourse(courseId: string) {
  const catalog = readCatalog();
  return catalog.courses.find((course) => course.id === courseId) ?? catalog.courses[0];
}

export function getChapter(chapterId: string) {
  return tryReadJson<ChapterPayload>("chapters", `${chapterId}.json`) ?? buildFallbackChapter();
}

export function getLesson(lessonId: string) {
  return readAsset<LessonContent>("lessons", lessonId, getFallbackChapterSummary().lessonId);
}

export function getConcept(conceptId: string) {
  return readAsset<ConceptContent>("concepts", conceptId, getFallbackChapterSummary().conceptId);
}

export function getPractice(practiceId: string) {
  return readAsset<PracticeContent>("practices", practiceId, getFallbackChapterSummary().practiceId);
}

export function getExam(examId: string) {
  return readAsset<ExamContent>("exams", examId, getFallbackChapterSummary().examId);
}

export function getResearchPaper(paperId: string) {
  return readAsset<ResearchContent>("research", paperId, getFallbackResearchId());
}

export function getNotes() {
  return readJson<{ items: NoteCard[] }>("notes.json").items;
}

export function getReportOverview() {
  return readJson<ReportOverview>("report-overview.json");
}

export function getReviewQueue() {
  return readJson<{ items: ReviewItem[] }>("review-queue.json").items;
}

export function searchContent(query: string) {
  const keyword = query.trim().toLowerCase();
  const items = readJson<{ items: SearchItem[] }>("search-index.json").items;

  if (!keyword) {
    return items;
  }

  return items.filter((item) => {
    const title = item.title.toLowerCase();
    const summary = item.summary.toLowerCase();
    return title.includes(keyword) || summary.includes(keyword);
  });
}

function readQuestionBank() {
  return readJson<{ items: QuestionBankItem[] }>("question-bank.json").items;
}

function readPaperBank() {
  return readJson<{ items: PaperBankItem[] }>("paper-bank.json").items;
}

function collectKnowledgePointsByChapter(chapterId: string) {
  return [...new Set(readQuestionBank().filter((item) => item.chapterId === chapterId).flatMap((item) => item.knowledgePoints))];
}

function findLearningContext(predicate: (chapter: ChapterSummary) => boolean): LearningContext {
  const catalog = readCatalog();

  for (const course of catalog.courses) {
    for (const chapter of course.chapters) {
      if (predicate(chapter)) {
        return {
          courseId: course.id,
          courseTitle: course.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          knowledgePoints: collectKnowledgePointsByChapter(chapter.id)
        };
      }
    }
  }

  const fallbackCourse = getFallbackCourse();
  const fallbackChapter = getFallbackChapterSummary();
  return {
    courseId: fallbackCourse.id,
    courseTitle: fallbackCourse.title,
    chapterId: fallbackChapter.id,
    chapterTitle: fallbackChapter.title,
    knowledgePoints: collectKnowledgePointsByChapter(fallbackChapter.id)
  };
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

export function getPracticeContext(practiceId: string) {
  return findLearningContext((chapter) => chapter.practiceId === practiceId);
}

export function getExamContext(examId: string) {
  return findLearningContext((chapter) => chapter.examId === examId);
}

export function getQuestion(questionId: string) {
  const fallbackId = readQuestionBank()[0]?.id;
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
  const fallbackId = readPaperBank()[0]?.id;
  if (!fallbackId) {
    throw new Error("Paper bank is empty");
  }
  return readAsset<PaperAsset>("papers", paperId, fallbackId);
}

export function getReleaseManifest() {
  return readJson<ReleaseManifest>("..", "releases", "latest.json");
}
