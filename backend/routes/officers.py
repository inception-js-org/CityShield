from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from prisma_client import prisma
from clerk_client import clerk

router = APIRouter(prefix="/api/officers", tags=["Officers"])


# ================= SCHEMAS =================

class OfficerInvite(BaseModel):
    name: str | None = None
    email: EmailStr
    rank: str | None = None
    badge: str | None = None
    phone: str | None = None


# ================= ROUTES =================

@router.get("/")
async def list_officers():
    return await prisma.policeofficer.find_many()


@router.post("/invite")
async def invite_officer(payload: OfficerInvite):
    # 1️⃣ Check if officer already exists
    existing = await prisma.policeofficer.find_unique(
        where={"email": payload.email}
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Officer with this email already exists",
        )

    try:
        # 2️⃣ Send Clerk invitation email
        clerk.invitations.create_invitation(
            email_address=payload.email,
            public_metadata={
                "role": "OFFICER",
            },
        )

        # 3️⃣ Store officer in DB
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
            "message": "Invitation email sent successfully",
            "officer": officer,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invitation failed: {str(e)}",
        )