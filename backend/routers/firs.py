from fastapi import APIRouter, HTTPException
from prisma import Prisma
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/firs", tags=["firs"])

class FIRCreate(BaseModel):
    incidentType: str
    incidentDate: datetime
    incidentTime: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str
    complainantName: str
    complainantPhone: Optional[str] = None
    complainantEmail: Optional[str] = None
    complainantAddress: Optional[str] = None
    accusedName: Optional[str] = None
    accusedDescription: Optional[str] = None
    registeredById: str
    zoneId: Optional[str] = None
    patrolId: Optional[str] = None
    evidence: Optional[list] = None
    witnesses: Optional[list] = None

class FIRUpdate(BaseModel):
    status: Optional[str] = None
    assignedToId: Optional[str] = None
    investigationNotes: Optional[str] = None
    closureReason: Optional[str] = None

@router.get("/")
async def get_firs(
    status: Optional[str] = None,
    incidentType: Optional[str] = None
):
    prisma = Prisma()
    await prisma.connect()
    try:
        where = {}
        if status:
            where["status"] = status.upper()
        if incidentType:
            where["incidentType"] = incidentType
        
        firs = await prisma.fir.find_many(
            where=where,
            include={
                "registeredBy": True,
                "assignedTo": True,
                "zone": True,
                "patrol": True,
                "complaints": True
            },
            order={"createdAt": "desc"}
        )
        return firs
    finally:
        await prisma.disconnect()

@router.get("/stats")
async def get_fir_stats():
    prisma = Prisma()
    await prisma.connect()
    try:
        total = await prisma.fir.count()
        draft = await prisma.fir.count(where={"status": "DRAFT"})
        filed = await prisma.fir.count(where={"status": "FILED"})
        investigating = await prisma.fir.count(where={"status": "UNDER_INVESTIGATION"})
        closed = await prisma.fir.count(where={"status": "CLOSED"})
        
        # Get counts by type
        all_firs = await prisma.fir.find_many()
        type_counts = {}
        for f in all_firs:
            type_counts[f.incidentType] = type_counts.get(f.incidentType, 0) + 1
        
        return {
            "total": total,
            "draft": draft,
            "filed": filed,
            "underInvestigation": investigating,
            "closed": closed,
            "byType": type_counts
        }
    finally:
        await prisma.disconnect()

@router.get("/recent")
async def get_recent_firs(limit: int = 10):
    prisma = Prisma()
    await prisma.connect()
    try:
        firs = await prisma.fir.find_many(
            take=limit,
            order={"createdAt": "desc"},
            include={
                "registeredBy": True,
                "zone": True
            }
        )
        return firs
    finally:
        await prisma.disconnect()

@router.get("/{fir_id}")
async def get_fir(fir_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        fir = await prisma.fir.find_unique(
            where={"id": fir_id},
            include={
                "registeredBy": True,
                "assignedTo": True,
                "zone": True,
                "patrol": True,
                "complaints": True
            }
        )
        if not fir:
            raise HTTPException(status_code=404, detail="FIR not found")
        return fir
    finally:
        await prisma.disconnect()

@router.post("/")
async def create_fir(data: FIRCreate):
    prisma = Prisma()
    await prisma.connect()
    try:
        # Generate FIR number
        count = await prisma.fir.count()
        year = datetime.now().year
        fir_number = f"FIR-{year}-{str(count + 1).zfill(3)}"
        
        fir = await prisma.fir.create(
            data={
                "firNumber": fir_number,
                "incidentType": data.incidentType,
                "incidentDate": data.incidentDate,
                "incidentTime": data.incidentTime,
                "location": data.location,
                "latitude": data.latitude,
                "longitude": data.longitude,
                "description": data.description,
                "complainantName": data.complainantName,
                "complainantPhone": data.complainantPhone,
                "complainantEmail": data.complainantEmail,
                "complainantAddress": data.complainantAddress,
                "accusedName": data.accusedName,
                "accusedDescription": data.accusedDescription,
                "registeredById": data.registeredById,
                "zoneId": data.zoneId,
                "patrolId": data.patrolId,
                "evidence": data.evidence,
                "witnesses": data.witnesses,
                "status": "FILED"
            },
            include={
                "registeredBy": True,
                "zone": True
            }
        )
        
        # Create alert for new FIR
        await prisma.alert.create(
            data={
                "type": "FIR",
                "message": f"New FIR filed - {data.incidentType} at {data.location}",
                "priority": "HIGH",
                "zoneId": data.zoneId,
                "patrolId": data.patrolId,
                "createdById": data.registeredById
            }
        )
        
        return fir
    finally:
        await prisma.disconnect()

@router.patch("/{fir_id}")
async def update_fir(fir_id: str, data: FIRUpdate):
    prisma = Prisma()
    await prisma.connect()
    try:
        update_data = {}
        if data.status:
            update_data["status"] = data.status.upper()
            if data.status.upper() == "CLOSED":
                update_data["closedAt"] = datetime.now()
        if data.assignedToId:
            update_data["assignedToId"] = data.assignedToId
        if data.investigationNotes:
            update_data["investigationNotes"] = data.investigationNotes
        if data.closureReason:
            update_data["closureReason"] = data.closureReason
        
        fir = await prisma.fir.update(
            where={"id": fir_id},
            data=update_data,
            include={
                "registeredBy": True,
                "assignedTo": True,
                "zone": True
            }
        )
        return fir
    finally:
        await prisma.disconnect()

@router.post("/{fir_id}/assign")
async def assign_fir(fir_id: str, officer_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        fir = await prisma.fir.update(
            where={"id": fir_id},
            data={
                "assignedToId": officer_id,
                "status": "UNDER_INVESTIGATION"
            },
            include={
                "assignedTo": True
            }
        )
        return fir
    finally:
        await prisma.disconnect()