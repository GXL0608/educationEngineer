type HeroPanelProps = {
  title: string;
  body: string;
  meta: string[];
};

export function HeroPanel({ title, body, meta }: HeroPanelProps) {
  return (
    <section className="hero-panel">
      <div>
        <p className="eyebrow">Education Engineer Web Module</p>
        <h1>{title}</h1>
        <p className="hero-panel__body">{body}</p>
      </div>
      <div className="hero-panel__meta">
        {meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

