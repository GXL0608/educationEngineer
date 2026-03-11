type KnowledgeStripProps = {
  nodes: readonly string[];
  chain: readonly string[];
};

export function KnowledgeStrip({ nodes, chain }: KnowledgeStripProps) {
  return (
    <div className="knowledge-strip">
      <div className="knowledge-strip__nodes">
        {nodes.map((node) => (
          <span key={node}>{node}</span>
        ))}
      </div>
      <div className="knowledge-strip__chain">
        {chain.map((step) => (
          <p key={step}>{step}</p>
        ))}
      </div>
    </div>
  );
}

