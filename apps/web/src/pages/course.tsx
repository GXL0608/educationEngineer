import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../components/metric-card";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

type CoursePageProps = {
  courseId: string;
};

export function CoursePage({ courseId }: CoursePageProps) {
  const trackedCourseId = useRef<string | null>(null);
  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.getCourse(courseId)
  });
  const userReportQuery = useQuery({
    queryKey: ["course-user-report", courseId],
    queryFn: () => api.getUserReport()
  });
  const courseData = courseQuery.data?.item;

  useEffect(() => {
    if (!courseData || trackedCourseId.current === courseData.id) {
      return;
    }
    trackedCourseId.current = courseData.id;
    void api
      .trackLearningEvent({
        type: "course_viewed",
        targetId: courseData.id,
        title: courseData.title,
        metadata: { subject: courseData.subject, stage: courseData.stage }
      })
      .catch(() => undefined);
  }, [courseData]);

  if (courseQuery.isLoading || userReportQuery.isLoading) {
    return <LoadingState title="课程总览加载中" detail="正在同步课程概览和章节路径。" />;
  }

  if (courseQuery.isError || userReportQuery.isError || !courseQuery.data || !userReportQuery.data) {
    return <ErrorState title="课程总览暂不可用" detail="暂时无法读取课程详情，请稍后刷新。" />;
  }

  const course = courseQuery.data.item;
  const userReport = userReportQuery.data;
  const courseMastery = userReport.courseMastery.find((item) => item.id === course.id);
  const chapterMasteryMap = new Map(userReport.chapterMastery.map((item) => [item.id, item]));
  const nextAction =
    userReport.recommendedNextSteps.find(
      (item) =>
        item.targetId === course.id ||
        course.chapters.some(
          (chapter) => chapter.id === item.targetId || item.targetId.startsWith(`${chapter.id}:`)
        )
    ) || userReport.recommendedNextSteps[0];
  const nextChapter =
    course.chapters.find(
      (chapter) =>
        nextAction?.targetId === chapter.id || nextAction?.targetId.startsWith(`${chapter.id}:`)
    ) || course.chapters[0];
  const learningLoop = [
    { title: "先精读正文", description: "用多模态阅读器完成正文理解，建立本章基础表征。" },
    { title: "再看概念画布", description: "把抽象概念拆成关系、边界和推导链。" },
    { title: "进入训练", description: "独立作答，检查答案，把正确率和薄弱点写回报告。" },
    { title: "做一次模拟", description: "用整章或专题考试验证迁移能力，然后进入复习。" }
  ];

  return (
    <div className="page-stack">
      <section className="course-workspace">
        <div className="course-workspace__main">
          <p className="eyebrow">
            {course.subject} · {course.stage}
          </p>
          <h1>{course.title}</h1>
          <p className="course-workspace__body">{course.description}</p>
          <div className="shell-chip-row">
            <span>{course.audience}</span>
            <span>{course.metrics.lessons} 学习单元</span>
            <span>{course.metrics.practices} 组练习</span>
            <span>{course.metrics.reports}</span>
          </div>
          <div className="action-row">
            <Link to="/chapter/$chapterId" params={{ chapterId: nextChapter.id }} className="shell-action-link shell-action-link--primary">
              继续本课程
            </Link>
            <Link to="/report" className="shell-action-link">
              查看课程报告
            </Link>
          </div>
        </div>
        <aside className="course-workspace__side">
          <article className="workspace-spotlight">
            <span>课程掌握度</span>
            <strong>{courseMastery ? `${courseMastery.score}%` : "待生成"}</strong>
            <p>{courseMastery ? `${courseMastery.evidenceCount} 次结果记录 · ${courseMastery.trend}` : "完成练习和考试后生成课程掌握度。"}</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>当前最优先动作</span>
            <strong>{nextAction?.title || "从章节一进入课程"}</strong>
            <p>{nextAction?.action || "建议先完成第一章精读，再进入概念和练习。"}</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="学习方法" title="这门课应该怎么学" description="一门课程不是看完介绍就结束，而是持续进入章节闭环。">
        <div className="card-grid card-grid--wide">
          {learningLoop.map((item, index) => (
            <article key={item.title} className="stage-card">
              <p className="eyebrow">步骤 {index + 1}</p>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </PanelShell>

      <section className="metric-grid">
        <MetricCard label="章节数量" value={String(course.chapters.length)} />
        <MetricCard label="学习单元" value={String(course.metrics.lessons)} />
        <MetricCard label="训练组数" value={String(course.metrics.practices)} />
        <MetricCard label="报告方式" value={course.metrics.reports} />
      </section>

      <PanelShell eyebrow="章节路径" title="从章节进入真正的学习闭环" description="优先进入掌握度较低、证据最少或者正在下降的章节。">
        <div className="chapter-runway">
          {course.chapters.map((chapter) => (
            <article key={chapter.id} className="chapter-card">
              <div className="chapter-card__header">
                <div>
                  <p className="chapter-card__index">{String(course.chapters.indexOf(chapter) + 1).padStart(2, "0")}</p>
                  <strong>{chapter.title}</strong>
                </div>
                <div className="chapter-card__score">
                  {chapterMasteryMap.get(chapter.id) ? `${chapterMasteryMap.get(chapter.id)?.score}%` : "--"}
                </div>
              </div>
              <p>{chapter.summary}</p>
              <div className="shell-chip-row shell-chip-row--compact">
                <span>{chapterMasteryMap.get(chapter.id)?.status || "待学习"}</span>
                <span>{chapterMasteryMap.get(chapter.id)?.trend || "steady"}</span>
                <span>{chapterMasteryMap.get(chapter.id)?.evidenceCount || 0} 次证据</span>
              </div>
              <p className="chapter-card__action">{chapterMasteryMap.get(chapter.id)?.nextAction || "先完成本章精读，再用概念画布和练习建立稳定掌握度。"}</p>
              <div className="link-row">
                <Link to="/chapter/$chapterId" params={{ chapterId: chapter.id }}>
                  进入本章
                </Link>
                <Link to="/study/$lessonId" params={{ lessonId: chapter.lessonId }}>
                  精读
                </Link>
                <Link to="/concept/$conceptId" params={{ conceptId: chapter.conceptId }}>
                  概念图
                </Link>
                <Link to="/practice/$practiceId" params={{ practiceId: chapter.practiceId }}>
                  练习
                </Link>
                <Link to="/exam/$examId" params={{ examId: chapter.examId }}>
                  考试
                </Link>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
