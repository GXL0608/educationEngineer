from fastapi import APIRouter, HTTPException, Query

from app.models import ContentImportRequest, ContentIngestRequest, QuestionBankRequest, ReviewDecisionRequest, ScriptGenerateRequest
from app.services.content_factory import build_generated_assets, read_generated_manifest, read_release_manifest, summarize_source
from app.services.import_pipeline import (
    apply_review_decision,
    create_import_job,
    import_batch_from_inbox,
    list_pipeline_state,
    review_task_detail,
)

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/parse-content")
def parse_content(request: ContentIngestRequest) -> dict:
    paragraphs = [segment.strip() for segment in request.raw_text.split("\n") if segment.strip()]
    return {
        "title": request.title,
        "stage": request.stage,
        "subject": request.subject,
        "paragraph_count": len(paragraphs),
        "knowledge_units": [
            {"name": f"{request.subject}核心概念", "kind": "concept"},
            {"name": "重点题型", "kind": "practice"}
        ]
    }


@router.post("/generate-script")
def generate_script(request: ScriptGenerateRequest) -> dict:
    return {
        "title": request.title,
        "focus": request.focus,
        "timeline": [
            {"time": "00:08", "label": "导入问题"},
            {"time": "00:28", "label": "重点解释"},
            {"time": "00:58", "label": "迁移提示"}
        ],
        "paragraphs": request.paragraphs
    }


@router.post("/build-question-set")
def build_question_set(request: QuestionBankRequest) -> dict:
    items = [
        {
            "id": f"{request.knowledge_point}-{index + 1}",
            "prompt": f"围绕 {request.knowledge_point} 的训练题 {index + 1}",
            "difficulty": request.difficulty
        }
        for index in range(request.count)
    ]
    return {"items": items}


@router.get("/source-summary")
def get_source_summary() -> dict:
    return summarize_source()


@router.post("/build-packages")
def build_packages() -> dict:
    return {"status": "built", "manifest": build_generated_assets()}


@router.get("/generated-manifest")
def get_generated_manifest() -> dict:
    return read_generated_manifest()


@router.get("/release-manifest")
def get_release_manifest() -> dict:
    return read_release_manifest()


@router.get("/state")
def get_pipeline_state() -> dict:
    return list_pipeline_state()


@router.post("/imports")
def create_import(request: ContentImportRequest) -> dict:
    return create_import_job(request.model_dump())


@router.post("/imports/batch")
def run_batch_import() -> dict:
    return import_batch_from_inbox()


@router.get("/imports")
def get_import_jobs() -> dict:
    return {"items": list_pipeline_state()["jobs"]}


@router.get("/reviews")
def get_review_tasks(status: str | None = Query(default=None)) -> dict:
    state = list_pipeline_state()
    if status:
        return {"items": [item for item in state["reviews"] if item["status"] == status]}
    return {"items": state["reviews"]}


@router.get("/reviews/{task_id}")
def get_review_task(task_id: str) -> dict:
    detail = review_task_detail(task_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Review task not found")
    return detail


@router.post("/reviews/{task_id}/approve")
def approve_review(task_id: str, request: ReviewDecisionRequest) -> dict:
    result = apply_review_decision(task_id, reviewer=request.reviewer, notes=request.notes, decision="approved")
    if result is None:
        raise HTTPException(status_code=404, detail="Review task not found")
    return result


@router.post("/reviews/{task_id}/reject")
def reject_review(task_id: str, request: ReviewDecisionRequest) -> dict:
    result = apply_review_decision(task_id, reviewer=request.reviewer, notes=request.notes, decision="changes_requested")
    if result is None:
        raise HTTPException(status_code=404, detail="Review task not found")
    return result
