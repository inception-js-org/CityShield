from fastapi import APIRouter, HTTPException
from prisma import Prisma
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/zones", tags=["zones"])

class ZoneCreate(BaseModel):
    zoneId: str
    name: str
    coords: list
    type: str
    popDensity: int
    crowdBase: float
    lighting: float
    cctvDensity: float
    policeScore: float
    patrolFreq: int
    riskBase: float
    crimeRates: dict

class ZoneResponse(BaseModel):
    id: str
    zoneId: str
    name: str
    coords: list
    type: str
    popDensity: int
    crowdBase: float
    lighting: float
    cctvDensity: float
    policeScore: float
    patrolFreq: int
    riskBase: float
    crimeRates: dict
    riskScore: Optional[float]
    createdAt: datetime

@router.get("/", response_model=List[ZoneResponse])
async def get_zones():
    prisma = Prisma()
    await prisma.connect()
    try:
        zones = await prisma.zone.find_many(
            order={"riskBase": "desc"}
        )
        return zones
    finally:
        await prisma.disconnect()

@router.get("/{zone_id}")
async def get_zone(zone_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        zone = await prisma.zone.find_unique(
            where={"id": zone_id},
            include={
                "patrols": {"include": {"officers": True}},
                "complaints": True,
                "firs": True
            }
        )
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        return zone
    finally:
        await prisma.disconnect()

@router.post("/", response_model=ZoneResponse)
async def create_zone(zone: ZoneCreate):
    prisma = Prisma()
    await prisma.connect()
    try:
        new_zone = await prisma.zone.create(
            data={
                "zoneId": zone.zoneId,
                "name": zone.name,
                "coords": zone.coords,
                "type": zone.type.upper(),
                "popDensity": zone.popDensity,
                "crowdBase": zone.crowdBase,
                "lighting": zone.lighting,
                "cctvDensity": zone.cctvDensity,
                "policeScore": zone.policeScore,
                "patrolFreq": zone.patrolFreq,
                "riskBase": zone.riskBase,
                "crimeRates": zone.crimeRates
            }
        )
        return new_zone
    finally:
        await prisma.disconnect()

@router.post("/seed")
async def seed_zones_from_json():
    """Seed zones from zones.json file"""
    import json
    prisma = Prisma()
    await prisma.connect()
    try:
        with open("dataset/zones.json", "r") as f:
            data = json.load(f)
        
        created = 0
        for zone_data in data["zones"]:
            existing = await prisma.zone.find_unique(
                where={"zoneId": zone_data["zone_id"]}
            )
            if not existing:
                await prisma.zone.create(
                    data={
                        "zoneId": zone_data["zone_id"],
                        "name": zone_data["name"],
                        "coords": zone_data["coords"],
                        "type": zone_data["type"].upper(),
                        "popDensity": zone_data["pop_density"],
                        "crowdBase": zone_data["crowd_base"],
                        "lighting": zone_data["lighting"],
                        "cctvDensity": zone_data["cctv_density"],
                        "policeScore": zone_data["police_score"],
                        "patrolFreq": zone_data["patrol_freq"],
                        "riskBase": zone_data["risk_base"],
                        "crimeRates": zone_data["base_crime_rates"]
                    }
                )
                created += 1
        
        return {"message": f"Seeded {created} zones", "total": len(data["zones"])}
    finally:
        await prisma.disconnect()

@router.patch("/{zone_id}/risk-score")
async def update_risk_score(zone_id: str, risk_score: float):
    """Update zone risk score (for AI/ML integration)"""
    prisma = Prisma()
    await prisma.connect()
    try:
        zone = await prisma.zone.update(
            where={"id": zone_id},
            data={
                "riskScore": risk_score,
                "lastUpdated": datetime.now()
            }
        )
        return zone
    finally:
        await prisma.disconnect()