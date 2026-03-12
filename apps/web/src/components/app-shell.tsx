import { Outlet, useRouterState } from "@tanstack/react-router";

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/";

  return (
    <div className="app-shell app-shell--exam">
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
