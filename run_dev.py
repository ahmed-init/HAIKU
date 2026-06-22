import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import the existing app from the backend
from app.main import app

# Add CORS middleware to allow API access from separate frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the frontend directory exists and mount it to serve static files
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
os.makedirs(frontend_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("GenAI Multi-Agent API Development Server Launched!")
    print("Backend API:       http://127.0.0.1:8001")
    print("Frontend Interface: http://127.0.0.1:8001/static/index.html")
    print("="*60 + "\n")
    uvicorn.run(app, host="127.0.0.1", port=8001)
