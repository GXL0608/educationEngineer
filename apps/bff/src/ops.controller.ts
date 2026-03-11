import { Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post } from "@nestjs/common";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getReleaseManifest } from "./content-store.js";
import { getImportPipelineState, getImportReviewTask } from "./runtime-store.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const REVIEW_SCRIPT_PATH = resolve(ROOT, "apps", "ai-service", "scripts", "review_import_task.py");
const RELEASE_BUILD_SCRIPT_PATH = resolve(ROOT, "apps", "ai-service", "scripts", "build_content_packages.py");

type ReviewDecisionBody = {
  reviewer?: string;
  notes?: string;
  triggerRelease?: boolean;
};

function resolveReviewer(reviewer?: string) {
  return reviewer?.trim() || "A11-reviewer";
}

function runReviewDecision(taskId: string, decision: "approved" | "changes_requested", reviewer: string, notes: string) {
  const result = spawnSync("python3", [REVIEW_SCRIPT_PATH, taskId, decision, reviewer, notes], {
    cwd: ROOT,
    encoding: "utf-8"
  });

  if (result.error) {
    throw new InternalServerErrorException(`审核执行失败: ${result.error.message}`);
  }

  const stdout = result.stdout.trim();
  const payload = stdout ? (JSON.parse(stdout) as Record<string, unknown>) : null;

  if (result.status !== 0) {
    if (payload?.error === "review task not found") {
      throw new NotFoundException(`审核任务不存在: ${taskId}`);
    }
    throw new InternalServerErrorException(
      typeof payload?.error === "string" ? payload.error : result.stderr.trim() || "审核脚本执行失败"
    );
  }

  if (!payload) {
    throw new InternalServerErrorException("审核脚本未返回结果");
  }

  return payload;
}

function runReleaseBuild() {
  const result = spawnSync("python3", [RELEASE_BUILD_SCRIPT_PATH], {
    cwd: ROOT,
    encoding: "utf-8"
  });

  if (result.error) {
    throw new Error(`发布构建失败: ${result.error.message}`);
  }

  const stdout = result.stdout.trim();
  const payload = stdout ? (JSON.parse(stdout) as Record<string, unknown>) : null;

  if (result.status !== 0) {
    throw new Error(typeof payload?.error === "string" ? payload.error : result.stderr.trim() || "发布脚本执行失败");
  }

  if (!payload) {
    throw new Error("发布脚本未返回结果");
  }

  return payload;
}

@Controller("ops")
export class OpsController {
  @Get("release-manifest")
  getRelease() {
    return getReleaseManifest();
  }

  @Get("import-reviews")
  getImportReviews() {
    return getImportPipelineState();
  }

  @Get("import-reviews/:taskId")
  getImportReview(@Param("taskId") taskId: string) {
    return { item: getImportReviewTask(taskId) ?? null };
  }

  @Post("release-build")
  releaseBuild() {
    try {
      return {
        releaseTriggered: true,
        releaseSucceeded: true,
        releaseManifest: runReleaseBuild()
      };
    } catch (error) {
      return {
        releaseTriggered: true,
        releaseSucceeded: false,
        releaseError: error instanceof Error ? error.message : "发布构建失败"
      };
    }
  }

  @Post("import-reviews/:taskId/approve")
  approveImportReview(@Param("taskId") taskId: string, @Body() body: ReviewDecisionBody) {
    const review = runReviewDecision(taskId, "approved", resolveReviewer(body.reviewer), body.notes?.trim() || "");
    if (!body.triggerRelease) {
      return {
        review,
        releaseTriggered: false,
        releaseSucceeded: false
      };
    }

    try {
      return {
        review,
        releaseTriggered: true,
        releaseSucceeded: true,
        releaseManifest: runReleaseBuild()
      };
    } catch (error) {
      return {
        review,
        releaseTriggered: true,
        releaseSucceeded: false,
        releaseError: error instanceof Error ? error.message : "发布构建失败"
      };
    }
  }

  @Post("import-reviews/:taskId/reject")
  rejectImportReview(@Param("taskId") taskId: string, @Body() body: ReviewDecisionBody) {
    return runReviewDecision(taskId, "changes_requested", resolveReviewer(body.reviewer), body.notes?.trim() || "");
  }
}
