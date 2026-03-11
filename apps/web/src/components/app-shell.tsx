import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { api } from "../lib/api";
import { RecommendationEntry } from "../lib/api";
import { useHostStore } from "../store/host-store";

const navGroups = [
  {
    title: "学习中心",
    items: [
      { to: "/", label: "学习首页", matchers: ["/"] },
      { to: "/navigator", label: "课程导航", matchers: ["/navigator", "/course/", "/chapter/"] },
      { to: "/search", label: "全局搜索", matchers: ["/search", "/research/"] }
    ]
  },
  {
    title: "学习过程",
    items: [
      { to: "/review", label: "错题复习", matchers: ["/review", "/practice/", "/exam/"] },
      { to: "/notes", label: "知识卡片", matchers: ["/notes", "/concept/", "/study/"] },
      { to: "/report", label: "学习报告", matchers: ["/report"] }
    ]
  },
  {
    title: "支持",
    items: [
      { to: "/help", label: "反馈帮助", matchers: ["/help"] }
    ]
  }
] as const;

const pageMeta = [
  { matcher: (pathname: string) => pathname === "/", title: "学习首页", section: "学习中心", description: "从推荐动作继续当前学习节奏。" },
  { matcher: (pathname: string) => pathname.startsWith("/navigator"), title: "课程导航", section: "学习中心", description: "按学段、学科和课程进入学习路径。" },
  { matcher: (pathname: string) => pathname.startsWith("/course/"), title: "课程总览", section: "学习中心", description: "围绕一门课完成章节学习、训练和复盘。" },
  { matcher: (pathname: string) => pathname.startsWith("/chapter/"), title: "章节任务", section: "学习过程", description: "按精读、概念、训练、考试完成一章闭环。" },
  { matcher: (pathname: string) => pathname.startsWith("/study/"), title: "精读学习", section: "学习过程", description: "用朗读、高亮和分段聚焦理解正文。" },
  { matcher: (pathname: string) => pathname.startsWith("/concept/"), title: "概念讲解", section: "学习过程", description: "把抽象概念拆成关系和推导链。" },
  { matcher: (pathname: string) => pathname.startsWith("/practice/"), title: "练习训练", section: "学习过程", description: "独立作答、检查答案并回写结果。" },
  { matcher: (pathname: string) => pathname.startsWith("/exam/"), title: "模拟考试", section: "学习过程", description: "按考试节奏完成章节或专题模拟。" },
  { matcher: (pathname: string) => pathname.startsWith("/review"), title: "错题复习", section: "学习过程", description: "把错误转成可重复强化的复习任务。" },
  { matcher: (pathname: string) => pathname.startsWith("/notes"), title: "知识卡片", section: "学习过程", description: "沉淀摘录、错因和总结卡片。" },
  { matcher: (pathname: string) => pathname.startsWith("/research"), title: "文献研读", section: "学习过程", description: "精读研究材料并拆解论证链。" },
  { matcher: (pathname: string) => pathname.startsWith("/report"), title: "学习报告", section: "学习过程", description: "根据结果和掌握度决定下一步。" },
  { matcher: (pathname: string) => pathname.startsWith("/search"), title: "全局搜索", section: "学习中心", description: "跨课程、章节、练习和研究内容检索。" },
  { matcher: (pathname: string) => pathname.startsWith("/help"), title: "反馈帮助", section: "支持", description: "提交学习卡点和产品反馈。" },
  { matcher: (pathname: string) => pathname.startsWith("/questions"), title: "题目资源", section: "学习中心", description: "浏览训练题资源。" },
  { matcher: (pathname: string) => pathname.startsWith("/papers"), title: "试卷资源", section: "学习中心", description: "浏览试卷资源。" },
  { matcher: (pathname: string) => pathname.startsWith("/release"), title: "发布中心", section: "运营端", description: "内容发布与版本管理。" },
  { matcher: (pathname: string) => pathname.startsWith("/ops/reviews"), title: "审核工作台", section: "运营端", description: "内容审核与发布审批。" }
] as const;

function resolvePageMeta(pathname: string) {
  return pageMeta.find((item) => item.matcher(pathname)) || pageMeta[0];
}

function isActive(pathname: string, matchers: readonly string[]) {
  return matchers.some((matcher) => {
    if (matcher === "/") {
      return pathname === "/";
    }
    return pathname === matcher || pathname.startsWith(matcher);
  });
}

function buildOpenTabs(pathname: string) {
  const tabs = [
    { to: "/", label: "学习首页" },
    { to: "/navigator", label: "课程导航" },
    { to: "/review", label: "错题复习" },
    { to: "/notes", label: "知识卡片" },
    { to: "/report", label: "学习报告" },
    { to: "/search", label: "全局搜索" }
  ];

  const current = resolvePageMeta(pathname);
  const dynamicTab =
    pathname.startsWith("/course/") ||
    pathname.startsWith("/chapter/") ||
    pathname.startsWith("/study/") ||
    pathname.startsWith("/concept/") ||
    pathname.startsWith("/practice/") ||
    pathname.startsWith("/exam/")
      ? [{ to: pathname, label: current.title }]
      : [];

  const merged = [...dynamicTab, ...tabs];
  return merged.filter((tab, index) => merged.findIndex((item) => item.to === tab.to) === index);
}

function resolveRecommendationHref(recommendation?: RecommendationEntry | null) {
  if (!recommendation) {
    return "/navigator";
  }
  if (recommendation.targetType === "course") {
    return `/course/${recommendation.targetId}`;
  }
  if (recommendation.targetType === "chapter") {
    return `/chapter/${recommendation.targetId}`;
  }
  return `/chapter/${recommendation.targetId.split(":")[0] || recommendation.targetId}`;
}

export function AppShell() {
  const location = useLocation();
  const { hostTheme, hostUserId } = useHostStore();
  const userReportQuery = useQuery({
    queryKey: ["shell-user-report"],
    queryFn: () => api.getUserReport()
  });
  const reviewQuery = useQuery({
    queryKey: ["shell-review-queue"],
    queryFn: () => api.getUserReviewItems()
  });
  const currentMeta = resolvePageMeta(location.pathname);
  const openTabs = buildOpenTabs(location.pathname);
  const firstAction = userReportQuery.data?.recommendedNextSteps[0];
  const reviewCount = reviewQuery.data?.items.length ?? 0;
  const resultCount = userReportQuery.data?.recentResults.length ?? 0;

  return (
    <div className={`app-shell theme-${hostTheme}`}>
      <aside className="app-shell__sidebar">
        <div className="shell-brand">
          <div className="shell-brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M6 26.5 19.5 6l6.2 9.1L12.1 35 6 26.5Z" fill="currentColor" />
              <path d="m20.2 22.2 5.3-7.5L34 27.1l-8.2 8.4-5.6-13.3Z" fill="currentColor" opacity="0.78" />
              <path d="m13 34.3 8.1-11.2 5.7 12H13Z" fill="currentColor" opacity="0.55" />
            </svg>
          </div>
          <div className="shell-brand__lockup">
            <h1>教育工程</h1>
            <p>学习端</p>
          </div>
        </div>
        <div className="nav-stack">
          {navGroups.map((group) => (
            <section key={group.title} className="nav-group">
              <p className="nav-group__title">{group.title}</p>
              <nav className="nav-list">
                {group.items.map((item) => {
                  const active = isActive(location.pathname, item.matchers);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={active ? "nav-list__item nav-list__item--active" : "nav-list__item"}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </section>
          ))}
        </div>
      </aside>
      <main className="app-shell__content">
        <header className="app-shell__topbar">
          <div className="topbar-context">
            <p className="topbar-context__section">{currentMeta.section}</p>
            <h2>{currentMeta.title}</h2>
            <p className="topbar-breadcrumb">{currentMeta.description}</p>
          </div>
          <div className="topbar-tools">
            <Link to={resolveRecommendationHref(firstAction)} className="topbar-action topbar-action--primary">
              继续学习
            </Link>
            <Link to="/search" className="topbar-search">
              搜索课程、章节、题目、论文
            </Link>
            <div className="topbar-user">
              <span className="topbar-user__avatar">{(hostUserId || "DE").slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{hostUserId || "当前用户"}</strong>
                <p>
                  {firstAction ? `当前推荐：${firstAction.title}` : `待复习 ${reviewCount} 项 · 最近结果 ${resultCount} 条`}
                </p>
              </div>
            </div>
          </div>
        </header>
        <section className="shell-tabs">
          {openTabs.map((tab) => {
            const active = location.pathname === tab.to;
            return (
              <Link key={tab.to} to={tab.to} className={active ? "shell-tab shell-tab--active" : "shell-tab"}>
                {tab.label}
              </Link>
            );
          })}
        </section>
        <div className="app-shell__body">
          <Outlet />
        </div>
        <footer className="app-shell__footer">
          <span>Education Engineer</span>
          <span>{hostUserId ? `当前账号 ${hostUserId}` : "本地学习预览"}</span>
        </footer>
      </main>
    </div>
  );
}
