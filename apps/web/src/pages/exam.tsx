import { useEffect, useRef, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";
import { splitTextIntoSegments } from "../lib/cognitive-text";

type ExamPageProps = {
  examId: string;
};

type Clause = {
  id: string;
  questionId: string;
  text: string;
};

export function ExamPage({ examId }: ExamPageProps) {
  const queryClient = useQueryClient();
  const trackedExamId = useRef<string | null>(null);
  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const draggingRef = useRef(false);
  const startedAt = useRef(Date.now());
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState("0");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [activeClauseId, setActiveClauseId] = useState<string | null>(null);
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([]);
  const examQuery = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => api.getExam(examId)
  });
  const paperQuery = useQuery({
    queryKey: ["paper", examId],
    queryFn: () => api.getPaper(examId)
  });
  const paperIndexQuery = useQuery({
    queryKey: ["k12-papers"],
    queryFn: () => api.getPapers({ stage: "K12" })
  });
  const submitExamMutation = useMutation({
    mutationFn: (payload: {
      examId: string;
      title: string;
      score: number;
      maxScore: number;
      durationMinutes: number;
      sectionCount: number;
      weakSections: string[];
    }) => api.createExamResult(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-report"] });
      void queryClient.invalidateQueries({ queryKey: ["user-events"] });
    }
  });
  const examData = examQuery.data?.item;
  const paperData = paperQuery.data?.item;
  const questionQueries = useQueries({
    queries: (paperData?.questionIds || []).map((questionId) => ({
      queryKey: ["question-asset", questionId],
      queryFn: () => api.getQuestion(questionId)
    }))
  });

  useEffect(() => {
    function stopDragSelection() {
      draggingRef.current = false;
    }

    window.addEventListener("mouseup", stopDragSelection);
    return () => {
      window.removeEventListener("mouseup", stopDragSelection);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!examData || trackedExamId.current === examData.id) {
      return;
    }
    trackedExamId.current = examData.id;
    startedAt.current = Date.now();
    setStarted(false);
    setSubmitted(false);
    setIsPlaying(false);
    setScore("0");
    setAnswers({});
    setActiveQuestionId(null);
    setActiveClauseId(null);
    setSelectedClauseIds([]);
    void api
      .trackLearningEvent({
        type: "exam_viewed",
        targetId: examData.id,
        title: examData.title,
        metadata: { durationMinutes: examData.durationMinutes, sectionCount: examData.sections.length }
      })
      .catch(() => undefined);
  }, [examData]);

  if (
    examQuery.isLoading ||
    paperQuery.isLoading ||
    paperIndexQuery.isLoading ||
    questionQueries.some((query) => query.isLoading)
  ) {
    return <LoadingState title="考题加载中" detail="正在同步试卷头、题面、答案卡和讲评资源。" />;
  }

  if (
    examQuery.isError ||
    paperQuery.isError ||
    paperIndexQuery.isError ||
    questionQueries.some((query) => query.isError) ||
    !examQuery.data ||
    !paperQuery.data ||
    !paperIndexQuery.data
  ) {
    return <ErrorState title="考题暂不可用" detail="暂时无法加载试卷内容，请稍后刷新。" />;
  }

  const exam = examQuery.data.item;
  const paper = paperQuery.data.item;
  const paperIndex = paperIndexQuery.data.items;
  const questions = questionQueries.map((query) => query.data?.item).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const instructionList = paper.instructions && paper.instructions.length > 0 ? paper.instructions : ["请先审题，再作答。"];
  const headerTitle = [paper.header?.schoolYear, paper.header?.grade, paper.header?.subjectLabel].filter(Boolean).join(" ");
  const headerSubtitle = [paper.header?.volume, paper.header?.examType].filter(Boolean).join(" / ");
  const clauseRegistry: Clause[] = questions.flatMap((question) => {
    const blocks = [...splitTextIntoSegments(question.material || ""), ...splitTextIntoSegments(question.stem)];
    return blocks.map((text, index) => ({
      id: `${question.id}-clause-${index + 1}`,
      questionId: question.id,
      text
    }));
  });
  const sectionQuestionMap = new Map(paper.sections.map((section) => [section.id, questions.filter((question) => section.questionIds.includes(question.id))]));
  const currentQuestion = questions.find((item) => item.id === activeQuestionId) || questions[0] || null;
  const currentClauses = clauseRegistry.filter((item) => item.questionId === (activeQuestionId || currentQuestion?.id));
  const selectedClauses = clauseRegistry.filter((item) => selectedClauseIds.includes(item.id));
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));

  const objectiveScore = questions.reduce((sum, question) => {
    if (question.choices.length === 0) {
      return sum;
    }
    return answers[question.id] === question.answer ? sum + (question.score || 0) : sum;
  }, 0);

  const questionStatus = new Map(
    questions.map((question) => {
      if (!submitted) {
        return [question.id, answers[question.id] ? "answered" : "pending"] as const;
      }
      if (question.choices.length > 0) {
        return [question.id, answers[question.id] === question.answer ? "correct" : "weak"] as const;
      }
      return [question.id, answers[question.id]?.trim() ? "answered" : "weak"] as const;
    })
  );

  const weakSections = paper.sections
    .filter((section) => (sectionQuestionMap.get(section.id) || []).some((question) => questionStatus.get(question.id) === "weak"))
    .map((section) => section.title);

  const completedSections = paper.sections.filter((section) =>
    (sectionQuestionMap.get(section.id) || []).every((question) => questionStatus.get(question.id) !== "pending")
  ).length;

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      utteranceQueue.current = [];
    }
    setIsPlaying(false);
  }

  function playClauses(clauses: Clause[]) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined" || clauses.length === 0) {
      return;
    }

    stopSpeech();
    const queue = clauses.map((item, index) => {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = voiceRate;
      utterance.lang = "zh-CN";
      utterance.onstart = () => {
        setIsPlaying(true);
        setActiveQuestionId(item.questionId);
        setActiveClauseId(item.id);
      };
      utterance.onend = () => {
        if (index === clauses.length - 1) {
          setIsPlaying(false);
        }
      };
      return utterance;
    });

    utteranceQueue.current = queue;
    queue.forEach((utterance) => window.speechSynthesis.speak(utterance));
  }

  function handleClauseMouseDown(clauseId: string, questionId: string) {
    draggingRef.current = true;
    setActiveQuestionId(questionId);
    setActiveClauseId(clauseId);
    setSelectedClauseIds((current) => (current.includes(clauseId) ? current : [...current, clauseId]));
  }

  function handleClauseMouseEnter(clauseId: string) {
    if (!draggingRef.current) {
      return;
    }
    setSelectedClauseIds((current) => (current.includes(clauseId) ? current : [...current, clauseId]));
  }

  function submitForReview() {
    setSubmitted(true);
    setScore(String(objectiveScore));
  }

  function saveExamResult() {
    submitExamMutation.mutate({
      examId: exam.id,
      title: exam.title,
      score: Number(score) || 0,
      maxScore: paper.fullScore || exam.fullScore || 100,
      durationMinutes: elapsedMinutes,
      sectionCount: paper.sections.length,
      weakSections
    });
  }

  return (
    <div className="page-stack">
      <section className="exam-stage">
        <article className="exam-stage__main">
          <header className="exam-sheet-cover">
            <div>
              <p className="eyebrow">考题学习</p>
              <strong>{headerTitle || "K12 公开样题学习卷"}</strong>
              <h1>{headerSubtitle || exam.title}</h1>
              <p>
                {paper.chapter.title} · 考试时间 {paper.durationMinutes} 分钟 · 满分 {paper.fullScore || exam.fullScore || 100} 分
              </p>
            </div>
            <div className="shell-chip-row shell-chip-row--compact">
              <span>{paper.subject}</span>
              <span>{paper.sections.length} 个大题区</span>
              <span>{started ? `已开始 ${elapsedMinutes} 分钟` : "未开始作答"}</span>
            </div>
          </header>

          <div className="exam-paper-switcher">
            {paperIndex.map((item) => (
              <a
                key={item.id}
                href={`/exam/${item.id}`}
                className={item.id === examId ? "exam-paper-switcher__item exam-paper-switcher__item--active" : "exam-paper-switcher__item"}
              >
                <strong>{item.title}</strong>
                <span>{item.durationMinutes} 分钟</span>
              </a>
            ))}
          </div>

          <section className="exam-sheet-card">
            <div className="exam-sheet-card__block">
              <strong>作答说明</strong>
              <ol className="instruction-list">
                {instructionList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              {paper.answerSheetRules && paper.answerSheetRules.length > 0 ? (
                <ul className="instruction-list instruction-list--secondary">
                  {paper.answerSheetRules.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {paper.sections.map((section, sectionIndex) => (
              <section key={section.id} className="exam-sheet-card__section">
                <div className="exam-sheet-card__section-head">
                  <div>
                    <strong>{section.title}</strong>
                    <p>
                      第 {sectionIndex + 1} 大题 · {section.targetCount} 题
                      {section.score ? ` · ${section.score} 分` : ""}
                    </p>
                    {section.note ? <p>{section.note}</p> : null}
                  </div>
                  {section.answerMode ? <span>{section.answerMode}</span> : null}
                </div>

                {(sectionQuestionMap.get(section.id) || []).map((question, questionIndex) => {
                  const clauses = clauseRegistry.filter((item) => item.questionId === question.id);
                  const status = questionStatus.get(question.id) || "pending";
                  return (
                    <article
                      key={question.id}
                      className={activeQuestionId === question.id ? "exam-sheet-question exam-sheet-question--active" : "exam-sheet-question"}
                    >
                      <div className="exam-sheet-question__header">
                        <div>
                          <p className="eyebrow">
                            第 {sectionIndex + 1}-{questionIndex + 1} 题
                            {question.sourceLabel ? ` · ${question.sourceLabel}` : ""}
                          </p>
                          <strong>{question.type}</strong>
                        </div>
                        <div className="shell-chip-row shell-chip-row--compact">
                          {question.score ? <span>{question.score} 分</span> : null}
                          <span>{status === "correct" ? "正确" : status === "weak" ? "需讲评" : status === "answered" ? "已作答" : "待作答"}</span>
                          <button type="button" className="button-secondary" onClick={() => playClauses(clauses)}>
                            朗读本题
                          </button>
                        </div>
                      </div>

                      {question.material ? (
                        <div className="question-material">
                          {splitTextIntoSegments(question.material).map((item) => (
                            <p key={item}>{item}</p>
                          ))}
                        </div>
                      ) : null}

                      <div className="sentence-stream sentence-stream--exam">
                        {clauses.map((clause) => {
                          const isActive = activeClauseId === clause.id;
                          const isSelected = selectedClauseIds.includes(clause.id);
                          return (
                            <button
                              key={clause.id}
                              type="button"
                              className={
                                isActive
                                  ? "sentence-chip sentence-chip--active"
                                  : isSelected
                                    ? "sentence-chip sentence-chip--selected"
                                    : "sentence-chip"
                              }
                              onMouseDown={() => handleClauseMouseDown(clause.id, question.id)}
                              onMouseEnter={() => handleClauseMouseEnter(clause.id)}
                              onClick={() => {
                                setActiveQuestionId(question.id);
                                setActiveClauseId(clause.id);
                                setSelectedClauseIds((current) => (current.includes(clause.id) ? current : [...current, clause.id]));
                              }}
                            >
                              {clause.text}
                            </button>
                          );
                        })}
                      </div>

                      {question.choices.length > 0 ? (
                        <div className="choice-list">
                          {question.choices.map((choice) => (
                            <label key={choice} className={answers[question.id] === choice ? "choice-item choice-item--active" : "choice-item"}>
                              <input
                                type="radio"
                                name={question.id}
                                checked={answers[question.id] === choice}
                                onChange={() => {
                                  setStarted(true);
                                  setActiveQuestionId(question.id);
                                  setAnswers((current) => ({
                                    ...current,
                                    [question.id]: choice
                                  }));
                                }}
                              />
                              <span>{choice}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="text-area text-area--exam"
                          value={answers[question.id] || ""}
                          placeholder="在此写出作答过程"
                          onFocus={() => {
                            setStarted(true);
                            setActiveQuestionId(question.id);
                          }}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: event.target.value
                            }))
                          }
                        />
                      )}

                      {submitted ? (
                        <div className="exam-answer-hint">
                          <p>参考答案：{question.answer}</p>
                          <p>讲评重点：{question.analysis}</p>
                          {question.rubric ? <p>给分说明：{question.rubric}</p> : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </section>
            ))}
          </section>
        </article>

        <aside className="exam-stage__aside">
          <div className="reader-stage__card">
            <strong>作答进度</strong>
            <div className="exam-answer-grid">
              {questions.map((question, index) => {
                const status = questionStatus.get(question.id) || "pending";
                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`exam-answer-grid__item exam-answer-grid__item--${status}`}
                    onClick={() => setActiveQuestionId(question.id)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <p className="reader-hint">绿色表示客观题正确，红色表示需要讲评，灰色表示未完成。</p>
          </div>

          <div className="reader-stage__card">
            <strong>多模态辅助</strong>
            <div className="reader-action-group">
              <button type="button" onClick={() => playClauses(selectedClauses.length > 0 ? selectedClauses : currentClauses)}>
                朗读当前重点
              </button>
              <button type="button" className="button-secondary" onClick={stopSpeech} disabled={!isPlaying}>
                停止朗读
              </button>
              <button type="button" className="button-secondary" onClick={() => setSelectedClauseIds([])}>
                清空标记
              </button>
            </div>
            <label className="slider-inline">
              <span>朗读速度 {voiceRate.toFixed(1)}x</span>
              <input type="range" min="0.8" max="1.4" step="0.1" value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))} />
            </label>
            <p className="reader-hint">点击或拖动题干句子，可把关键条件高亮出来，再跟着语音复核题意。</p>
          </div>

          <div className="reader-stage__card">
            <strong>已标记条件</strong>
            {selectedClauses.length > 0 ? (
              <div className="reader-selection-list">
                {selectedClauses.map((item) => (
                  <p key={item.id}>{item.text}</p>
                ))}
              </div>
            ) : (
              <p>还没有重点条件。可在题干中拖动滑选研究对象、约束条件和关键词。</p>
            )}
          </div>

          <div className="reader-stage__card">
            <strong>交卷与讲评</strong>
            <p>客观题自动核分：{objectiveScore} 分</p>
            <p>已完成 {completedSections}/{paper.sections.length} 个大题区</p>
            {!submitted ? (
              <button type="button" onClick={submitForReview}>
                交卷并进入讲评
              </button>
            ) : (
              <>
                <label className="slider-inline">
                  <span>最终卷面分</span>
                  <input className="search-input" type="number" min="0" max={paper.fullScore || exam.fullScore || 100} value={score} onChange={(event) => setScore(event.target.value)} />
                </label>
                <p>{weakSections.length > 0 ? `薄弱大题：${weakSections.join(" / ")}` : "当前无明显薄弱大题"}</p>
                <button type="button" onClick={saveExamResult} disabled={submitExamMutation.isPending}>
                  保存本次卷面结果
                </button>
                {submitExamMutation.isSuccess ? <p className="status-note">考试结果已写入学习报告。</p> : null}
              </>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
