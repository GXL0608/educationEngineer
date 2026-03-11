import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function ReviewPage() {
  const queryClient = useQueryClient();
  const reviewQuery = useQuery({
    queryKey: ["user-review-queue"],
    queryFn: () => api.getUserReviewItems()
  });

  const completeMutation = useMutation({
    mutationFn: (reviewId: string) => api.completeReviewItem(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-review-queue"] });
    }
  });

  const snoozeMutation = useMutation({
    mutationFn: (reviewId: string) => api.snoozeReviewItem(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-review-queue"] });
    }
  });

  if (reviewQuery.isLoading) {
    return <LoadingState title="错题与复习加载中" detail="正在获取复习队列和下次复习时间。" />;
  }

  if (reviewQuery.isError || !reviewQuery.data) {
    return <ErrorState title="错题与复习不可用" detail="无法获取复习队列。" />;
  }

  const items = reviewQuery.data.items;

  return (
    <div className="page-stack">
      <PanelShell eyebrow="复习队列" title="错题复盘与强化队列">
        <div className="stack-table">
          {items.map((item) => (
            <article key={item.id ?? item.title} className="stack-row">
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
              <div className="stack-row__meta">
                <span>下次复习 {item.nextReviewAt}</span>
                <span>状态 {item.status ?? "pending"}</span>
                <span>已完成 {item.completedCount ?? 0} 次</span>
              </div>
              <div className="action-row">
                <button
                  type="button"
                  onClick={() => {
                    if (item.id) {
                      completeMutation.mutate(item.id);
                    }
                  }}
                >
                  完成复习
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    if (item.id) {
                      snoozeMutation.mutate(item.id);
                    }
                  }}
                >
                  顺延一天
                </button>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
