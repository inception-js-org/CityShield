from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import logging
import uuid
import uvicorn
from typing import List, Optional

from prisma_client import prisma   # 🔴 ADD THIS

# ================= SETTINGS =================

class Settings(BaseSettings):
    APP_NAME: str = "Hackdeck API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["*"]

    database_url: str = Field(..., env="DATABASE_URL")
    next_public_clerk_publishable_key: Optional[str] = Field(
        None, env="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    )
    clerk_secret_key: Optional[str] = Field(
        None, env="CLERK_SECRET_KEY"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# ================= LOGGING =================

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)
logger = logging.getLogger("hackdeck")

# ================= APP =================

app = FastAPI(title=settings.APP_NAME)

# 🔴 PRISMA LIFECYCLE (THIS FIXES THE CRASH)

@app.on_event("startup")
async def startup():
    await prisma.connect()

@app.on_event("shutdown")
async def shutdown():
    await prisma.disconnect()

# ================= MIDDLEWARE =================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # explicit is safer
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= ROUTES =================

@app.get("/", tags=["root"])
async def read_root():
    return {"app": settings.APP_NAME, "status": "running"}

@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

# ================= DEMO ITEMS =================

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ItemOut(Item):
    id: str

_items = {}

@app.post("/api/v1/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(item: Item, request: Request):
    item_id = str(uuid.uuid4())
    out = ItemOut(id=item_id, **item.model_dump())
    _items[item_id] = out
    return out

@app.get("/api/v1/items/{item_id}", response_model=ItemOut)
async def get_item(item_id: str):
    item = _items.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

# ================= OFFICERS ROUTES =================

from routes.officers import router as officers_router
app.include_router(officers_router)

# ================= ENTRYPOINT =================

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )