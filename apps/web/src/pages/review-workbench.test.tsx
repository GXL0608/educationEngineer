// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewWorkbenchPage } from "./review-workbench";

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

describe("ReviewWorkbenchPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders runtime import review snapshot and can approve with release build", async () => {
    let approved = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/ops/import-reviews") && (!init || init.method === undefined)) {
        return mockResponse({
          jobCount: 2,
          pendingReviewCount: approved ? 0 : 1,
          approvedCount: approved ? 2 : 1,
          changesRequestedCount: 0,
          jobs: [],
          reviews: [
            {
              id: "review-import-k12-chemistry",
              importJobId: "import-k12-chemistry",
              title: "审核导入内容：高中化学：离子反应与离子方程式",
              status: approved ? "approved" : "pending",
              reviewer: approved ? "A11-reviewer" : null,
              notes: approved ? "结构清晰，可发布。" : null,
              payload: {
                checklist: ["标题是否准确", "概念拆解是否清楚"]
              },
              createdAt: "2026-03-11T09:00:00Z",
              updatedAt: "2026-03-11T09:10:00Z"
            }
          ]
        });
      }

      if (url.endsWith("/ops/import-reviews/review-import-k12-chemistry/approve") && init?.method === "POST") {
        approved = true;
        const body = JSON.parse(String(init.body || "{}"));
        return mockResponse({
          review: { decision: "approved" },
          releaseTriggered: Boolean(body.triggerRelease),
          releaseSucceeded: Boolean(body.triggerRelease),
          releaseManifest: body.triggerRelease
            ? {
                builtAt: "2026-03-11T12:00:00Z",
                catalogPath: "content/generated/catalog.json",
                manifestPath: "content/generated/manifest.json",
                courseCount: 5,
                questionCount: 9,
                paperCount: 6,
                approvedImportCount: 2,
                approvedImports: []
              }
            : undefined
        });
      }

      throw new Error(`Unhandled request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithQueryClient(<ReviewWorkbenchPage />);

    expect(await screen.findByText("审核导入内容：高中化学：离子反应与离子方程式")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "通过并发布" }));

    await waitFor(() => {
      expect(screen.getByText(/状态：approved/)).toBeInTheDocument();
    });
    expect(screen.getByText(/审批已通过并触发发布/)).toBeInTheDocument();
  });
});
