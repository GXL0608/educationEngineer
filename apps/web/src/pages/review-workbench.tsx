import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api, ReviewDecisionResponse } from "../lib/api";

export function ReviewWorkbenchPage() {
  const queryClient = useQueryClient();
  const [reviewers, setReviewers] = useState<Record<string, string>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [lastActionNote, setLastActionNote] = useState("");
  const reviewStateQuery = useQuery({
    queryKey: ["import-review-state"],
    queryFn: () => api.getImportReviewState()
  });
  const decisionMutation = useMutation<
    ReviewDecisionResponse,
    Error,
    {
      taskId: string;
      decision: "approved" | "changes_requested";
      reviewer: string;
      notes: string;
      triggerRelease?: boolean;
    }
  >({
    mutationFn: (payload: {
      taskId: string;
      decision: "approved" | "changes_requested";
      reviewer: string;
      notes: string;
      triggerRelease?: boolean;
    }) =>
      payload.decision === "approved"
        ? api.approveImportReview(payload.taskId, {
            reviewer: payload.reviewer,
            notes: payload.notes,
            triggerRelease: payload.triggerRelease
          })
        : api.rejectImportReview(payload.taskId, { reviewer: payload.reviewer, notes: payload.notes }).then((review) => ({
            review,
            releaseTriggered: false,
            releaseSucceeded: false
          })),
    onSuccess: (result, payload) => {
      void queryClient.invalidateQueries({ queryKey: ["import-review-state"] });
      void queryClient.invalidateQueries({ queryKey: ["release-manifest"] });
      if (payload.decision === "approved" && result.releaseTriggered && result.releaseSucceeded && result.releaseManifest) {
        setLastActionNote(
          `审批已通过并触发发布。最新课程数 ${result.releaseManifest.courseCount}，构建时间 ${result.releaseManifest.builtAt}。`
        );
        return;
      }
      if (payload.decision === "approved" && result.releaseTriggered && !result.releaseSucceeded) {
        setLastActionNote(`审批已通过，但发布构建失败：${result.releaseError || "未知错误"}`);
        return;
      }
      if (payload.decision === "approved") {
        setLastActionNote("审批已通过，尚未触发正式发布。");
        return;
      }
      setLastActionNote("审核已退回修改。");
    }
  });
  const releaseBuildMutation = useMutation({
    mutationFn: () => api.triggerReleaseBuild(),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["release-manifest"] });
      setLastActionNote(
        result.releaseSucceeded && result.releaseManifest
          ? `已手动触发发布。最新课程数 ${result.releaseManifest.courseCount}，构建时间 ${result.releaseManifest.builtAt}。`
          : `发布构建失败：${result.releaseError || "未知错误"}`
      );
    }
  });

  if (reviewStateQuery.isLoading) {
    return <LoadingState title="审核工作台加载中" detail="正在读取导入作业和审核任务快照。" />;
  }

  if (reviewStateQuery.isError || !reviewStateQuery.data) {
    return <ErrorState title="审核工作台不可用" detail="无法获取导入审核状态。" />;
  }

  const reviewState = reviewStateQuery.data;

  function resolveReviewer(taskId: string, reviewer?: string | null) {
    return reviewers[taskId] ?? reviewer ?? "A11-reviewer";
  }

  function resolveNotes(taskId: string, notes?: string | null) {
    return notesMap[taskId] ?? notes ?? "";
  }

  function submitDecision(
    taskId: string,
    decision: "approved" | "changes_requested",
    reviewer?: string | null,
    notes?: string | null,
    triggerRelease = false
  ) {
    decisionMutation.mutate({
      taskId,
      decision,
      reviewer: resolveReviewer(taskId, reviewer),
      notes: resolveNotes(taskId, notes),
      triggerRelease
    });
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">审核工作台</p>
          <h1>导入审核与发布</h1>
          <p className="course-workspace__body">处理审核任务、审批动作和正式发布。</p>
          <div className="action-row">
            <button type="button" onClick={() => releaseBuildMutation.mutate()} disabled={releaseBuildMutation.isPending}>
              手动发布最新 approved 内容
            </button>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>待审核任务</span>
            <strong>{reviewState.pendingReviewCount}</strong>
            <p>审核通过后可直接触发发布构建。</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>已完成审核</span>
            <strong>{reviewState.approvedCount}</strong>
            <p>已通过和已退回任务都保留在同一条审核链路中。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="审核概览" title="内容审核与发布指标">
        <section className="metric-grid">
          <article className="metric-card">
            <p>导入作业</p>
            <strong>{reviewState.jobCount}</strong>
          </article>
          <article className="metric-card">
            <p>待审核</p>
            <strong>{reviewState.pendingReviewCount}</strong>
          </article>
          <article className="metric-card">
            <p>已通过</p>
            <strong>{reviewState.approvedCount}</strong>
          </article>
          <article className="metric-card">
            <p>需修改</p>
            <strong>{reviewState.changesRequestedCount}</strong>
          </article>
        </section>
        {decisionMutation.isError ? (
          <p className="status-note status-note--error">审批提交失败，请检查任务状态或审核脚本输出。</p>
        ) : null}
        {releaseBuildMutation.isError ? <p className="status-note status-note--error">手动发布失败，请检查 release build 输出。</p> : null}
        {lastActionNote ? <p className="status-note">{lastActionNote}</p> : null}
      </PanelShell>

      <PanelShell eyebrow="审核任务" title="待处理与已处理审核任务">
        <div className="list-stack">
          {reviewState.reviews.map((item) => (
            <article key={item.id} className="list-card review-card">
              <div className="review-card__header">
                <div>
                  <strong>{item.title}</strong>
                  <p>审核人：{item.reviewer || "未分配"}</p>
                  <p>更新时间：{item.updatedAt}</p>
                </div>
                <span className={`review-status review-status--${item.status}`}>状态：{item.status}</span>
              </div>
              {Array.isArray(item.payload.checklist) ? (
                <div className="tag-row">
                  {item.payload.checklist.map((entry) => (
                    <span key={String(entry)}>{String(entry)}</span>
                  ))}
                </div>
              ) : null}
              <form
                className="form-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitDecision(item.id, "approved", item.reviewer, item.notes);
                }}
              >
                <input
                  className="search-input"
                  value={resolveReviewer(item.id, item.reviewer)}
                  placeholder="审核人"
                  onChange={(event) =>
                    setReviewers((current) => ({
                      ...current,
                      [item.id]: event.target.value
                    }))
                  }
                />
                <textarea
                  className="text-area"
                  value={resolveNotes(item.id, item.notes)}
                  placeholder="输入审核意见，说明通过依据或退回原因"
                  onChange={(event) =>
                    setNotesMap((current) => ({
                      ...current,
                      [item.id]: event.target.value
                    }))
                  }
                />
                <div className="action-row">
                  <button type="submit" disabled={item.status !== "pending" || decisionMutation.isPending}>
                    通过审批
                  </button>
                  <button
                    type="button"
                    disabled={item.status !== "pending" || decisionMutation.isPending}
                    onClick={() => submitDecision(item.id, "approved", item.reviewer, item.notes, true)}
                  >
                    通过并发布
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={item.status !== "pending" || decisionMutation.isPending}
                    onClick={() => submitDecision(item.id, "changes_requested", item.reviewer, item.notes)}
                  >
                    退回修改
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
