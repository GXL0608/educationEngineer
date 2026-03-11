type LessonTimelineProps = {
  items: ReadonlyArray<{
    label: string;
    time: string;
  }>;
  activeIndex?: number;
  onSelect?: (index: number) => void;
};

export function LessonTimeline({ items, activeIndex = 0, onSelect }: LessonTimelineProps) {
  return (
    <ol className="timeline-list">
      {items.map((item, index) => (
        <li
          key={`${item.time}-${item.label}`}
          className={index === activeIndex ? "timeline-list__item timeline-list__item--active" : "timeline-list__item"}
        >
          <button type="button" onClick={() => onSelect?.(index)}>
            <span>{item.time}</span>
            <p>{item.label}</p>
          </button>
        </li>
      ))}
    </ol>
  );
}
