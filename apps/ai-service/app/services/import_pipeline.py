from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from app.services.content_factory import ensure_dir, write_json
from app.services.ops_store import (
    ROOT,
    find_import_job_by_source_name,
    get_import_job,
    get_review_task,
    insert_import_job,
    insert_review_task,
    list_import_jobs,
    list_review_tasks,
    update_import_job,
    update_review_task,
    utc_now,
)


IMPORT_INBOX_DIR = ROOT / "content" / "imports" / "inbox"
REVIEW_ROOT = ROOT / "content" / "review"
DRAFT_DIR = REVIEW_ROOT / "drafts"
APPROVED_DIR = REVIEW_ROOT / "approved"
REJECTED_DIR = REVIEW_ROOT / "rejected"
DECISION_DIR = REVIEW_ROOT / "decisions"
PIPELINE_STATE_PATH = ROOT / "runtime" / "import-pipeline-state.json"


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return slug or "import"


def _short_hash(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:10]


def _split_paragraphs(raw_text: str) -> list[str]:
    return [segment.strip() for segment in raw_text.split("\n") if segment.strip()]


def _knowledge_units(subject: str, title: str, paragraphs: list[str]) -> list[dict[str, str]]:
    units: list[dict[str, str]] = []
    if paragraphs:
        units.append({"name": f"{subject}核心概念", "kind": "concept"})
    if len(paragraphs) >= 2:
        units.append({"name": f"{title}训练题型", "kind": "practice"})
    if len(paragraphs) >= 3:
        units.append({"name": f"{title}延伸研究", "kind": "research"})
    return units or [{"name": f"{title}主题", "kind": "concept"}]


def _script(title: str, focus: str, paragraphs: list[str]) -> dict[str, Any]:
    return {
        "title": title,
        "focus": focus,
        "timeline": [
            {"time": "00:08", "label": "问题导入"},
            {"time": "00:32", "label": "概念拆解"},
            {"time": "01:05", "label": "题型迁移"},
        ],
        "paragraphs": paragraphs,
    }


def _question_type(stage: str) -> str:
    mapping = {
        "K12": "简答题",
        "undergraduate": "证明题",
        "master": "论述题",
        "doctor": "文献理解题",
    }
    return mapping.get(stage, "简答题")


def _difficulty(index: int) -> str:
    levels = ["easy", "medium", "hard"]
    return levels[min(index, len(levels) - 1)]


def _question_set(
    *,
    job_id: str,
    stage: str,
    subject: str,
    title: str,
    paragraphs: list[str],
    knowledge_units: list[dict[str, str]],
) -> dict[str, Any]:
    items = []
    for index, unit in enumerate(knowledge_units):
        paragraph = paragraphs[min(index, len(paragraphs) - 1)] if paragraphs else title
        items.append(
            {
                "id": f"{job_id}-q{index + 1}",
                "stage": stage,
                "subject": subject,
                "type": _question_type(stage),
                "knowledgePoint": unit["name"],
                "stem": f"围绕“{unit['name']}”解释这段材料的核心判断：{paragraph}",
                "answer": paragraph,
                "analysis": f"本题聚焦 {unit['name']}，要求从材料中抽取关键逻辑而不是复述标题。",
                "difficulty": _difficulty(index),
            }
        )
    return {"title": f"{title} 导入题组", "items": items}


def _review_checklist(stage: str) -> list[str]:
    common = ["标题是否准确", "概念拆解是否清楚", "题目是否能覆盖原始材料主旨"]
    if stage in {"master", "doctor"}:
        common.append("研究表达是否符合学术语境")
    else:
        common.append("是否适合教学页直接展示")
    return common


def _draft_path(job_id: str) -> Path:
    return DRAFT_DIR / f"{job_id}.json"


def _artifact_path(directory: Path, job_id: str) -> Path:
    return directory / f"{job_id}.json"


def _snapshot_state(jobs: list[dict[str, Any]], reviews: list[dict[str, Any]]) -> dict[str, Any]:
    snapshot = {
        "jobCount": len(jobs),
        "pendingReviewCount": sum(1 for task in reviews if task["status"] == "pending"),
        "approvedCount": sum(1 for task in reviews if task["status"] == "approved"),
        "changesRequestedCount": sum(1 for task in reviews if task["status"] == "changes_requested"),
        "jobs": jobs,
        "reviews": reviews,
    }
    write_json(PIPELINE_STATE_PATH, snapshot)
    return snapshot


def create_import_job(request: dict[str, Any], *, source_path: str | None = None) -> dict[str, Any]:
    existing = find_import_job_by_source_name(request["source_name"])
    if existing is not None:
        review_task = next(
            (task for task in list_review_tasks() if task["importJobId"] == existing["id"]),
            None,
        )
        return {"created": False, "job": existing, "reviewTask": review_task}

    paragraphs = _split_paragraphs(request["raw_text"])
    knowledge_units = _knowledge_units(request["subject"], request["title"], paragraphs)
    focus = knowledge_units[0]["name"]
    job_id = f"import-{_slugify(request['source_name'])}-{_short_hash(request['raw_text'])}"
    review_task_id = f"review-{job_id}"

    draft = {
        "jobId": job_id,
        "sourceName": request["source_name"],
        "stage": request["stage"],
        "subject": request["subject"],
        "title": request["title"],
        "rawText": request["raw_text"],
        "paragraphs": paragraphs,
        "knowledgeUnits": knowledge_units,
        "script": _script(request["title"], focus, paragraphs),
        "questionSet": _question_set(
            job_id=job_id,
            stage=request["stage"],
            subject=request["subject"],
            title=request["title"],
            paragraphs=paragraphs,
            knowledge_units=knowledge_units,
        ),
        "reviewChecklist": _review_checklist(request["stage"]),
        "status": "pending_review",
    }

    draft_path = _draft_path(job_id)
    for directory in (DRAFT_DIR, APPROVED_DIR, REJECTED_DIR, DECISION_DIR):
        ensure_dir(directory)
    write_json(draft_path, draft)

    created_at = utc_now()
    metadata = {
        "paragraphCount": len(paragraphs),
        "knowledgeUnitCount": len(knowledge_units),
        "questionCount": len(draft["questionSet"]["items"]),
        "excerpt": paragraphs[0] if paragraphs else request["title"],
    }
    job = {
        "id": job_id,
        "sourceName": request["source_name"],
        "stage": request["stage"],
        "subject": request["subject"],
        "title": request["title"],
        "status": "pending_review",
        "draftPath": str(draft_path.relative_to(ROOT)),
        "sourcePath": source_path,
        "artifactPath": None,
        "metadata": metadata,
        "createdAt": created_at,
        "updatedAt": created_at,
    }
    review_task = {
        "id": review_task_id,
        "importJobId": job_id,
        "title": f"审核导入内容：{request['title']}",
        "status": "pending",
        "reviewer": None,
        "notes": None,
        "payload": {
            "draftPath": str(draft_path.relative_to(ROOT)),
            "checklist": draft["reviewChecklist"],
            "sourceName": request["source_name"],
        },
        "createdAt": created_at,
        "updatedAt": created_at,
    }
    insert_import_job(job)
    insert_review_task(review_task)
    list_pipeline_state()

    return {"created": True, "job": get_import_job(job_id), "reviewTask": get_review_task(review_task_id)}


def import_batch_from_inbox() -> dict[str, Any]:
    ensure_dir(IMPORT_INBOX_DIR)
    results = []

    for path in sorted(IMPORT_INBOX_DIR.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload.setdefault("source_name", path.stem)
        results.append(create_import_job(payload, source_path=str(path.relative_to(ROOT))))

    created_count = sum(1 for item in results if item["created"])
    skipped_count = len(results) - created_count
    state = list_pipeline_state()
    return {
        "sourceDir": str(IMPORT_INBOX_DIR.relative_to(ROOT)),
        "processed": len(results),
        "created": created_count,
        "skipped": skipped_count,
        "jobs": [item["job"] for item in results],
        "state": {
            "jobCount": state["jobCount"],
            "pendingReviewCount": state["pendingReviewCount"],
            "approvedCount": state["approvedCount"],
            "changesRequestedCount": state["changesRequestedCount"],
        },
    }


def review_task_detail(task_id: str) -> dict[str, Any] | None:
    task = get_review_task(task_id)
    if task is None:
        return None
    job = get_import_job(task["importJobId"])
    return {"task": task, "job": job}


def apply_review_decision(task_id: str, *, reviewer: str, notes: str, decision: str) -> dict[str, Any] | None:
    detail = review_task_detail(task_id)
    if detail is None:
        return None

    task = detail["task"]
    job = detail["job"]
    draft_path = ROOT / task["payload"]["draftPath"]
    draft = json.loads(draft_path.read_text(encoding="utf-8"))
    draft["status"] = decision

    destination_dir = APPROVED_DIR if decision == "approved" else REJECTED_DIR
    artifact_path = _artifact_path(destination_dir, job["id"])
    decision_path = DECISION_DIR / f"{task_id}.json"

    updated_metadata = dict(job["metadata"])
    updated_metadata["lastDecision"] = decision
    updated_metadata["decisionRecordedAt"] = utc_now()
    updated_metadata["decisionArtifactPath"] = str(decision_path.relative_to(ROOT))

    updated_job = update_import_job(
        job["id"],
        status=decision,
        artifact_path=str(artifact_path.relative_to(ROOT)),
        metadata=updated_metadata,
    )
    updated_payload = dict(task["payload"])
    updated_payload["artifactPath"] = str(artifact_path.relative_to(ROOT))
    updated_payload["decisionPath"] = str(decision_path.relative_to(ROOT))
    updated_task = update_review_task(
        task_id,
        status=decision,
        reviewer=reviewer,
        notes=notes,
        payload=updated_payload,
    )
    artifact_payload = {
        "decision": decision,
        "reviewer": reviewer,
        "notes": notes,
        "job": updated_job,
        "draft": draft,
    }
    write_json(artifact_path, artifact_payload)
    write_json(
        decision_path,
        {
            "taskId": task_id,
            "jobId": job["id"],
            "decision": decision,
            "reviewer": reviewer,
            "notes": notes,
            "artifactPath": str(artifact_path.relative_to(ROOT)),
        },
    )
    list_pipeline_state()
    return {
        "decision": decision,
        "job": updated_job,
        "task": updated_task,
        "artifactPath": str(artifact_path.relative_to(ROOT)),
    }


def list_pipeline_state() -> dict[str, Any]:
    jobs = list_import_jobs()
    reviews = list_review_tasks()
    return _snapshot_state(jobs, reviews)
