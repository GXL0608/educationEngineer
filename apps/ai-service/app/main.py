from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.pipeline import router as pipeline_router

app = FastAPI(title="Education Engineer AI Service", version="0.1.0")
app.include_router(health_router)
app.include_router(pipeline_router)
