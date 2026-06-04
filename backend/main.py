"""FastAPI application entry point for IntelliRoute ride-hailing platform"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import sys

# Ensure backend directory is on sys.path so local packages import correctly
sys.path.append(os.path.dirname(__file__))

from core.config import settings
from database import Base, engine
from api.routers import users, drivers, rides, locations, payments, realtime

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliRoute API",
    description="Ride-hailing platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(realtime.router, tags=["Realtime"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(rides.router, prefix="/api/rides", tags=["Rides"])
app.include_router(locations.router, prefix="/api/locations", tags=["Locations"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

# Optional simple health endpoint kept under the API surface
@app.get("/health")
async def health():
    return {"status": "healthy"}

# Serve the static frontend (if present) at the application root.
# This lets the same Uvicorn server host both the API under `/api/...`
# and the static frontend (index + assets) at `/`.
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
