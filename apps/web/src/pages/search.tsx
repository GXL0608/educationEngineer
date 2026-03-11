import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelShell } from "../components/panel-shell";
import { ErrorState, LoadingState } from "../components/query-state";
import { api, SearchItem } from "../lib/api";

const DEFAULT_QUERY = "牛顿第二定律 级数 研究问题 证据链";

function SearchResultLink({ item }: { item: SearchItem }) {
  switch (item.type) {
    case "course":
      return (
        <Link className="result-link" to="/course/$courseId" params={{ courseId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    case "chapter":
      return (
        <Link className="result-link" to="/chapter/$chapterId" params={{ chapterId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    case "lesson":
      return (
        <Link className="result-link" to="/study/$lessonId" params={{ lessonId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    case "concept":
      return (
        <Link className="result-link" to="/concept/$conceptId" params={{ conceptId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    case "practice":
      return (
        <Link className="result-link" to="/practice/$practiceId" params={{ practiceId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    case "exam":
      return (
        <Link className="result-link" to="/exam/$examId" params={{ examId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    case "research":
      return (
        <Link className="result-link" to="/research/$paperId" params={{ paperId: item.id }}>
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </Link>
      );
    default:
      return (
        <article className="list-card">
          <strong>{item.title}</strong>
          <p>{item.summary}</p>
        </article>
      );
  }
}

function formatSearchType(type: string) {
  const mapping: Record<string, string> = {
    course: "课程",
    chapter: "章节",
    lesson: "精读",
    concept: "概念",
    practice: "练习",
    exam: "考试",
    research: "研究"
  };
  return mapping[type] || type;
}

export function SearchPage() {
  const queryClient = useQueryClient();
  const [queryInput, setQueryInput] = useState(DEFAULT_QUERY);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const lastPersistedSearch = useRef<string | null>(null);
  const searchQuery = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: Boolean(query.trim())
  });
  const searchHistoryQuery = useQuery({
    queryKey: ["search-history"],
    queryFn: () => api.getSearchHistory()
  });
  const persistSearchMutation = useMutation({
    mutationFn: (payload: { query: string; resultCount: number }) => api.createSearchHistory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["search-history"] });
    }
  });

  if (searchQuery.isLoading) {
    return <LoadingState title="搜索加载中" detail="正在获取课程和内容搜索结果。" />;
  }

  if (searchQuery.isError || !searchQuery.data) {
    return <ErrorState title="搜索不可用" detail="无法获取搜索结果。" />;
  }

  const items = searchQuery.data.items;
  const recentSearches = searchHistoryQuery.data?.items ?? [];

  useEffect(() => {
    if (!query.trim() || !searchQuery.data) {
      return;
    }
    const marker = `${query}:${searchQuery.data.items.length}`;
    if (lastPersistedSearch.current === marker) {
      return;
    }
    lastPersistedSearch.current = marker;
    persistSearchMutation.mutate({ query, resultCount: searchQuery.data.items.length });
  }, [persistSearchMutation, query, searchQuery.data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    if (!nextQuery) {
      return;
    }
    setQuery(nextQuery);
  }

  return (
    <div className="page-stack">
      <section className="command-board">
        <div className="command-board__main">
          <p className="eyebrow">内容检索</p>
          <h1>跨课程、教材、题目和文献的统一入口</h1>
          <p className="course-workspace__body">统一检索课程、章节、练习、考试和研究内容。</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <input
              className="search-input"
              value={queryInput}
              placeholder="输入课程、教材、题型或研究问题"
              onChange={(event) => setQueryInput(event.target.value)}
            />
            <div className="action-row">
              <button type="submit">执行搜索</button>
            </div>
          </form>
        </div>
        <aside className="command-board__side">
          <article className="workspace-spotlight">
            <span>当前结果量</span>
            <strong>{items.length}</strong>
            <p>搜索结果会写入搜索历史并回流到学习报告。</p>
          </article>
          <article className="workspace-spotlight workspace-spotlight--muted">
            <span>最近搜索</span>
            <strong>{recentSearches.length}</strong>
            <p>{recentSearches[0] ? `最近一次：${recentSearches[0].query}` : "暂无历史检索记录。"}</p>
          </article>
        </aside>
      </section>

      <PanelShell eyebrow="最近搜索" title="近期查询轨迹">
        <div className="card-grid">
          {recentSearches.map((item) => (
            <article key={item.id} className="stage-card">
              <strong>{item.query}</strong>
              <p>
                命中结果 {item.resultCount} 条 / {item.createdAt}
              </p>
            </article>
          ))}
        </div>
      </PanelShell>

      <PanelShell eyebrow="搜索结果" title={query}>
        <div className="stack-table">
          {items.map((item) => (
            <article key={`${item.type}-${item.id}`} className="stack-row">
              <div className="stack-row__meta">
                <span>{formatSearchType(item.type)}</span>
              </div>
              <SearchResultLink item={item} />
            </article>
          ))}
        </div>
      </PanelShell>
    </div>
  );
}
