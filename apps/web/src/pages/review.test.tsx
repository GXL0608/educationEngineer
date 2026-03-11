// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewPage } from "./review";

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

describe("ReviewPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders persisted review items and completes a review task", async () => {
    let completed = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/user/review-items?userId=demo-user") && (!init || init.method === undefined)) {
        return mockResponse({
          userId: "demo-user",
          items: [
            {
              id: "review-force",
              title: "受力图中的条件摩擦力",
              reason: "多次把条件力误判为必然力",
              nextReviewAt: "2026-03-12T09:00:00Z",
              status: completed ? "completed" : "pending",
              completedCount: completed ? 1 : 0,
              lastActionAt: completed ? "2026-03-11T09:00:00Z" : null
            }
          ]
        });
      }

      if (url.endsWith("/user/review-items/review-force/complete") && init?.method === "POST") {
        completed = true;
        return mockResponse({
          userId: "demo-user",
          item: {
            status: "completed"
          }
        });
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithQueryClient(<ReviewPage />);

    expect(await screen.findByText("受力图中的条件摩擦力")).toBeInTheDocument();
    expect(screen.getByText(/状态 pending/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "完成复习" }));

    await waitFor(() => {
      expect(screen.getByText(/状态 completed/)).toBeInTheDocument();
    });
  });
});
