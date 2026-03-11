from pydantic import BaseModel, Field


class ContentIngestRequest(BaseModel):
    stage: str = Field(..., description="学段")
    subject: str = Field(..., description="学科")
    title: str = Field(..., description="内容标题")
    raw_text: str = Field(..., description="原始文本")


class ScriptGenerateRequest(BaseModel):
    title: str
    focus: str
    paragraphs: list[str]


class QuestionBankRequest(BaseModel):
    knowledge_point: str
    difficulty: str
    count: int = 5


class ContentImportRequest(BaseModel):
    stage: str = Field(..., description="学段")
    subject: str = Field(..., description="学科")
    title: str = Field(..., description="导入内容标题")
    source_name: str = Field(..., description="来源标识")
    raw_text: str = Field(..., description="原始文本")


class ReviewDecisionRequest(BaseModel):
    reviewer: str = Field(..., description="审核人")
    notes: str = Field("", description="审核备注")
