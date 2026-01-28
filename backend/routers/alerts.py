from fastapi import APIRouter, HTTPException
from prisma import Prisma
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

class AlertCreate(BaseModel):
    type: str  # EMERGENCY, HOTSPOT, SYSTEM, FIR, PATROL, COMPLAINT
    message: str
    priority: str = "MEDIUM"
    zoneId: Optional[str] = None
    patrolId: Optional[str] = None
    createdById: Optional[str] = None
    metadata: Optional[dict] = None

@router.get("/")
async def get_alerts(
    acknowledged: Optional[bool] = None,
    type: Optional[str] = None,
    limit: int = 50
):
    prisma = Prisma()
    await prisma.connect()
    try:
        where = {}
        if acknowledged is not None:
            where["acknowledged"] = acknowledged
        if type:
            where["type"] = type.upper()
        
        alerts = await prisma.alert.find_many(
            where=where,
            take=limit,
            include={
                "zone": True,
                "patrol": True,
                "createdBy": True
            },
            order={"createdAt": "desc"}
        )
        return alerts
    finally:
        await prisma.disconnect()

@router.get("/unacknowledged")
async def get_unacknowledged_alerts():
    prisma = Prisma()
    await prisma.connect()
    try:
        alerts = await prisma.alert.find_many(
            where={"acknowledged": False},
            include={
                "zone": True,
                "patrol": True
            },
            order={"createdAt": "desc"}
        )
        return alerts
    finally:
        await prisma.disconnect()

@router.get("/count")
async def get_alert_counts():
    prisma = Prisma()
    await prisma.connect()
    try:
        total = await prisma.alert.count()
        unacknowledged = await prisma.alert.count(where={"acknowledged": False})
        emergency = await prisma.alert.count(where={"type": "EMERGENCY", "acknowledged": False})
        
        return {
            "total": total,
            "unacknowledged": unacknowledged,
            "emergency": emergency
        }
    finally:
        await prisma.disconnect()

@router.post("/")
async def create_alert(data: AlertCreate):
    prisma = Prisma()
    await prisma.connect()
    try:
        alert = await prisma.alert.create(
            data={
                "type": data.type.upper(),
                "message": data.message,
                "priority": data.priority.upper(),
                "zoneId": data.zoneId,
                "patrolId": data.patrolId,
                "createdById": data.createdById,
                "metadata": data.metadata
            },
            include={
                "zone": True,
                "patrol": True
            }
        )
        return alert
    finally:
        await prisma.disconnect()

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, officer_id: Optional[str] = None):
    prisma = Prisma()
    await prisma.connect()
    try:
        alert = await prisma.alert.update(
            where={"id": alert_id},
            data={
                "acknowledged": True,
                "acknowledgedAt": datetime.now(),
                "acknowledgedById": officer_id
            }
        )
        return alert
    finally:
        await prisma.disconnect()

@router.post("/acknowledge-all")
async def acknowledge_all_alerts():
    prisma = Prisma()
    await prisma.connect()
    try:
        result = await prisma.alert.update_many(
            where={"acknowledged": False},
            data={
                "acknowledged": True,
                "acknowledgedAt": datetime.now()
            }
        )
        return {"acknowledged": result.count}
    finally:
        await prisma.disconnect()

@router.post("/emergency")
async def create_emergency_alert(
    message: str,
    patrol_id: Optional[str] = None,
    zone_id: Optional[str] = None,
    officer_id: Optional[str] = None
):
    """Quick endpoint for emergency alerts"""
    prisma = Prisma()
    await prisma.connect()
    try:
        alert = await prisma.alert.create(
            data={
                "type": "EMERGENCY",
                "message": message,
                "priority": "HIGH",
                "patrolId": patrol_id,
                "zoneId": zone_id,
                "createdById": officer_id
            }
        )
        return alert
    finally:
        await prisma.disconnect()