// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExamPage } from "./exam";

function renderWithQueryClient(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
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

describe("ExamPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits an exam result into user persistence", async () => {
    let submittedBody: Record<string, unknown> | null = null;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.endsWith("/content/exams/exam-force") && (!init || init.method === undefined)) {
          return mockResponse({
            item: {
              id: "exam-force",
              title: "受力分析单元卷",
              durationMinutes: 45,
              sections: ["基础题", "综合题"]
            }
          });
        }

        if (url.includes("/assessment/papers?stage=K12") && (!init || init.method === undefined)) {
          return mockResponse({
            items: [
              {
                id: "exam-force",
                stage: "K12",
                subject: "物理",
                courseId: "course-1",
                chapterId: "chapter-1",
                title: "受力分析单元卷",
                paperType: "chapter_exam",
                durationMinutes: 45,
                questionCount: 2
              }
            ]
          });
        }

        if (url.endsWith("/assessment/papers/exam-force") && (!init || init.method === undefined)) {
          return mockResponse({
            item: {
              id: "exam-force",
              title: "受力分析单元卷",
              stage: "K12",
              subject: "物理",
              course: { id: "course-1", title: "高中物理" },
              chapter: { id: "chapter-1", title: "受力分析" },
              paperType: "chapter_exam",
              durationMinutes: 45,
              fullScore: 100,
              instructions: ["请规范作答"],
              questionIds: ["question-1", "question-2"],
              sections: [
                { id: "section-1", title: "基础题", targetCount: 1, questionIds: ["question-1"] },
                { id: "section-2", title: "综合题", targetCount: 1, questionIds: ["question-2"] }
              ]
            }
          });
        }

        if (url.endsWith("/assessment/questions/question-1") && (!init || init.method === undefined)) {
          return mockResponse({
            item: {
              id: "question-1",
              stage: "K12",
              subject: "物理",
              course: { id: "course-1", title: "高中物理" },
              chapter: { id: "chapter-1", title: "受力分析" },
              knowledgePoints: ["受力分析"],
              type: "单项选择题",
              stem: "关于木块受力，下列说法正确的是",
              choices: ["A. 只受重力", "B. 受重力和支持力"],
              answer: "B. 受重力和支持力",
              analysis: "支持力一定存在",
              score: 6,
              difficulty: "easy",
              source: { kind: "practice", practiceId: "practice-force" }
            }
          });
        }

        if (url.endsWith("/assessment/questions/question-2") && (!init || init.method === undefined)) {
          return mockResponse({
            item: {
              id: "question-2",
              stage: "K12",
              subject: "物理",
              course: { id: "course-1", title: "高中物理" },
              chapter: { id: "chapter-1", title: "受力分析" },
              knowledgePoints: ["受力分析"],
              type: "简答题",
              stem: "说明为什么要先确定研究对象",
              choices: [],
              answer: "因为力的归属依赖研究对象",
              analysis: "边界优先",
              score: 10,
              difficulty: "medium",
              source: { kind: "practice", practiceId: "practice-force" }
            }
          });
        }

        if (url.endsWith("/user/events") && init?.method === "POST") {
          return mockResponse({ userId: "demo-user", item: { id: "event-1" } });
        }

        if (url.endsWith("/user/exam-results") && init?.method === "POST") {
          submittedBody = JSON.parse(String(init.body)) as Record<string, unknown>;
          return mockResponse({ userId: "demo-user", item: { id: "exam-result-1" } });
        }

        throw new Error(`Unhandled request: ${url}`);
      })
    );

    renderWithQueryClient(<ExamPage examId="exam-force" />);

    expect((await screen.findAllByText("受力分析单元卷")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("B. 受重力和支持力"));
    fireEvent.click(screen.getByRole("button", { name: "交卷并进入讲评" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "88" } });
    fireEvent.click(screen.getByRole("button", { name: "保存本次卷面结果" }));

    await waitFor(() => {
      expect(screen.getByText("考试结果已写入学习报告。")).toBeInTheDocument();
      expect(submittedBody?.score).toBe(88);
      expect(submittedBody?.weakSections).toEqual(["综合题"]);
    });
  });
});
