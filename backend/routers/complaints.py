from fastapi import APIRouter, HTTPException
from prisma import Prisma
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

class ComplaintCreate(BaseModel):
    type: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: str = "LOW"
    reporterName: Optional[str] = None
    reporterPhone: Optional[str] = None
    reporterEmail: Optional[str] = None
    isAnonymous: bool = False
    zoneId: Optional[str] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    handlerId: Optional[str] = None
    resolution: Optional[str] = None
    zoneId: Optional[str] = None

@router.get("/")
async def get_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    type: Optional[str] = None
):
    prisma = Prisma()
    await prisma.connect()
    try:
        where = {}
        if status:
            where["status"] = status.upper()
        if priority:
            where["priority"] = priority.upper()
        if type:
            where["type"] = type
        
        complaints = await prisma.complaint.find_many(
            where=where,
            include={
                "handler": True,
                "zone": True,
                "linkedFir": True
            },
            order={"createdAt": "desc"}
        )
        return complaints
    finally:
        await prisma.disconnect()

@router.get("/stats")
async def get_complaint_stats():
    prisma = Prisma()
    await prisma.connect()
    try:
        total = await prisma.complaint.count()
        open_count = await prisma.complaint.count(where={"status": "OPEN"})
        investigating = await prisma.complaint.count(where={"status": "INVESTIGATING"})
        resolved = await prisma.complaint.count(where={"status": "RESOLVED"})
        
        # Get counts by type
        all_complaints = await prisma.complaint.find_many()
        type_counts = {}
        for c in all_complaints:
            type_counts[c.type] = type_counts.get(c.type, 0) + 1
        
        return {
            "total": total,
            "open": open_count,
            "investigating": investigating,
            "resolved": resolved,
            "byType": type_counts
        }
    finally:
        await prisma.disconnect()

@router.get("/{complaint_id}")
async def get_complaint(complaint_id: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        complaint = await prisma.complaint.find_unique(
            where={"id": complaint_id},
            include={
                "handler": True,
                "zone": True,
                "linkedFir": True
            }
        )
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        return complaint
    finally:
        await prisma.disconnect()

@router.post("/")
async def create_complaint(data: ComplaintCreate):
    prisma = Prisma()
    await prisma.connect()
    try:
        # Generate complaint number
        count = await prisma.complaint.count()
        complaint_number = f"C-{str(count + 1).zfill(3)}"
        
        complaint = await prisma.complaint.create(
            data={
                "complaintNumber": complaint_number,
                "type": data.type,
                "description": data.description,
                "location": data.location,
                "latitude": data.latitude,
                "longitude": data.longitude,
                "priority": data.priority.upper(),
                "reporterName": data.reporterName,
                "reporterPhone": data.reporterPhone,
                "reporterEmail": data.reporterEmail,
                "isAnonymous": data.isAnonymous,
                "zoneId": data.zoneId
            },
            include={
                "zone": True
            }
        )
        return complaint
    finally:
        await prisma.disconnect()

@router.patch("/{complaint_id}")
async def update_complaint(complaint_id: str, data: ComplaintUpdate):
    prisma = Prisma()
    await prisma.connect()
    try:
        update_data = {}
        if data.status:
            update_data["status"] = data.status.upper()
            if data.status.upper() == "RESOLVED":
                update_data["resolvedAt"] = datetime.now()
        if data.priority:
            update_data["priority"] = data.priority.upper()
        if data.handlerId:
            update_data["handlerId"] = data.handlerId
        if data.resolution:
            update_data["resolution"] = data.resolution
        if data.zoneId:
            update_data["zoneId"] = data.zoneId
        
        complaint = await prisma.complaint.update(
            where={"id": complaint_id},
            data=update_data,
            include={
                "handler": True,
                "zone": True
            }
        )
        return complaint
    finally:
        await prisma.disconnect()

@router.post("/{complaint_id}/resolve")
async def resolve_complaint(complaint_id: str, resolution: str):
    prisma = Prisma()
    await prisma.connect()
    try:
        complaint = await prisma.complaint.update(
            where={"id": complaint_id},
            data={
                "status": "RESOLVED",
                "resolution": resolution,
                "resolvedAt": datetime.now()
            }
        )
        return complaint
    finally:
        await prisma.disconnect()

@router.post("/{complaint_id}/escalate")
async def escalate_to_fir(complaint_id: str, officer_id: str):
    """Escalate complaint to FIR"""
    prisma = Prisma()
    await prisma.connect()
    try:
        complaint = await prisma.complaint.find_unique(
            where={"id": complaint_id}
        )
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Create FIR from complaint
        fir_count = await prisma.fir.count()
        year = datetime.now().year
        fir_number = f"FIR-{year}-{str(fir_count + 1).zfill(3)}"
        
        fir = await prisma.fir.create(
            data={
                "firNumber": fir_number,
                "incidentType": complaint.type,
                "incidentDate": complaint.createdAt,
                "location": complaint.location,
                "latitude": complaint.latitude,
                "longitude": complaint.longitude,
                "description": complaint.description,
                "complainantName": complaint.reporterName or "Anonymous",
                "complainantPhone": complaint.reporterPhone,
                "complainantEmail": complaint.reporterEmail,
                "registeredById": officer_id,
                "zoneId": complaint.zoneId,
                "status": "FILED"
            }
        )
        
        # Link FIR to complaint
        await prisma.complaint.update(
            where={"id": complaint_id},
            data={
                "linkedFirId": fir.id,
                "status": "CLOSED"
            }
        )
        
        return fir
    finally:
        await prisma.disconnect()