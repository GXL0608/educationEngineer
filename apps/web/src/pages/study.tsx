import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FocusTextPanel } from "../components/focus-text-panel";
import { LessonTimeline } from "../components/lesson-timeline";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

type StudyPageProps = {
  lessonId: string;
};

export function StudyPage({ lessonId }: StudyPageProps) {
  const queryClient = useQueryClient();
  const trackedLessonId = useRef<string | null>(null);
  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [voiceRate, setVoiceRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => api.getLesson(lessonId)
  });
  const createNoteMutation = useMutation({
    mutationFn: (payload: { title: string; summary: string; tag: string }) => api.createUserNote(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-notes"] });
    }
  });
  const lessonData = lessonQuery.data?.item;

  useEffect(() => {
    if (!lessonData || trackedLessonId.current === lessonData.id) {
      return;
    }
    trackedLessonId.current = lessonData.id;
    setActiveIndex(0);
    setCompletedIndices([]);
    setIsPlaying(false);
    void api
      .trackLearningEvent({
        type: "lesson_viewed",
        targetId: lessonData.id,
        title: lessonData.title,
        metadata: { paragraphCount: lessonData.paragraphs.length }
      })
      .catch(() => undefined);
  }, [lessonData]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (lessonQuery.isLoading) {
    return <LoadingState title="精读内容加载中" detail="正在同步正文、时间轴和朗读控制。" />;
  }

  if (lessonQuery.isError || !lessonQuery.data) {
    return <ErrorState title="精读内容暂不可用" detail="暂时无法获取正文脚本，请稍后刷新。" />;
  }

  const lesson = lessonQuery.data.item;
  const activeParagraph = lesson.paragraphs[activeIndex] || "";
  const activeTimeline = lesson.timeline[activeIndex];
  const progress = Math.round((completedIndices.length / Math.max(lesson.paragraphs.length, 1)) * 100);
  const recallPrompt = useMemo(() => {
    if (!activeParagraph) {
      return "先选择一段，再尝试复述。";
    }
    const focus = activeTimeline?.label || `第 ${activeIndex + 1} 段`;
    return `不看原文，用自己的话解释“${focus}”在这一段中到底说明了什么，以及它和上一段的关系。`;
  }, [activeIndex, activeParagraph, activeTimeline?.label]);

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      utteranceQueue.current = [];
    }
    setIsPlaying(false);
  }

  function playParagraphs(startIndex: number, mode: "single" | "all") {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      return;
    }

    stopSpeech();
    const textSegments = mode === "all" ? lesson.paragraphs.slice(startIndex) : [lesson.paragraphs[startIndex]];
    const queue = textSegments.map((text, offset) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceRate;
      utterance.lang = "zh-CN";
      utterance.onstart = () => {
        setIsPlaying(true);
        setActiveIndex(startIndex + offset);
      };
      utterance.onend = () => {
        setCompletedIndices((current) =>
          current.includes(startIndex + offset) ? current : [...current, startIndex + offset]
        );
        if (offset === textSegments.length - 1) {
          setIsPlaying(false);
        }
      };
      return utterance;
    });

    utteranceQueue.current = queue;
    queue.forEach((utterance) => window.speechSynthesis.speak(utterance));
  }

  function markCurrentComplete() {
    setCompletedIndices((current) => (current.includes(activeIndex) ? current : [...current, activeIndex]));
    void api
      .trackLearningEvent({
        type: "lesson_checkpointed",
        targetId: lesson.id,
        title: `${lesson.title} 第 ${activeIndex + 1} 段`,
        metadata: { index: activeIndex + 1 }
      })
      .catch(() => undefined);
  }

  function saveCurrentParagraph() {
    createNoteMutation.mutate({
      title: `${lesson.title} · 第 ${String(activeIndex + 1).padStart(2, "0")} 段摘录`,
      summary: activeParagraph,
      tag: "精读摘录"
    });
  }

  return (
    <div className="page-stack">
      <section className="course-workspace">
        <div className="course-workspace__main">
          <p className="eyebrow">精读学习</p>
          <h1>{lesson.title}</h1>
          <p className="course-workspace__body">这一页的目标不是浏览，而是按段理解、朗读、标记重点，并把关键内容沉淀为笔记。</p>
          <div className="shell-chip-row">
            <span>{lesson.paragraphs.length} 段精读脚本</span>
            <span>{lesson.timeline.length} 个节奏节点</span>
            <span>{progress}% 已完成</span>
          </div>
          <div className="reader-toolbar">
            <div className="reader-toolbar__group">
              <button type="button" className="button-secondary" onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}>
                上一段
              </button>
              <button type="button" onClick={() => playParagraphs(activeIndex, "single")}>
                朗读当前段
              </button>
              <button type="button" className="button-secondary" onClick={() => playParagraphs(activeIndex, "all")}>
                从当前段继续朗读
              </button>
              <button type="button" className="button-secondary" onClick={stopSpeech} disabled={!isPlaying}>
                停止朗读
              </button>
              <button type="button" className="button-secondary" onClick={() => setActiveIndex((current) => Math.min(lesson.paragraphs.length - 1, current + 1))}>
                下一段
              </button>
            </div>
            <label className="slider-inline">
              <span>朗读速度 {voiceRate.toFixed(1)}x</span>
              <input type="range" min="0.8" max="1.4" step="0.1" value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))} />
            </label>
          </div>
        </div>
        <aside className="course-workspace__side">
          <article className="workspace-spotlight">
            <span>当前段落</span>
            <strong>{activeTimeline?.label || `第 ${activeIndex + 1} 段`}</strong>
            <p>
              {activeParagraph.slice(0, 80)}
              {activeParagraph.length > 80 ? "..." : ""}
            </p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>本段输出</span>
            <strong>理解 + 摘录 + 回忆</strong>
            <p>每一段都应该能复述、能摘录、能进入下一步概念理解或训练。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="学习控制台" title="时间轴、正文和多模态控制">
        <div className="split-grid">
          <LessonTimeline items={lesson.timeline} activeIndex={activeIndex} onSelect={setActiveIndex} />
          <FocusTextPanel paragraphs={lesson.paragraphs} activeIndex={activeIndex} completedIndices={completedIndices} onSelect={setActiveIndex} />
        </div>
      </PanelShell>

      <PanelShell eyebrow="理解转化" title="把当前段转成你的知识资产">
        <div className="detail-grid">
          <article className="fact-card">
            <p className="eyebrow">本段重点</p>
            <strong>{activeTimeline?.label || `第 ${activeIndex + 1} 段`}</strong>
            <p>{activeParagraph}</p>
          </article>
          <article className="fact-card">
            <p className="eyebrow">主动回忆</p>
            <strong>不看原文先复述</strong>
            <p>{recallPrompt}</p>
          </article>
          <article className="fact-card">
            <p className="eyebrow">下一动作</p>
            <strong>完成理解记录</strong>
            <p>把关键段摘录下来，再继续下一段；一轮精读结束后进入概念讲解或练习。</p>
            <div className="action-row">
              <button type="button" onClick={markCurrentComplete}>
                我已理解这一段
              </button>
              <button type="button" className="button-secondary" onClick={saveCurrentParagraph} disabled={createNoteMutation.isPending}>
                保存到笔记
              </button>
            </div>
            {createNoteMutation.isSuccess ? <p className="status-note">当前段摘录已写入知识卡片。</p> : null}
          </article>
        </div>
      </PanelShell>
    </div>
  );
}
