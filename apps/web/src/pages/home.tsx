import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../components/metric-card";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

function resolveRecommendationHref(
  recommendation?: {
    targetId: string;
    targetType: "course" | "chapter" | "knowledge";
  } | null
) {
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

export function HomePage() {
  const stagesQuery = useQuery({
    queryKey: ["stages"],
    queryFn: api.getStages
  });
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: api.getCourses
  });
  const userReportQuery = useQuery({
    queryKey: ["home-user-report"],
    queryFn: () => api.getUserReport()
  });
  const reviewQuery = useQuery({
    queryKey: ["home-review-items"],
    queryFn: () => api.getUserReviewItems()
  });

  if (stagesQuery.isLoading || coursesQuery.isLoading || userReportQuery.isLoading || reviewQuery.isLoading) {
    return <LoadingState title="学习首页加载中" detail="正在同步你的课程、复习和学习结果。" />;
  }

  if (
    stagesQuery.isError ||
    coursesQuery.isError ||
    userReportQuery.isError ||
    reviewQuery.isError ||
    !stagesQuery.data ||
    !coursesQuery.data ||
    !userReportQuery.data ||
    !reviewQuery.data
  ) {
    return <ErrorState title="学习首页暂不可用" detail="暂时无法同步你的学习路径，请稍后刷新。" />;
  }

  const stages = stagesQuery.data.items;
  const courses = coursesQuery.data.items;
  const userReport = userReportQuery.data;
  const reviewItems = reviewQuery.data.items;
  const highlightedCourses = courses.slice(0, 6);
  const courseMasteryMap = new Map(userReport.courseMastery.map((item) => [item.id, item]));
  const primaryAction = userReport.recommendedNextSteps[0];
  const noteCount = userReport.stats.find((item) => item.label === "个人笔记")?.value || "--";
  const searchCount = userReport.stats.find((item) => item.label === "搜索记录")?.value || "--";

  return (
    <div className="page-stack">
      <section className="learner-home-hero">
        <div className="learner-home-hero__main">
          <p className="eyebrow">学习首页</p>
          <h1>{primaryAction ? `继续完成 ${primaryAction.title}` : "从一门课程开始建立你的学习闭环"}</h1>
          <p className="course-workspace__body">
            学习端只保留一条主线：进入课程，完成精读、概念理解、练习、考试和复习，把结果持续回流到报告。
          </p>
          <div className="shell-chip-row">
            <span>{courses.length} 门已开放课程</span>
            <span>{reviewItems.length} 项待复习</span>
            <span>{noteCount} 条学习笔记</span>
            <span>{searchCount} 次主动检索</span>
          </div>
          <div className="action-row">
            <Link to={resolveRecommendationHref(primaryAction)} className="shell-action-link shell-action-link--primary">
              继续学习
            </Link>
            <Link to="/navigator" className="shell-action-link">
              打开课程导航
            </Link>
            <Link to="/review" className="shell-action-link">
              进入复习
            </Link>
          </div>
        </div>
        <aside className="task-column">
          {userReport.recommendedNextSteps.slice(0, 3).map((item, index) => (
            <article key={item.id} className="task-card">
              <span>优先级 {index + 1}</span>
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
              <Link to={resolveRecommendationHref(item)} className="shell-card__link">
                开始这一步
              </Link>
            </article>
          ))}
        </aside>
      </section>

      <section className="metric-grid">
        {[...userReport.masteryStats.slice(0, 2), ...userReport.resultStats.slice(0, 2)].map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      <PanelShell eyebrow="本周路径" title="按顺序完成当前学习闭环" description="优先处理掌握度最低、最近证据最不足的内容。">
        <div className="learning-path-grid">
          {userReport.recommendedNextSteps.map((item, index) => (
            <article key={item.id} className="learning-path-card">
              <p className="learning-path-card__order">STEP {String(index + 1).padStart(2, "0")}</p>
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
              <p>{item.action}</p>
              <Link to={resolveRecommendationHref(item)} className="shell-card__link">
                进入任务
              </Link>
            </article>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="最近证据" title="最近一次训练与考试回流">
        <div className="card-grid">
          {userReport.recentResults.slice(0, 3).map((item) => (
            <article key={item.id} className="course-card">
              <p className="eyebrow">{item.kind === "practice" ? "练习结果" : "考试结果"}</p>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <p>{item.completedAt}</p>
            </article>
          ))}
          {userReport.recentResults.length === 0 ? (
            <article className="course-card">
              <strong>还没有结果证据</strong>
              <p>从任意课程进入，先完成一次精读和一组练习，报告就会开始形成。</p>
            </article>
          ) : null}
        </div>
      </PanelShell>

      <PanelShell eyebrow="核心动作" title="学习端常用入口">
        <div className="card-grid">
          <Link to="/navigator" className="stage-card stage-card--feature">
            <strong>进入课程导航</strong>
            <p>按学段和学科进入一门课，而不是在模块之间反复切换。</p>
          </Link>
          <Link to="/search" className="stage-card stage-card--feature">
            <strong>全局搜索</strong>
            <p>跨课程、章节、题目和研究内容检索你当前需要的知识。</p>
          </Link>
          <Link to="/review" className="stage-card stage-card--feature">
            <strong>错题复习</strong>
            <p>把错误和薄弱点转成当天就能执行的复习任务。</p>
          </Link>
          <Link to="/notes" className="stage-card stage-card--feature">
            <strong>知识卡片</strong>
            <p>沉淀摘录、错因、迁移结论，形成长期可复用的知识资产。</p>
          </Link>
        </div>
      </PanelShell>

      <PanelShell eyebrow="课程入口" title="按学段进入课程">
        <div className="stage-atlas">
          {stages.map((stage) => {
            const stageCourses = courses.filter((course) => course.stage === stage.id);
            return (
              <section key={stage.id} className="stage-band">
                <div className="stage-band__header">
                  <div>
                    <p className="eyebrow">{stage.id}</p>
                    <h3>{stage.title}</h3>
                    <p>{stage.subtitle}</p>
                  </div>
                  <div className="stage-band__stats">
                    <span>{stageCourses.length} 门课程</span>
                    <span>{stage.subjects} 个预埋学科</span>
                  </div>
                </div>
                <div className="stage-band__courses">
                  {stageCourses.map((course) => (
                    <Link key={course.id} to="/course/$courseId" params={{ courseId: course.id }} className="navigator-course navigator-course--rich">
                      <strong>{course.title}</strong>
                      <span>{course.audience}</span>
                      <div className="shell-chip-row shell-chip-row--compact">
                        <span>{course.metrics.lessons} 学习单元</span>
                        <span>{course.metrics.practices} 组训练</span>
                        <span>{courseMasteryMap.get(course.id)?.score ? `${courseMasteryMap.get(course.id)?.score}% 掌握度` : "未开始"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </PanelShell>

      <PanelShell eyebrow="近期课程" title="最近适合进入的课程">
        <div className="card-grid">
          {highlightedCourses.map((course) => (
            <Link key={course.id} to="/course/$courseId" params={{ courseId: course.id }} className="course-card course-card--interactive">
              <p className="eyebrow">{course.subject}</p>
              <strong>{course.title}</strong>
              <p>
                {course.audience}
                <br />
                {course.description}
              </p>
              <div className="shell-chip-row shell-chip-row--compact">
                <span>{course.metrics.lessons} 学习单元</span>
                <span>{course.metrics.practices} 组练习</span>
                <span>{courseMasteryMap.get(course.id)?.score ? `${courseMasteryMap.get(course.id)?.score}%` : "待进入"}</span>
              </div>
            </Link>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
