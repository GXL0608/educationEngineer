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
