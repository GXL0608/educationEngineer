import { PanelShell } from "./panel-shell";

type QueryStateProps = {
  title: string;
  detail: string;
};

export function LoadingState({ title, detail }: QueryStateProps) {
  return (
    <PanelShell title={title} description={detail}>
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card skeleton-card--wide" />
      </div>
    </PanelShell>
  );
}

export function ErrorState({ title, detail }: QueryStateProps) {
  return (
    <PanelShell title={title}>
      <div className="page-message page-message--error">
        <strong>当前内容还没有准备完成</strong>
        <p>{detail}</p>
      </div>
    </PanelShell>
  );
}
