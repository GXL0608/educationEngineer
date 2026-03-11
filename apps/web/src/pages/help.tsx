import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function HelpPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("学习反馈");
  const [message, setMessage] = useState("");
  const feedbackQuery = useQuery({
    queryKey: ["feedback"],
    queryFn: () => api.getFeedback()
  });
  const feedbackMutation = useMutation({
    mutationFn: () => api.createFeedback({ category, message }),
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["feedback"] });
    }
  });

  if (feedbackQuery.isLoading) {
    return <LoadingState title="帮助中心加载中" detail="正在读取历史反馈和回流状态。" />;
  }

  if (feedbackQuery.isError || !feedbackQuery.data) {
    return <ErrorState title="帮助中心不可用" detail="无法获取反馈回流数据。" />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }
    feedbackMutation.mutate();
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">帮助中心</p>
          <h1>反馈工单与问题回流</h1>
          <p className="course-workspace__body">统一处理学习反馈、宿主异常和内容问题。</p>
          <div className="shell-chip-row">
            <span>{feedbackQuery.data.items.length} 条反馈记录</span>
            <span>{new Set(feedbackQuery.data.items.map((item) => item.category)).size} 个问题类别</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>当前工单量</span>
            <strong>{feedbackQuery.data.items.length}</strong>
            <p>所有反馈都会进入统一回流链路。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="新建反馈" title="提交反馈工单">
        <div className="ticket-board">
          <form className="form-stack" onSubmit={handleSubmit}>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="学习反馈">学习反馈</option>
              <option value="宿主异常">宿主异常</option>
              <option value="内容问题">内容问题</option>
            </select>
            <textarea
              className="text-area"
              value={message}
              placeholder="填写问题描述、出现位置和影响范围"
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="action-row">
              <button type="submit" disabled={feedbackMutation.isPending}>
                提交反馈
              </button>
            </div>
          </form>
          <div className="fact-grid">
            <article className="fact-card">
              <strong>学习反馈</strong>
              <p>用于记录节奏、讲解清晰度、掌握难点和练习体验问题。</p>
            </article>
            <article className="fact-card">
              <strong>宿主异常</strong>
              <p>用于记录 WebView、消息桥、字体和滚动等兼容问题。</p>
            </article>
            <article className="fact-card">
              <strong>内容问题</strong>
              <p>用于记录教材映射、题目答案、章节结构和文献解析问题。</p>
            </article>
          </div>
        </div>
      </PanelShell>

      <PanelShell eyebrow="反馈记录" title="最近工单">
        <div className="stack-table">
          {feedbackQuery.data.items.map((item) => (
            <article key={item.id} className="stack-row">
              <strong>{item.message}</strong>
              <div className="stack-row__meta">
                <span>{item.category}</span>
                <span>{item.status}</span>
                <span>{item.createdAt}</span>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
