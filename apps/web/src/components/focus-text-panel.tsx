type FocusTextPanelProps = {
  paragraphs: readonly string[];
  activeIndex?: number;
  completedIndices?: readonly number[];
  onSelect?: (index: number) => void;
};

export function FocusTextPanel({ paragraphs, activeIndex = 0, completedIndices = [], onSelect }: FocusTextPanelProps) {
  return (
    <div className="focus-text-panel">
      {paragraphs.map((paragraph, index) => (
        <button
          key={paragraph}
          type="button"
          className={[
            "focus-text-panel__paragraph",
            index === activeIndex ? "focus-text-panel__paragraph--active" : "",
            completedIndices.includes(index) ? "focus-text-panel__paragraph--complete" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelect?.(index)}
        >
          <span className="focus-text-panel__index">{String(index + 1).padStart(2, "0")}</span>
          <span>{paragraph}</span>
        </button>
      ))}
    </div>
  );
}
