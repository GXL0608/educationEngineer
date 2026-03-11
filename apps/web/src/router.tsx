import {
  Link,
  createRootRoute,
  createRoute,
  createRouter
} from "@tanstack/react-router";
import { AppShell } from "./components/app-shell";
import { ChapterPage } from "./pages/chapter";
import { ConceptPage } from "./pages/concept";
import { CoursePage } from "./pages/course";
import { ExamPage } from "./pages/exam";
import { HelpPage } from "./pages/help";
import { HomePage } from "./pages/home";
import { NavigatorPage } from "./pages/navigator";
import { NotesPage } from "./pages/notes";
import { PapersPage } from "./pages/papers";
import { PracticePage } from "./pages/practice";
import { QuestionsPage } from "./pages/questions";
import { ReleasePage } from "./pages/release";
import { ReportPage } from "./pages/report";
import { ResearchPage } from "./pages/research";
import { ReviewPage } from "./pages/review";
import { ReviewWorkbenchPage } from "./pages/review-workbench";
import { SearchPage } from "./pages/search";
import { StudyPage } from "./pages/study";

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="page-stack">
      <section className="panel-shell">
        <div className="panel-shell__header">
          <h2>页面不存在</h2>
        </div>
        <div className="page-message">
          <strong>你访问的内容暂时没有开放</strong>
          <p>
            请返回 <Link to="/">学习首页</Link> 或从左侧导航重新进入。
          </p>
        </div>
      </section>
    </div>
  )
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage
});

const navigatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/navigator",
  component: NavigatorPage
});

const courseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/course/$courseId",
  component: () => {
    const { courseId } = courseRoute.useParams();
    return <CoursePage courseId={courseId} />;
  }
});

const chapterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chapter/$chapterId",
  component: () => {
    const { chapterId } = chapterRoute.useParams();
    return <ChapterPage chapterId={chapterId} />;
  }
});

const studyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study/$lessonId",
  component: () => {
    const { lessonId } = studyRoute.useParams();
    return <StudyPage lessonId={lessonId} />;
  }
});

const conceptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/concept/$conceptId",
  component: () => {
    const { conceptId } = conceptRoute.useParams();
    return <ConceptPage conceptId={conceptId} />;
  }
});

const practiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/practice/$practiceId",
  component: () => {
    const { practiceId } = practiceRoute.useParams();
    return <PracticePage practiceId={practiceId} />;
  }
});

const examRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exam/$examId",
  component: () => {
    const { examId } = examRoute.useParams();
    return <ExamPage examId={examId} />;
  }
});

const questionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/questions",
  component: QuestionsPage
});

const papersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/papers",
  component: PapersPage
});

const releaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/release",
  component: ReleasePage
});

const reviewWorkbenchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ops/reviews",
  component: ReviewWorkbenchPage
});

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review",
  component: ReviewPage
});

const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notes",
  component: NotesPage
});

const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/research/$paperId",
  component: () => {
    const { paperId } = researchRoute.useParams();
    return <ResearchPage paperId={paperId} />;
  }
});

const reportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/report",
  component: ReportPage
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage
});

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/help",
  component: HelpPage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  navigatorRoute,
  questionsRoute,
  papersRoute,
  releaseRoute,
  reviewWorkbenchRoute,
  courseRoute,
  chapterRoute,
  studyRoute,
  conceptRoute,
  practiceRoute,
  examRoute,
  reviewRoute,
  notesRoute,
  researchRoute,
  reportRoute,
  searchRoute,
  helpRoute
]);

export const router = createRouter({
  routeTree
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
