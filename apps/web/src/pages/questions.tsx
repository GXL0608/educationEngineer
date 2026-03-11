import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function QuestionsPage() {
  const questionsQuery = useQuery({
    queryKey: ["questions"],
    queryFn: () => api.getQuestions()
  });

  if (questionsQuery.isLoading) {
    return <LoadingState title="题库总览加载中" detail="正在汇总当前已发布题目资产。" />;
  }

  if (questionsQuery.isError || !questionsQuery.data) {
    return <ErrorState title="题库总览不可用" detail="无法获取题目资产清单。" />;
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">题库中心</p>
          <h1>正式题库资产</h1>
          <p className="course-workspace__body">查看课程、章节、知识点和题型维度的正式题目资产。</p>
          <div className="shell-chip-row">
            <span>{questionsQuery.data.items.length} 道已发布题目</span>
            <span>{new Set(questionsQuery.data.items.map((item) => item.courseId)).size} 门课程关联</span>
            <span>{new Set(questionsQuery.data.items.map((item) => item.stage)).size} 个学段覆盖</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>题目资产视角</span>
            <strong>课程 / 章节 / 知识点</strong>
            <p>每道题都保留完整归属关系，便于课程训练和组卷。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="题库资产库" title="已发布题目资产">
        <div className="data-table">
          <div className="data-table__header" style={{ gridTemplateColumns: "2fr 1.1fr 1fr 1.1fr 0.8fr 0.8fr" }}>
            <span>题目</span>
            <span>课程 / 章节</span>
            <span>知识点</span>
            <span>学段 / 学科</span>
            <span>类型</span>
            <span>操作</span>
          </div>
          {questionsQuery.data.items.map((item) => (
            <div key={item.id} className="data-table__row" style={{ gridTemplateColumns: "2fr 1.1fr 1fr 1.1fr 0.8fr 0.8fr" }}>
              <div>
                <strong>{item.stem}</strong>
                <p>{item.difficulty}</p>
              </div>
              <div>
                <strong>{item.courseId}</strong>
                <p>{item.chapterId}</p>
              </div>
              <p>{item.knowledgePoints.join(" / ")}</p>
              <p>
                {item.stage} / {item.subject}
              </p>
              <p>{item.type}</p>
              <Link to="/course/$courseId" params={{ courseId: item.courseId }} className="shell-card__link">
                进入课程
              </Link>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
