from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="GenAI Multi-Agent API",
    version="1.0.0"
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "GenAI Multi-Agent API Running"
    }
    
#backend python -m uvicorn app.main:app --port-9000
#frontend python -m run_dev