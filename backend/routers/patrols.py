from fastapi import APIRouter, HTTPException
from prisma import Prisma
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/patrols", tags=["patrols"])

class PatrolCreate(BaseModel):
    zoneId: Optional[str] = None
    leadOfficerId: Optional[str] = None
    officerIds: List[str] = []
    scheduledStart: Optional[datetime] = None
    scheduledEnd: Optional[datetime] = None
    routeData: Optional[list] = None
    checkpoints: Optional[list] = None

class PatrolUpdate(BaseModel):
    status: Optional[str] = None
    bodycamStatus: Optional[str] = None
    signalStrength: Optional[str] = None
    currentLat: Optional[float] = None
    currentLng: Optional[float] = None

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@router.get("/")
async def get_patrols(status: Optional[str] = None):
    prisma = Prisma()
    await prisma.connect()
    try:
        where = {}
        if status:
            where["status"] = status.upper()
        
        patrols = await prisma.patrol.find_many(
            where=where,
            include={
                "officers": True,
                "leadOfficer": True,
                "zone": True
            },
            order={"createdAt": "desc"}
        )
        return patrols
    finally:
        await prisma.disconnect()

@router.get("/active")
async def get_active_patrols():
    prisma = Prisma()
    await prisma.connect()
    try:
        patrols = await prisma.patrol.find_many(
            where={"status": "ACTIVE"},
            include={
                "officers": True,
                "leadOfficer": True,
                "zone": True
            }
        )
        return patrols
    finally:
        await prisma.disconnect()

@router.get("/{patrol_id}")
async def get_patrol(patrol_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        patrol = await prisma.patrol.find_unique(
            where={"id": patrol_id},
            include={
                "officers": True,
                "leadOfficer": True,
                "zone": True,
                "alerts": True,
                "firs": True
            }
        )
        if not patrol:
            raise HTTPException(status_code=404, detail="Patrol not found")
        return patrol
    finally:
        await prisma.disconnect()

@router.post("/")
async def create_patrol(data: PatrolCreate):
    prisma = Prisma()
    await prisma.connect()
    try:
        # Generate patrol number
        count = await prisma.patrol.count()
        patrol_number = f"P-{str(count + 1).zfill(2)}"
        
        patrol = await prisma.patrol.create(
            data={
                "patrolNumber": patrol_number,
                "zoneId": data.zoneId,
                "leadOfficerId": data.leadOfficerId,
                "scheduledStart": data.scheduledStart,
                "scheduledEnd": data.scheduledEnd,
                "routeData": data.routeData,
                "checkpoints": data.checkpoints,
                "totalCheckpoints": len(data.checkpoints) if data.checkpoints else 0,
                "officers": {
                    "connect": [{"id": oid} for oid in data.officerIds]
                }
            },
            include={
                "officers": True,
                "leadOfficer": True,
                "zone": True
            }
        )
        return patrol
    finally:
        await prisma.disconnect()

@router.patch("/{patrol_id}")
async def update_patrol(patrol_id: str, data: PatrolUpdate):
    prisma = Prisma()
    await prisma.connect()
    try:
        update_data = {}
        if data.status:
            update_data["status"] = data.status.upper()
            if data.status.upper() == "COMPLETED":
                update_data["endTime"] = datetime.now()
        if data.bodycamStatus:
            update_data["bodycamStatus"] = data.bodycamStatus.upper()
        if data.signalStrength:
            update_data["signalStrength"] = data.signalStrength.upper()
        if data.currentLat is not None:
            update_data["currentLat"] = data.currentLat
        if data.currentLng is not None:
            update_data["currentLng"] = data.currentLng
            update_data["lastLocationUpdate"] = datetime.now()
        
        patrol = await prisma.patrol.update(
            where={"id": patrol_id},
            data=update_data,
            include={
                "officers": True,
                "leadOfficer": True,
                "zone": True
            }
        )
        return patrol
    finally:
        await prisma.disconnect()

@router.post("/{patrol_id}/location")
async def update_patrol_location(patrol_id: str, location: LocationUpdate):
    prisma = Prisma()
    await prisma.connect()
    try:
        patrol = await prisma.patrol.update(
            where={"id": patrol_id},
            data={
                "currentLat": location.latitude,
                "currentLng": location.longitude,
                "lastLocationUpdate": datetime.now()
            }
        )
        return patrol
    finally:
        await prisma.disconnect()

@router.post("/{patrol_id}/start")
async def start_patrol(patrol_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        patrol = await prisma.patrol.update(
            where={"id": patrol_id},
            data={
                "status": "ACTIVE",
                "startTime": datetime.now(),
                "bodycamStatus": "RECORDING"
            }
        )
        return patrol
    finally:
        await prisma.disconnect()

@router.post("/{patrol_id}/end")
async def end_patrol(patrol_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        patrol = await prisma.patrol.update(
            where={"id": patrol_id},
            data={
                "status": "COMPLETED",
                "endTime": datetime.now(),
                "bodycamStatus": "OFFLINE"
            }
        )
        return patrol
    finally:
        await prisma.disconnect()

@router.post("/{patrol_id}/checkpoint")
async def complete_checkpoint(patrol_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        patrol = await prisma.patrol.find_unique(where={"id": patrol_id})
        if not patrol:
            raise HTTPException(status_code=404, detail="Patrol not found")
        
        patrol = await prisma.patrol.update(
            where={"id": patrol_id},
            data={
                "completedCheckpoints": patrol.completedCheckpoints + 1
            }
        )
        return patrol
    finally:
        await prisma.disconnect()