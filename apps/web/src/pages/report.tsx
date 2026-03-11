import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../components/metric-card";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api, LearningEvent, MasteryEntry } from "../lib/api";

function formatEventLabel(event: LearningEvent) {
  const mapping: Record<string, string> = {
    note_created: "新增笔记",
    feedback_created: "提交反馈",
    review_completed: "完成复习",
    review_snoozed: "顺延复习",
    search_executed: "执行搜索",
    course_viewed: "查看课程",
    lesson_viewed: "查看精读",
    practice_viewed: "进入练习",
    practice_completed: "完成练习",
    exam_viewed: "进入考试",
    exam_submitted: "提交考试结果",
    research_viewed: "进入研究"
  };
  return mapping[event.type] || event.type;
}

function formatStatusLabel(status: MasteryEntry["status"]) {
  if (status === "strong") {
    return "稳定";
  }
  if (status === "steady") {
    return "需持续";
  }
  return "风险";
}

function formatTrendLabel(trend: MasteryEntry["trend"]) {
  if (trend === "rising") {
    return "上升";
  }
  if (trend === "falling") {
    return "下降";
  }
  return "持平";
}

function resolveRecommendationHref(recommendation: { targetId: string; targetType: "course" | "chapter" | "knowledge" }) {
  if (recommendation.targetType === "course") {
    return `/course/${recommendation.targetId}`;
  }
  if (recommendation.targetType === "chapter") {
    return `/chapter/${recommendation.targetId}`;
  }
  return `/chapter/${recommendation.targetId.split(":")[0] || recommendation.targetId}`;
}

function resolveMasteryHref(item: MasteryEntry, type: "course" | "chapter" | "knowledge") {
  if (type === "course") {
    return `/course/${item.id}`;
  }
  if (type === "chapter") {
    return `/chapter/${item.id}`;
  }
  return `/chapter/${item.id.split(":")[0] || item.id}`;
}

export function ReportPage() {
  const reportQuery = useQuery({
    queryKey: ["report-overview"],
    queryFn: api.getReportOverview
  });
  const userReportQuery = useQuery({
    queryKey: ["user-report"],
    queryFn: () => api.getUserReport()
  });

  if (reportQuery.isLoading || userReportQuery.isLoading) {
    return <LoadingState title="学习报告加载中" detail="正在汇总进度、掌握度和薄弱点。" />;
  }

  if (reportQuery.isError || !reportQuery.data || userReportQuery.isError || !userReportQuery.data) {
    return <ErrorState title="学习报告不可用" detail="无法获取学习报告。" />;
  }

  const reportSummary = reportQuery.data;
  const userReport = userReportQuery.data;

  return (
    <div className="page-stack">
      <section className="command-board command-board--report">
        <div className="command-board__main">
          <p className="eyebrow">学习报告</p>
          <h1>掌握度、薄弱点与下一步建议</h1>
          <p className="course-workspace__body">汇总结果回流、掌握度变化和下一步动作。</p>
          <div className="shell-chip-row">
            <span>{userReport.userId}</span>
            <span>{userReport.courseMastery.length} 门课程进入掌握度模型</span>
            <span>{userReport.chapterMastery.length} 个章节已评分</span>
            <span>{userReport.knowledgeMastery.length} 个知识点持续跟踪</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>本周重点</span>
            <strong>{reportSummary.weakness.length} 个核心风险点</strong>
            <p>按最近结果识别当前需要优先处理的风险项。</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>第一推荐动作</span>
            <strong>{userReport.recommendedNextSteps[0] ? "最高优先知识点" : "继续当前课程"}</strong>
            <p>{userReport.recommendedNextSteps[0]?.action || "继续最近一次未完成的精读、练习或考试。"} </p>
            {userReport.recommendedNextSteps[0] ? (
              <a className="shell-card__link" href={resolveRecommendationHref(userReport.recommendedNextSteps[0])}>
                继续处理
              </a>
            ) : null}
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="系统报告" title="系统报告与本周重点" description={reportSummary.weeklyFocus}>
        <section className="metric-grid">
          {reportSummary.progress.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} />
          ))}
        </section>
        <div className="card-grid">
          {reportSummary.weakness.map((weakness) => (
            <article key={weakness} className="course-card course-card--interactive">
              <strong>{weakness}</strong>
              <p>建议在下一轮学习中加入针对性练习和主动回忆。</p>
            </article>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="个人行为" title="个人行为、搜索和学习轨迹">
        <section className="metric-grid">
          {userReport.stats.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} />
          ))}
        </section>
        <section className="metric-grid">
          {userReport.resultStats.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} />
          ))}
        </section>
        <div className="insight-grid">
          <section className="insight-panel">
            <div className="insight-panel__header">
              <div>
                <p className="eyebrow">结果弱项</p>
                <h3>失分与风险主题</h3>
              </div>
              <span>{userReport.outcomeWeaknesses.length} 项</span>
            </div>
            <div className="card-grid">
              {userReport.outcomeWeaknesses.map((item) => (
                <article key={item.label} className="course-card">
                  <strong>{item.label}</strong>
                  <p>{item.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="insight-panel">
            <div className="insight-panel__header">
              <div>
                <p className="eyebrow">结果回流</p>
                <h3>最近练习与考试</h3>
              </div>
              <span>{userReport.recentResults.length} 条</span>
            </div>
            <div className="activity-feed">
              {userReport.recentResults.map((item) => (
                <article key={item.id} className="activity-feed__item">
                  <strong>{item.kind === "practice" ? "练习结果" : "考试结果"}</strong>
                  <p>{item.title}</p>
                  <p>{item.summary}</p>
                  <p>完成时间：{item.completedAt}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="insight-panel">
            <div className="insight-panel__header">
              <div>
                <p className="eyebrow">搜索历史</p>
                <h3>最近检索需求</h3>
              </div>
              <span>{userReport.recentSearches.length} 条</span>
            </div>
            <div className="card-grid">
              {userReport.recentSearches.map((item) => (
                <article key={item.id} className="course-card">
                  <strong>{item.query}</strong>
                  <p>
                    搜索时间：{item.createdAt}
                    <br />
                    命中结果：{item.resultCount}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="insight-panel">
            <div className="insight-panel__header">
              <div>
                <p className="eyebrow">行为轨迹</p>
                <h3>最近学习活动</h3>
              </div>
              <span>{userReport.recentActivity.length} 条</span>
            </div>
            <div className="activity-feed">
              {userReport.recentActivity.map((item) => (
                <article key={item.id} className="activity-feed__item">
                  <strong>{formatEventLabel(item)}</strong>
                  <p>{item.title}</p>
                  <p>发生时间：{item.createdAt}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </PanelShell>

      <PanelShell eyebrow="掌握度模型" title="课程 / 章节 / 知识点掌握度">
        <section className="metric-grid">
          {userReport.masteryStats.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} />
          ))}
        </section>

        <div className="mastery-board">
          {userReport.courseMastery.map((item) => (
            <article key={item.id} className="mastery-card">
              <div className="mastery-card__header">
                <div>
                  <p className="eyebrow">课程层</p>
                  <strong>{item.title}</strong>
                </div>
                <span className="mastery-card__score">{item.score}%</span>
              </div>
              <p>{item.subtitle || "课程级掌握度总览"}</p>
              <div className="shell-chip-row shell-chip-row--compact">
                <span>{formatStatusLabel(item.status)}</span>
                <span>{formatTrendLabel(item.trend)}</span>
                <span>{item.evidenceCount} 次结果记录</span>
              </div>
              <p>{item.nextAction}</p>
              <a className="shell-card__link" href={resolveMasteryHref(item, "course")}>
                进入课程
              </a>
            </article>
          ))}
        </div>

        <div className="mastery-board">
          {userReport.chapterMastery.map((item) => (
            <article key={item.id} className="mastery-card">
              <div className="mastery-card__header">
                <div>
                  <p className="eyebrow">章节层</p>
                  <strong>{item.title}</strong>
                </div>
                <span className="mastery-card__score">{item.score}%</span>
              </div>
              <p>{item.subtitle}</p>
              <div className="shell-chip-row shell-chip-row--compact">
                <span>{formatStatusLabel(item.status)}</span>
                <span>{formatTrendLabel(item.trend)}</span>
                <span>{item.evidenceCount} 次证据</span>
              </div>
              <p>{item.nextAction}</p>
              <a className="shell-card__link" href={resolveMasteryHref(item, "chapter")}>
                进入章节
              </a>
            </article>
          ))}
        </div>

        <div className="activity-feed">
          {userReport.knowledgeMastery.map((item) => (
            <article key={item.id} className="activity-feed__item">
              <strong>{item.title}</strong>
              <p>{item.subtitle}</p>
              <p>
                掌握度：{item.score}% · {formatStatusLabel(item.status)} · {formatTrendLabel(item.trend)} · 证据 {item.evidenceCount} 次
              </p>
              <p>{item.nextAction}</p>
              <a className="shell-card__link" href={resolveMasteryHref(item, "knowledge")}>
                回到章节
              </a>
            </article>
          ))}
        </div>

        <div className="activity-feed">
          {userReport.recommendedNextSteps.map((item) => (
            <article key={item.id} className="activity-feed__item">
              <strong>下一步：{item.title}</strong>
              <p>{item.reason}</p>
              <p>{item.action}</p>
              <a className="shell-card__link" href={resolveRecommendationHref(item)}>
                进入精读
              </a>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
