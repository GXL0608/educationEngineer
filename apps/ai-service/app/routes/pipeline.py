from fastapi import APIRouter

from app.models import ContentIngestRequest, QuestionBankRequest, ScriptGenerateRequest
from app.services.content_factory import build_generated_assets, read_generated_manifest, summarize_source

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

