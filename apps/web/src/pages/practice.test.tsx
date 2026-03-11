// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticePage } from "./practice";

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

describe("PracticePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a practice result into user persistence", async () => {
    let submittedBody: Record<string, unknown> | null = null;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.endsWith("/content/practices/practice-force") && (!init || init.method === undefined)) {
          return mockResponse({
            item: {
              id: "practice-force",
              title: "受力分析训练",
              items: [
                { prompt: "题目 1", answer: "答案 1", focus: "受力分析" },
                { prompt: "题目 2", answer: "答案 2", focus: "公式迁移" }
              ]
            }
          });
        }

        if (url.endsWith("/user/events") && init?.method === "POST") {
          return mockResponse({ userId: "demo-user", item: { id: "event-1" } });
        }

        if (url.endsWith("/user/practice-results") && init?.method === "POST") {
          submittedBody = JSON.parse(String(init.body)) as Record<string, unknown>;
          return mockResponse({ userId: "demo-user", item: { id: "practice-result-1" } });
        }

        throw new Error(`Unhandled request: ${url}`);
      })
    );

    renderWithQueryClient(<PracticePage practiceId="practice-force" />);

    expect(await screen.findByText("受力分析训练")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "答对" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "答错" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "写入训练结果" }));

    await waitFor(() => {
      expect(screen.getByText("训练结果已写入学习报告。")).toBeInTheDocument();
      expect(submittedBody?.correctCount).toBe(1);
      expect(submittedBody?.wrongCount).toBe(1);
      expect(submittedBody?.weakFocuses).toEqual(["公式迁移"]);
    });
  });
});
