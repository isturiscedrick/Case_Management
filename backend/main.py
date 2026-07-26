from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Case Management API")

# Allow Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "Case Management Backend"}

@app.get("/api/cases")
def get_cases():
    return {
        "cases": [
            {"id": 1, "title": "Case #101: Initial Review", "status": "Pending"},
            {"id": 2, "title": "Case #102: Document Verification", "status": "In Progress"},
            {"id": 3, "title": "Case #103: Final Approval", "status": "Completed"},
        ]
    }