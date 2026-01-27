from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from prisma_client import prisma
from clerk_client import create_clerk_invitation

router = APIRouter(prefix="/api/officers", tags=["Officers"])

class OfficerInvite(BaseModel):
    name: str | None = None
    email: EmailStr
    rank: str | None = None
    badge: str | None = None
    phone: str | None = None

@router.get("")
async def list_officers():
    return await prisma.policeofficer.find_many()

@router.post("/invite")
async def invite_officer(payload: OfficerInvite):
    try:
        # 1️⃣ Send Clerk invitation email
        invite = create_clerk_invitation(payload.email)

        # 2️⃣ Store officer locally
        officer = await prisma.policeofficer.create(
            data={
                "name": payload.name,
                "email": payload.email,
                "rank": payload.rank,
                "badge": payload.badge,
                "phone": payload.phone,
                "role": "OFFICER",
                "status": "INVITED",
            }
        )

        return {
            "message": "Invitation email sent",
            "clerk_invite_id": invite["id"],
            "officer": officer,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))