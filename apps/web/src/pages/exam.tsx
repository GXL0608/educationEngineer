import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

type ExamPageProps = {
  examId: string;
};

export function ExamPage({ examId }: ExamPageProps) {
  const queryClient = useQueryClient();
  const trackedExamId = useRef<string | null>(null);
  const startedAt = useRef(Date.now());
  const [score, setScore] = useState("80");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [weakSections, setWeakSections] = useState<Record<string, boolean>>({});
  const examQuery = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => api.getExam(examId)
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
  const parsedScore = Number(score) || 0;
  const parsedDuration = Number(durationMinutes) || Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
  const accuracy = Math.max(0, Math.min(100, parsedScore));
  const weakSectionList = examData?.sections.filter((section) => weakSections[section]) ?? [];

  useEffect(() => {
    if (!examData || trackedExamId.current === examData.id) {
      return;
    }
    trackedExamId.current = examData.id;
    startedAt.current = Date.now();
    setScore("80");
    setDurationMinutes(String(examData.durationMinutes));
    setWeakSections({});
    void api
      .trackLearningEvent({
        type: "exam_viewed",
        targetId: examData.id,
        title: examData.title,
        metadata: { durationMinutes: examData.durationMinutes, sectionCount: examData.sections.length }
      })
      .catch(() => undefined);
  }, [examData]);

  if (examQuery.isLoading) {
    return <LoadingState title="试卷加载中" detail="正在获取试卷结构和考试配置。" />;
  }

  if (examQuery.isError || !examQuery.data) {
    return <ErrorState title="试卷不可用" detail="无法获取试卷内容。" />;
  }

  const exam = examQuery.data.item;

  function submitExamResult() {
    if (!exam) {
      return;
    }
    submitExamMutation.mutate({
      examId: exam.id,
      title: exam.title,
      score: Math.max(0, Math.min(100, parsedScore)),
      maxScore: 100,
      durationMinutes: parsedDuration,
      sectionCount: exam.sections.length,
      weakSections: weakSectionList
    });
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">试卷考试页</p>
          <h1>{exam.title}</h1>
          <p className="course-workspace__body">考试页不仅记录得分，还要记录用时、薄弱章节和结果证据，让考试真正进入学习诊断闭环。</p>
          <div className="shell-chip-row">
            <span>{exam.durationMinutes} 分钟考试</span>
            <span>{exam.sections.length} 个结构板块</span>
            <span>结果会进入课程掌握度模型</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>当前得分率</span>
            <strong>{accuracy}%</strong>
            <p>分数和用时会作为考试结果证据写入用户学习报告。</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>已标记薄弱章节</span>
            <strong>{weakSectionList.length}</strong>
            <p>{weakSectionList.length === 0 ? "先完成模拟，再标记表现不稳定的章节。" : weakSectionList.join(" / ")}</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="考试结构" title="试卷结构与薄弱章节标记" description={`考试时长 ${exam.durationMinutes} 分钟`}>
        <div className="list-stack">
          {exam.sections.map((section) => (
            <article key={section} className="list-card">
              <strong>{section}</strong>
              <p>完成模拟后可把本节标记为薄弱，结果会进入学习报告。</p>
              <div className="action-row">
                <button
                  type="button"
                  className={weakSections[section] ? "button-secondary chip-button chip-button--active" : "button-secondary chip-button"}
                  onClick={() =>
                    setWeakSections((current) => ({
                      ...current,
                      [section]: !current[section]
                    }))
                  }
                >
                  {weakSections[section] ? "已标记薄弱" : "标记为薄弱"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="考试结果提交" title="得分、用时与结果回流" description="提交后会更新考试结果、掌握度模型和下一步建议。">
        <div className="card-grid">
          <article className="course-card">
            <strong>考试得分</strong>
            <input className="search-input" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} />
          </article>
          <article className="course-card">
            <strong>用时（分钟）</strong>
            <input
              className="search-input"
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </article>
        </div>
        <section className="metric-grid">
          <article className="metric-card">
            <p>得分率</p>
            <strong>{accuracy}%</strong>
          </article>
          <article className="metric-card">
            <p>薄弱章节</p>
            <strong>{weakSectionList.length === 0 ? "暂无" : weakSectionList.join(" / ")}</strong>
          </article>
        </section>
        {submitExamMutation.isSuccess ? <p className="status-note">考试结果已写入学习报告。</p> : null}
        <div className="action-row">
          <button type="button" disabled={submitExamMutation.isPending} onClick={submitExamResult}>
            提交考试结果
          </button>
        </div>
      </PanelShell>
    </div>
  );
}
