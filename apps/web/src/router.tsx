import { Link, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppShell } from "./components/app-shell";
import { ExamPage } from "./pages/exam";

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="page-stack">
      <section className="panel-shell">
        <div className="panel-shell__header">
          <h2>页面不存在</h2>
        </div>
        <div className="page-message">
          <strong>当前只开放考试模块</strong>
          <p>
            请返回 <Link to="/">考试首页</Link> 重新进入。
          </p>
        </div>
      </section>
    </div>
  )
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <ExamPage examId="exam-force-unit" />
});

const examRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exam/$examId",
  component: () => {
    const { examId } = examRoute.useParams();
    return <ExamPage examId={examId} />;
  }
});

const routeTree = rootRoute.addChildren([indexRoute, examRoute]);

export const router = createRouter({
  routeTree
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
