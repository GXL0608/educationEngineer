import type { ReactNode } from "react";

type QuestionCardProps = {
  prompt: string;
  answer: string;
  focus: string;
  footer?: ReactNode;
};

export function QuestionCard({ prompt, answer, focus, footer }: QuestionCardProps) {
  return (
    <article className="question-card">
      <p className="question-card__focus">{focus}</p>
      <h3>{prompt}</h3>
      <p>{answer}</p>
      {footer ? <div className="question-card__footer">{footer}</div> : null}
    </article>
  );
}
