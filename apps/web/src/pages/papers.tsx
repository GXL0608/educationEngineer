import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function PapersPage() {
  const papersQuery = useQuery({
    queryKey: ["papers"],
    queryFn: () => api.getPapers()
  });

  if (papersQuery.isLoading) {
    return <LoadingState title="试卷总览加载中" detail="正在汇总当前已发布试卷资产。" />;
  }

  if (papersQuery.isError || !papersQuery.data) {
    return <ErrorState title="试卷总览不可用" detail="无法获取试卷资产清单。" />;
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">试卷中心</p>
          <h1>正式试卷资产</h1>
          <p className="course-workspace__body">查看章节卷、专题卷和可直接执行的考试资产。</p>
          <div className="shell-chip-row">
            <span>{papersQuery.data.items.length} 份试卷</span>
            <span>{new Set(papersQuery.data.items.map((item) => item.courseId)).size} 门课程覆盖</span>
            <span>{new Set(papersQuery.data.items.map((item) => item.stage)).size} 个学段</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>试卷资产视角</span>
            <strong>章节卷 / 专题卷</strong>
            <p>试卷可以被课程、考试页和发布中心同时调用。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="试卷资产库" title="已发布试卷资产">
        <div className="data-table">
          <div className="data-table__header" style={{ gridTemplateColumns: "1.7fr 1fr 1fr 0.9fr 0.9fr 1fr" }}>
            <span>试卷</span>
            <span>课程 / 章节</span>
            <span>学段 / 学科</span>
            <span>题量</span>
            <span>时长</span>
            <span>操作</span>
          </div>
          {papersQuery.data.items.map((item) => (
            <div key={item.id} className="data-table__row" style={{ gridTemplateColumns: "1.7fr 1fr 1fr 0.9fr 0.9fr 1fr" }}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.paperType}</p>
              </div>
              <div>
                <strong>{item.courseId}</strong>
                <p>{item.chapterId}</p>
              </div>
              <p>
                {item.stage} / {item.subject}
              </p>
              <p>{item.questionCount} 题</p>
              <p>{item.durationMinutes} 分钟</p>
              <div className="link-row">
                <Link to="/course/$courseId" params={{ courseId: item.courseId }} className="shell-card__link">
                  课程
                </Link>
                <Link to="/exam/$examId" params={{ examId: item.id }} className="shell-card__link">
                  打开
                </Link>
              </div>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
