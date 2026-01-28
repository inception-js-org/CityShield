from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HackDeck API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routers import officers, zones, patrols, complaints, firs, alerts,hotspots

# Include routers
app.include_router(officers.router)
app.include_router(zones.router)
app.include_router(patrols.router)
app.include_router(complaints.router)
app.include_router(firs.router)
app.include_router(alerts.router)
app.include_router(hotspots.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "hackdeck-api"}

@app.get("/")
async def root():
    return {"message": "HackDeck API", "version": "1.0.0"}