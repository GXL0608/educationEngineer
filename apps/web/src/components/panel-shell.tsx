import type { ReactNode } from "react";

type PanelShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PanelShell({ eyebrow, title, description, actions, children }: PanelShellProps) {
  return (
    <section className="panel-shell">
      <div className="panel-shell__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {description ? <p className="panel-shell__description">{description}</p> : null}
        </div>
        {actions ? <div className="panel-shell__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
