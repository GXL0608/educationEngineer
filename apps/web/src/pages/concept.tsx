import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

type ConceptPageProps = {
  conceptId: string;
};

export function ConceptPage({ conceptId }: ConceptPageProps) {
  const queryClient = useQueryClient();
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const conceptQuery = useQuery({
    queryKey: ["concept", conceptId],
    queryFn: () => api.getConcept(conceptId)
  });
  const createNoteMutation = useMutation({
    mutationFn: (payload: { title: string; summary: string; tag: string }) => api.createUserNote(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-notes"] });
    }
  });

  if (conceptQuery.isLoading) {
    return <LoadingState title="概念讲解加载中" detail="正在同步概念节点、关系链和学习提示。" />;
  }

  if (conceptQuery.isError || !conceptQuery.data) {
    return <ErrorState title="概念讲解暂不可用" detail="暂时无法获取概念结构，请稍后刷新。" />;
  }

  const concept = conceptQuery.data.item;
  const activeNode = concept.nodes[activeNodeIndex] || concept.nodes[0];
  const activeStep = concept.chain[activeNodeIndex] || concept.chain[0];
  const recallQuestions = [
    `请解释“${activeNode}”的定义和适用边界。`,
    `如果只允许你保留一句话，你会怎么描述“${activeNode}”？`,
    `它和上一个节点之间的因果或推导关系是什么？`
  ];

  return (
    <div className="page-stack">
      <section className="course-workspace">
        <div className="course-workspace__main">
          <p className="eyebrow">概念讲解</p>
          <h1>{concept.title}</h1>
          <p className="course-workspace__body">这一页不只是看图，而是把概念拆成节点、关系和推导步骤，再转成你自己的理解和记忆。</p>
          <div className="shell-chip-row">
            <span>{concept.nodes.length} 个核心节点</span>
            <span>{concept.chain.length} 条推导步骤</span>
            <span>可直接沉淀为概念卡</span>
          </div>
          <div className="action-row">
            <button
              type="button"
              onClick={() =>
                createNoteMutation.mutate({
                  title: `${concept.title} · ${activeNode}`,
                  summary: activeStep,
                  tag: "概念卡"
                })
              }
            >
              记录当前概念卡
            </button>
            <Link to="/notes" className="shell-action-link">
              打开知识卡片
            </Link>
          </div>
        </div>
        <aside className="course-workspace__side">
          <article className="workspace-spotlight">
            <span>当前节点</span>
            <strong>{activeNode}</strong>
            <p>{activeStep}</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>建议动作</span>
            <strong>先看链路再做题</strong>
            <p>先完整过一遍推导链，再进入训练和错题复盘。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="概念画布" title="围绕当前概念建立结构感">
        <div className="concept-canvas">
          <div className="concept-canvas__nodes">
            {concept.nodes.map((node, index) => (
              <button
                key={node}
                type="button"
                className={index === activeNodeIndex ? "concept-node concept-node--active" : "concept-node"}
                onClick={() => setActiveNodeIndex(index)}
              >
                <span>节点 {String(index + 1).padStart(2, "0")}</span>
                <strong>{node}</strong>
              </button>
            ))}
          </div>
          <article className="concept-focus">
            <p className="eyebrow">当前概念</p>
            <strong>{activeNode}</strong>
            <p>{activeStep}</p>
            {createNoteMutation.isSuccess ? <p className="status-note">当前概念已经写入知识卡片。</p> : null}
          </article>
        </div>
      </PanelShell>

      <PanelShell eyebrow="推导链" title="从定义到迁移的逻辑链">
        <div className="sequence-list">
          {concept.chain.map((step, index) => (
            <article key={step} className="sequence-list__item">
              <span className="sequence-list__index">{index + 1}</span>
              <div>
                <strong>步骤 {String(index + 1).padStart(2, "0")}</strong>
                <p>{step}</p>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="主动回忆" title="用自己的话把概念讲出来">
        <div className="card-grid card-grid--wide">
          {recallQuestions.map((question) => (
            <article key={question} className="stage-card">
              <strong>{question}</strong>
              <p>先口头回答，再决定是否进入笔记或练习，把理解真正固定下来。</p>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
