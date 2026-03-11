// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportPage } from "./report";

function renderWithQueryClient(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  return render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
}

function mockResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload
  } as unknown as Response;
}

describe("ReportPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders system report and persisted user report blocks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/learning/report-overview")) {
          return mockResponse({
            weeklyFocus: "本周重点聚焦力学建模与主动回忆。",
            progress: [
              { label: "课程完成率", value: "62%" },
              { label: "练习正确率", value: "78%" }
            ],
            weakness: ["条件摩擦力判断", "级数收敛比较"]
          });
        }

        if (url.endsWith("/user/report?userId=demo-user")) {
          return mockResponse({
            userId: "demo-user",
            stats: [
              { label: "个人笔记", value: "3" },
              { label: "搜索记录", value: "5" }
            ],
            resultStats: [
              { label: "练习提交", value: "2 次" },
              { label: "平均正确率", value: "76%" }
            ],
            masteryStats: [
              { label: "课程掌握均值", value: "74%" },
              { label: "章节风险点", value: "1 个" }
            ],
            courseMastery: [
              {
                id: "k12-physics-forces",
                title: "高中物理：牛顿运动定律",
                subtitle: "",
                score: 74,
                status: "steady",
                trend: "rising",
                evidenceCount: 2,
                nextAction: "继续做一次迁移题和一次错题复盘，稳定高中物理：牛顿运动定律。"
              }
            ],
            chapterMastery: [
              {
                id: "force-1",
                title: "力与受力分析",
                subtitle: "高中物理：牛顿运动定律",
                score: 68,
                status: "steady",
                trend: "steady",
                evidenceCount: 2,
                nextAction: "继续做一次迁移题和一次错题复盘，稳定力与受力分析。"
              }
            ],
            knowledgeMastery: [
              {
                id: "force-1:受力分析概念画布",
                title: "受力分析概念画布",
                subtitle: "高中物理：牛顿运动定律 / 力与受力分析",
                score: 61,
                status: "risk",
                trend: "falling",
                evidenceCount: 2,
                nextAction: "先回到 受力分析概念画布 的精读与针对练习，再进入下一轮复习。"
              }
            ],
            recommendedNextSteps: [
              {
                id: "next-step-1",
                targetId: "force-1:受力分析概念画布",
                targetType: "knowledge",
                title: "受力分析概念画布",
                reason: "61% 掌握度，趋势 falling，证据 2 次。",
                action: "先回到 受力分析概念画布 的精读与针对练习，再进入下一轮复习。"
              }
            ],
            outcomeWeaknesses: [
              { label: "受力分析", value: "2 次失分 / 需巩固" }
            ],
            recentResults: [
              {
                id: "practice-result-1",
                kind: "practice",
                title: "受力分析训练",
                summary: "2/3 正确 · 67% · 12 分钟",
                completedAt: "2026-03-11T10:01:00Z"
              }
            ],
            recentSearches: [
              {
                id: "search-1",
                query: "牛顿第二定律",
                resultCount: 8,
                createdAt: "2026-03-11T10:00:00Z"
              }
            ],
            recentActivity: [
              {
                id: "event-1",
                type: "lesson_viewed",
                targetId: "lesson-force",
                title: "受力分析精读",
                createdAt: "2026-03-11T10:02:00Z"
              }
            ]
          });
        }

        throw new Error(`Unhandled request: ${url}`);
      })
    );

    renderWithQueryClient(<ReportPage />);

    expect(await screen.findByText("本周重点聚焦力学建模与主动回忆。")).toBeInTheDocument();
    expect(screen.getByText("个人笔记")).toBeInTheDocument();
    expect(screen.getByText("练习提交")).toBeInTheDocument();
    expect(screen.getByText("受力分析")).toBeInTheDocument();
    expect(screen.getByText("受力分析训练")).toBeInTheDocument();
    expect(screen.getByText("牛顿第二定律")).toBeInTheDocument();
    expect(screen.getByText("进入精读")).toBeInTheDocument();
    expect(screen.getByText("课程掌握均值")).toBeInTheDocument();
    expect(screen.getByText("受力分析概念画布")).toBeInTheDocument();
    expect(screen.getByText(/下一步：受力分析概念画布/)).toBeInTheDocument();
  });
});
