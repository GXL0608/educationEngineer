import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

type ChapterPageProps = {
  chapterId: string;
};

export function ChapterPage({ chapterId }: ChapterPageProps) {
  const chapterQuery = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => api.getChapter(chapterId)
  });
  const userReportQuery = useQuery({
    queryKey: ["chapter-report", chapterId],
    queryFn: () => api.getUserReport()
  });

  if (chapterQuery.isLoading || userReportQuery.isLoading) {
    return <LoadingState title="章节任务加载中" detail="正在同步章节内容和掌握度状态。" />;
  }

  if (chapterQuery.isError || userReportQuery.isError || !chapterQuery.data || !userReportQuery.data) {
    return <ErrorState title="章节任务暂不可用" detail="暂时无法同步章节内容，请稍后刷新。" />;
  }

  const { course, chapter } = chapterQuery.data.item;
  const chapterMastery = userReportQuery.data.chapterMastery.find((item) => item.id === chapter.id);
  const knowledgeActions = userReportQuery.data.recommendedNextSteps
    .filter((item) => item.targetId.startsWith(`${chapter.id}:`))
    .slice(0, 2);
  const loopCards = [
    {
      title: "精读正文",
      summary: "按段理解概念、条件和例子，先建立清晰表征。",
      href: "/study/$lessonId" as const,
      params: { lessonId: chapter.lessonId }
    },
    {
      title: "概念讲解",
      summary: "用概念画布确认关系、边界和推导顺序。",
      href: "/concept/$conceptId" as const,
      params: { conceptId: chapter.conceptId }
    },
    {
      title: "章节练习",
      summary: "先独立作答，再检查答案，拿到真正的训练结果。",
      href: "/practice/$practiceId" as const,
      params: { practiceId: chapter.practiceId }
    },
    {
      title: "章节模拟",
      summary: "按考试节奏验证迁移能力，把薄弱点回流到报告和复习。",
      href: "/exam/$examId" as const,
      params: { examId: chapter.examId }
    }
  ];

  return (
    <div className="page-stack">
      <section className="course-workspace course-workspace--chapter">
        <div className="course-workspace__main">
          <p className="eyebrow">{course.title}</p>
          <h1>{chapter.title}</h1>
          <p className="course-workspace__body">{chapter.summary}</p>
          <div className="shell-chip-row">
            <span>{course.subject}</span>
            <span>精读</span>
            <span>概念</span>
            <span>练习</span>
            <span>考试</span>
          </div>
          <div className="action-row">
            <Link to="/study/$lessonId" params={{ lessonId: chapter.lessonId }} className="shell-action-link shell-action-link--primary">
              从精读开始
            </Link>
            <Link to="/report" className="shell-action-link">
              查看本章报告
            </Link>
          </div>
        </div>
        <aside className="course-workspace__side">
          <article className="workspace-spotlight">
            <span>章节掌握度</span>
            <strong>{chapterMastery ? `${chapterMastery.score}%` : "待生成"}</strong>
            <p>{chapterMastery ? chapterMastery.nextAction : "完成本章一轮精读和训练后，会形成第一批掌握度证据。"}</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>本章目标</span>
            <strong>完成章节闭环</strong>
            <p>按精读、概念、练习、考试的顺序完成本章学习，并把结果送入复习系统。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="章节闭环" title="按这个顺序完成本章任务">
        <div className="card-grid card-grid--wide">
          {loopCards.map((item, index) => (
            <Link key={item.title} to={item.href} params={item.params} className="stage-card stage-card--feature">
              <p className="eyebrow">阶段 {index + 1}</p>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
            </Link>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="本章提醒" title="本章最值得先解决的问题">
        <div className="card-grid">
          {knowledgeActions.length > 0 ? (
            knowledgeActions.map((item) => (
              <article key={item.id} className="course-card">
                <p className="eyebrow">知识点任务</p>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                <p>{item.action}</p>
              </article>
            ))
          ) : (
            <article className="course-card">
              <strong>先把本章走完一遍</strong>
              <p>当前还没有形成足够多的知识点级证据，先从精读进入，系统会在练习和考试后生成更具体的建议。</p>
            </article>
          )}
        </div>
      </PanelShell>
    </div>
  );
}
