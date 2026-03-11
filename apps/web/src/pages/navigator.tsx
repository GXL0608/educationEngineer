import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function NavigatorPage() {
  const stagesQuery = useQuery({
    queryKey: ["stages"],
    queryFn: api.getStages
  });
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: api.getCourses
  });
  const userReportQuery = useQuery({
    queryKey: ["navigator-user-report"],
    queryFn: () => api.getUserReport()
  });
  const [activeStage, setActiveStage] = useState<"all" | "K12" | "undergraduate" | "master" | "doctor">("all");

  if (stagesQuery.isLoading || coursesQuery.isLoading || userReportQuery.isLoading) {
    return <LoadingState title="课程导航加载中" detail="正在整理可进入的课程路径。" />;
  }

  if (stagesQuery.isError || coursesQuery.isError || userReportQuery.isError || !stagesQuery.data || !coursesQuery.data || !userReportQuery.data) {
    return <ErrorState title="课程导航暂不可用" detail="暂时无法读取课程目录，请稍后再试。" />;
  }

  const stages = stagesQuery.data.items;
  const courses = coursesQuery.data.items;
  const courseMasteryMap = new Map(userReportQuery.data.courseMastery.map((item) => [item.id, item]));
  const visibleStages = activeStage === "all" ? stages : stages.filter((stage) => stage.id === activeStage);

  return (
    <div className="page-stack">
      <section className="course-workspace">
        <div className="course-workspace__main">
          <p className="eyebrow">课程导航</p>
          <h1>从正确的学段和学科进入课程</h1>
          <p className="course-workspace__body">学习端只做一件事：帮你迅速找到当前该进入的课程，并继续未完成的章节闭环。</p>
          <div className="action-row">
            <button
              type="button"
              className={activeStage === "all" ? "chip-button chip-button--active" : "button-secondary chip-button"}
              onClick={() => setActiveStage("all")}
            >
              全部学段
            </button>
            {stages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                className={activeStage === stage.id ? "chip-button chip-button--active" : "button-secondary chip-button"}
                onClick={() => setActiveStage(stage.id)}
              >
                {stage.title}
              </button>
            ))}
          </div>
        </div>
        <aside className="course-workspace__side">
          <article className="workspace-spotlight">
            <span>当前筛选</span>
            <strong>{activeStage === "all" ? "全部学段" : stages.find((stage) => stage.id === activeStage)?.title}</strong>
            <p>切换学段后，下面的课程列表会立即收敛到对应范围。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="课程目录" title="按学段聚合课程">
        <div className="stage-atlas">
          {visibleStages.map((stage) => {
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
                    <article key={course.id} className="course-card course-card--interactive">
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
                        <span>{courseMasteryMap.get(course.id)?.score ? `${courseMasteryMap.get(course.id)?.score}% 掌握度` : "未开始"}</span>
                      </div>
                      <div className="link-row">
                        <Link to="/course/$courseId" params={{ courseId: course.id }}>
                          进入课程
                        </Link>
                        <Link to="/report">查看掌握度</Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </PanelShell>
    </div>
  );
}
