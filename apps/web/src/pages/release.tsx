import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../components/metric-card";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function ReleasePage() {
  const releaseQuery = useQuery({
    queryKey: ["release-manifest"],
    queryFn: () => api.getReleaseManifest()
  });

  if (releaseQuery.isLoading) {
    return <LoadingState title="发布中心加载中" detail="正在读取最新课程宇宙发布清单。" />;
  }

  if (releaseQuery.isError || !releaseQuery.data) {
    return <ErrorState title="发布中心不可用" detail="无法获取最新发布清单。" />;
  }

  const release = releaseQuery.data;

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">发布中心</p>
          <h1>课程与资产发布明细</h1>
          <p className="course-workspace__body">查看最新发布版本、课程资产数量和已入库内容。</p>
          <div className="shell-chip-row">
            <span>{release.catalogPath}</span>
            <span>{release.manifestPath}</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>最新发布时间</span>
            <strong>{release.builtAt}</strong>
            <p>审核通过的内容会在发布构建后进入正式目录。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="发布清单" title="课程宇宙 Release Manifest">
        <section className="metric-grid">
          <MetricCard label="课程数" value={String(release.courseCount)} />
          <MetricCard label="题目数" value={String(release.questionCount)} />
          <MetricCard label="试卷数" value={String(release.paperCount)} />
          <MetricCard label="已发布导入" value={String(release.approvedImportCount)} />
        </section>
        <div className="list-stack">
          {release.approvedImports.map((item) => (
            <article key={item.courseId} className="list-card">
              <strong>{item.title}</strong>
              <p>
                {item.stage} / {item.subject} / source: {item.sourceName}
              </p>
              <div className="link-row">
                <Link to="/course/$courseId" params={{ courseId: item.courseId }}>
                  进入课程
                </Link>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
