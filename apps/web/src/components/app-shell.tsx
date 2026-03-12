import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/";
  const papersQuery = useQuery({
    queryKey: ["sidebar-papers"],
    queryFn: () => api.getPapers({ stage: "K12" })
  });
  const papers = papersQuery.data?.items || [];

  return (
    <div className="app-shell app-shell--exam">
      <aside className="app-shell__sidebar app-shell__sidebar--exam">
        <div className="shell-brand">
          <div className="shell-brand__lockup">
            <h1>考试模块</h1>
            <p>开发阶段菜单</p>
          </div>
        </div>

        <div className="nav-stack">
          <section className="nav-group">
            <p className="nav-group__title">当前入口</p>
            <div className="nav-list">
              <Link to="/" className={isHome ? "nav-list__item nav-list__item--active" : "nav-list__item"}>
                考试首页
              </Link>
            </div>
          </section>

          <section className="nav-group">
            <p className="nav-group__title">当前样卷</p>
            <div className="nav-list">
              {papersQuery.isLoading ? <div className="nav-list__meta">正在读取样卷...</div> : null}
              {papersQuery.isError ? <div className="nav-list__meta">样卷菜单暂时不可用</div> : null}
              {!papersQuery.isLoading && !papersQuery.isError && papers.length === 0 ? (
                <div className="nav-list__meta">还没有可展示的样卷</div>
              ) : null}
              {papers.map((paper) => {
                const active = pathname === `/exam/${paper.id}` || (isHome && paper.id === "exam-force-unit");
                return (
                  <Link
                    key={paper.id}
                    to="/exam/$examId"
                    params={{ examId: paper.id }}
                    className={active ? "nav-list__item nav-list__item--active" : "nav-list__item"}
                  >
                    <span>{paper.title}</span>
                    <small>{paper.durationMinutes} 分钟</small>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="shell-card shell-card--quiet">
          <strong>后续接入</strong>
          <p>这里后面直接挂托福真题 PDF / Word，对应菜单会继续在这里扩展。</p>
        </div>
      </aside>
      <div className="app-shell__content">
        <header className="app-shell__topbar app-shell__topbar--exam">
          <div className="app-shell__topbar-main">
            <div className="shell-brand shell-brand--inline">
              <div className="shell-brand__lockup">
                <h1>考试模块</h1>
                <p>{isHome ? "Web 挂载入口" : "真实考题页"}</p>
              </div>
            </div>
          </div>
          <div className="app-shell__topbar-side">
            <span className="shell-status-pill">单页运行</span>
          </div>
        </header>
        <main className="app-shell__body app-shell__body--focus">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
