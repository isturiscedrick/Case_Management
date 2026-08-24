from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.router import auth_router, case_router, history_router

app = FastAPI(title="Case Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(case_router.router)
app.include_router(history_router.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "system": "Case Management Backend",
        "database": str(engine.url).replace(
            f":{settings.DB_PASSWORD}@" if settings.DB_PASSWORD else "@", "@"
        ),
    }