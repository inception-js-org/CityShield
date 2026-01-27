from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, BaseSettings
import logging
import uuid
import uvicorn
from typing import List, Optional

class Settings(BaseSettings):
    APP_NAME: str = "Hackdeck API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)
logger = logging.getLogger("hackdeck")

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting %s", settings.APP_NAME)
    # initialize DB, caches, etc. here

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down %s", settings.APP_NAME)
    # cleanup resources here

@app.get("/", tags=["root"])
async def read_root():
    return {"app": settings.APP_NAME, "status": "running"}

@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ItemOut(Item):
    id: str

# simple in-memory store for example
_items = {}

@app.post("/api/v1/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(item: Item, request: Request):
    item_id = str(uuid.uuid4())
    out = ItemOut(id=item_id, **item.dict())
    _items[item_id] = out
    logger.debug("Created item %s from %s", item_id, request.client.host if request.client else None)
    return out

@app.get("/api/v1/items/{item_id}", response_model=ItemOut)
async def get_item(item_id: str):
    item = _items.get(item_id)
    if not item:
        return {"detail": "Not found"}, status.HTTP_404_NOT_FOUND
    return item

if __name__ == "__main__":
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)