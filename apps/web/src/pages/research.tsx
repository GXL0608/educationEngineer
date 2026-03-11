import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { FocusTextPanel } from "../components/focus-text-panel";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

type ResearchPageProps = {
  paperId: string;
};

export function ResearchPage({ paperId }: ResearchPageProps) {
  const trackedResearchId = useRef<string | null>(null);
  const researchQuery = useQuery({
    queryKey: ["research", paperId],
    queryFn: () => api.getResearch(paperId)
  });
  const researchData = researchQuery.data?.item;

  useEffect(() => {
    if (!researchData || trackedResearchId.current === researchData.id) {
      return;
    }
    trackedResearchId.current = researchData.id;
    void api
      .trackLearningEvent({
        type: "research_viewed",
        targetId: researchData.id,
        title: researchData.title,
        metadata: { nodeCount: researchData.nodes.length, paragraphCount: researchData.paragraphs.length }
      })
      .catch(() => undefined);
  }, [researchData]);

  if (researchQuery.isLoading) {
    return <LoadingState title="文献工作台加载中" detail="正在获取文献段落和论证结构。" />;
  }

  if (researchQuery.isError || !researchQuery.data) {
    return <ErrorState title="文献工作台不可用" detail="无法获取研究页数据。" />;
  }

  const research = researchQuery.data.item;

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">研究阅读</p>
          <h1>{research.title}</h1>
          <p className="course-workspace__body">把正文、关键概念和论证链整理到同一页面，便于研读和复盘。</p>
          <div className="shell-chip-row">
            <span>{research.paragraphs.length} 段正文</span>
            <span>{research.nodes.length} 个关键概念</span>
            <span>{research.chain.length} 条论证步骤</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>阅读目标</span>
            <strong>提炼论证结构</strong>
            <p>先抓结论和证据，再定位假设与限制条件。</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>产出</span>
            <strong>形成研究笔记</strong>
            <p>把关键概念、证据链和疑问沉淀到个人笔记。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="正文" title="文献正文">
        <FocusTextPanel paragraphs={research.paragraphs} />
      </PanelShell>

      <PanelShell eyebrow="论证结构" title="关键概念与论证链">
        <div className="detail-grid">
          <div className="knowledge-strip">
            <div className="knowledge-strip__nodes">
              {research.nodes.map((node) => (
                <span key={node}>{node}</span>
              ))}
            </div>
            <div className="knowledge-strip__chain">
              {research.chain.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </div>
          <div className="sequence-list">
            {research.chain.map((step, index) => (
              <article key={step} className="sequence-list__item">
                <span className="sequence-list__index">{index + 1}</span>
                <div>
                  <strong>论证步骤 {String(index + 1).padStart(2, "0")}</strong>
                  <p>{step}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PanelShell>

      <PanelShell eyebrow="研读动作" title="本页建议动作">
        <div className="fact-grid">
          <article className="fact-card">
            <strong>先找结论</strong>
            <p>优先确认作者想证明什么，不要一开始就陷在细节里。</p>
          </article>
          <article className="fact-card">
            <strong>再找证据</strong>
            <p>逐条对照链路中的关键证据，看是否支撑结论。</p>
          </article>
          <article className="fact-card">
            <strong>记录限制</strong>
            <p>把假设、局限和可迁移问题整理到笔记与报告里。</p>
          </article>
        </div>
      </PanelShell>
    </div>
  );
}
