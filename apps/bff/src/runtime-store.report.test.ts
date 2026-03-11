import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createUserExamResult, createUserPracticeResult, getUserReport } from "./runtime-store.js";

test("aggregates course, chapter, and knowledge mastery into the user report", () => {
  const dir = mkdtempSync(join(tmpdir(), "edu-report-"));
  const filePath = join(dir, "user-state.json");
  const previous = process.env.EDU_USER_STATE_PATH;
  const userId = "mastery-user";

  try {
    process.env.EDU_USER_STATE_PATH = filePath;
    createUserPracticeResult(userId, {
      practiceId: "practice-force-set",
      title: "受力分析训练集",
      totalCount: 2,
      correctCount: 1,
      wrongCount: 1,
      weakFocuses: ["区分必然力与条件力"],
      durationMinutes: 12
    });
    createUserExamResult(userId, {
      examId: "exam-force-unit",
      title: "受力分析单元卷",
      score: 64,
      maxScore: 100,
      durationMinutes: 35,
      sectionCount: 3,
      weakSections: ["受力图绘制 2 题"]
    });

    const report = getUserReport(userId);

    assert.ok(report.masteryStats.length >= 4);
    assert.ok(report.courseMastery.some((item) => item.id === "k12-physics-forces"));
    assert.ok(report.chapterMastery.some((item) => item.id === "force-1"));
    assert.ok(report.knowledgeMastery.some((item) => item.title.includes("受力分析概念画布") || item.title.includes("区分必然力与条件力")));
    assert.ok(report.recommendedNextSteps.length > 0);
  } finally {
    if (previous === undefined) {
      delete process.env.EDU_USER_STATE_PATH;
    } else {
      process.env.EDU_USER_STATE_PATH = previous;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});
