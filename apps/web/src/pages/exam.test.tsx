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

    expect(await screen.findByText("受力分析单元卷")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "标记为薄弱" })[1]);
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "88" } });
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "43" } });
    fireEvent.click(screen.getByRole("button", { name: "提交考试结果" }));

    await waitFor(() => {
      expect(screen.getByText("考试结果已写入学习报告。")).toBeInTheDocument();
      expect(submittedBody?.score).toBe(88);
      expect(submittedBody?.weakSections).toEqual(["综合题"]);
    });
  });
});
