import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api } from "../lib/api";

export function NotesPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tag, setTag] = useState("个人笔记");
  const notesQuery = useQuery({
    queryKey: ["user-notes"],
    queryFn: () => api.getUserNotes()
  });

  const createNoteMutation = useMutation({
    mutationFn: () => api.createUserNote({ title, summary, tag }),
    onSuccess: () => {
      setTitle("");
      setSummary("");
      setTag("个人笔记");
      void queryClient.invalidateQueries({ queryKey: ["user-notes"] });
    }
  });

  if (notesQuery.isLoading) {
    return <LoadingState title="知识卡加载中" detail="正在获取摘录、术语卡和总结卡。" />;
  }

  if (notesQuery.isError || !notesQuery.data) {
    return <ErrorState title="知识卡不可用" detail="无法获取笔记和知识卡片。" />;
  }

  const notes = notesQuery.data.systemItems;
  const userNotes = notesQuery.data.userItems;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !summary.trim()) {
      return;
    }
    createNoteMutation.mutate();
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">知识库</p>
          <h1>笔记、摘录与知识卡</h1>
          <p className="course-workspace__body">统一沉淀系统知识卡和个人学习笔记。</p>
          <div className="shell-chip-row">
            <span>{notes.length} 张系统卡</span>
            <span>{userNotes.length} 条个人笔记</span>
            <span>{new Set([...notes, ...userNotes].map((item) => item.tag)).size} 个标签</span>
          </div>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>当前重点</span>
            <strong>把结果沉淀成可复盘资产</strong>
            <p>每次精读、练习和研究都应该形成可复用笔记。</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="新建笔记" title="录入个人笔记">
        <div className="note-board">
          <form className="form-stack" onSubmit={handleSubmit}>
            <input className="search-input" value={title} placeholder="笔记标题" onChange={(event) => setTitle(event.target.value)} />
            <input className="search-input" value={tag} placeholder="标签" onChange={(event) => setTag(event.target.value)} />
            <textarea
              className="text-area"
              value={summary}
              placeholder="记录你的结论、问题、错因或迁移要点"
              onChange={(event) => setSummary(event.target.value)}
            />
            <div className="action-row">
              <button type="submit" disabled={createNoteMutation.isPending}>
                保存个人笔记
              </button>
            </div>
          </form>
          <div className="fact-grid">
            <article className="fact-card">
              <strong>摘录卡</strong>
              <p>沉淀教材定义、重要公式和关键证据。</p>
            </article>
            <article className="fact-card">
              <strong>术语卡</strong>
              <p>统一记录学科名词、边界和易混点。</p>
            </article>
            <article className="fact-card">
              <strong>总结卡</strong>
              <p>记录章节结论、做题经验和研究复盘。</p>
            </article>
          </div>
        </div>
      </PanelShell>

      <PanelShell eyebrow="系统知识卡" title="系统推荐卡片">
        <div className="card-grid">
          {notes.map((note) => (
            <article key={note.id} className="course-card">
              <p className="eyebrow">{note.tag}</p>
              <strong>{note.title}</strong>
              <p>{note.summary}</p>
            </article>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="个人笔记" title="最近个人笔记">
        <div className="stack-table">
          {userNotes.map((note) => (
            <article key={note.id} className="stack-row">
              <strong>{note.title}</strong>
              <p>{note.summary}</p>
              <div className="stack-row__meta">
                <span>{note.tag}</span>
                <span>{note.createdAt}</span>
              </div>
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
