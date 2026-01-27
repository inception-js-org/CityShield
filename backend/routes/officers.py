from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from prisma_client import prisma
from clerk_client import create_clerk_invitation

router = APIRouter(prefix="/api/officers", tags=["Officers"])


# ================= SCHEMAS =================

class OfficerInvite(BaseModel):
    name: str | None = None
    email: EmailStr
    rank: str | None = None
    badge: str | None = None
    phone: str | None = None


# ================= ROUTES =================

@router.get("")
async def list_officers():
    return await prisma.policeofficer.find_many()


@router.post("/invite")
async def invite_officer(payload: OfficerInvite):
    # 0️⃣ Prevent duplicate officers
    existing = await prisma.policeofficer.find_unique(
        where={"email": payload.email}
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Officer with this email already exists",
        )

    # 1️⃣ Send Clerk invitation email
    invite = create_clerk_invitation(payload.email)

    # 2️⃣ Store officer locally as INVITED
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
        "clerk_invite_id": invite["id"],
        "officer": officer,
    }


# ================= CLERK WEBHOOK =================

@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    payload = await request.json()

    event = payload.get("type")
    data = payload.get("data")

    # We care only about these
    if event not in ("invitation.accepted", "user.created"):
        return {"ignored": True}

    # Clerk user info
    clerk_user_id = data.get("id")
    email_addresses = data.get("email_addresses", [])

    if not email_addresses:
        return {"error": "No email found"}

    email = email_addresses[0]["email_address"]

    # Find officer
    officer = await prisma.policeofficer.find_unique(
        where={"email": email}
    )

    if not officer:
        return {"error": "Officer not found"}

    # Activate officer ONLY once
    if officer.status != "ACTIVE":
        await prisma.policeofficer.update(
            where={"email": email},
            data={
                "status": "ACTIVE",
                "clerkUserId": clerk_user_id,
            }
        )

    return {"status": "ACTIVE"}