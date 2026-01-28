from fastapi import APIRouter, HTTPException, Request
from prisma import Prisma
from pydantic import BaseModel, EmailStr
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/api/officers", tags=["officers"])

# Clerk API configuration
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_API_URL = "https://api.clerk.com/v1"


# ================= SCHEMAS =================

class OfficerInvite(BaseModel):
    email: EmailStr
    name: str
    rank: Optional[str] = None
    badge: Optional[str] = None
    phone: Optional[str] = None


class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    rank: Optional[str] = None
    badge: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


# ================= CLERK HELPER =================

def create_clerk_invitation(email: str) -> dict:
    """
    Send an invitation email via Clerk API.
    Returns the invitation object from Clerk.
    
    Flow:
    1. Clerk sends invitation email to the user
    2. User clicks link → goes to Clerk's hosted sign-up page
    3. User signs up on Clerk's hosted page
    4. Clerk generates clerkUserId and fires webhook
    5. Our webhook updates officer with clerkUserId and sets ACTIVE
    6. User is redirected to our app (already authenticated)
    """
    print(f"🔑 CLERK_SECRET_KEY configured: {bool(CLERK_SECRET_KEY)}")
    
    if not CLERK_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="CLERK_SECRET_KEY not configured. Please set it in your .env file."
        )
    
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    
    # DO NOT set redirect_url - let Clerk use its hosted sign-up page
    # The user will be redirected to your app AFTER signing up via Clerk Dashboard settings
    payload = {
        "email_address": email,
        "notify": True,  # This sends the invitation email
        # "redirect_url" is intentionally omitted to use Clerk's hosted pages
    }
    
    # Optional: Set redirect URL to where user goes AFTER completing signup
    # This should be your app's dashboard, not the sign-up page
    post_signup_redirect = os.getenv("CLERK_AFTER_SIGNUP_URL")
    if post_signup_redirect:
        payload["redirect_url"] = post_signup_redirect
    
    print(f"📧 Clerk API request: {CLERK_API_URL}/invitations")
    print(f"📧 Payload: {payload}")
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{CLERK_API_URL}/invitations",
                headers=headers,
                json=payload,
            )
            
            response_data = response.json()
            print(f"📨 Clerk API status: {response.status_code}")
            print(f"📨 Clerk API response: {response_data}")
            
            if response.status_code not in (200, 201):
                # Extract error message from Clerk response
                errors = response_data.get("errors", [])
                if errors:
                    error_message = errors[0].get("message", "Failed to send invitation")
                    error_code = errors[0].get("code", "unknown_error")
                else:
                    error_message = "Failed to send invitation"
                    error_code = "unknown_error"
                
                print(f"❌ Clerk API error: {error_code} - {error_message}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Clerk API error ({error_code}): {error_message}"
                )
            
            print(f"✅ Invitation sent! Invite ID: {response_data.get('id')}")
            return response_data
            
    except httpx.RequestError as e:
        print(f"❌ Failed to connect to Clerk API: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Clerk API: {str(e)}"
        )


def revoke_clerk_invitation(invitation_id: str) -> dict:
    """
    Revoke a pending invitation via Clerk API.
    """
    if not CLERK_SECRET_KEY:
        return {"error": "CLERK_SECRET_KEY not configured"}
    
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{CLERK_API_URL}/invitations/{invitation_id}/revoke",
                headers=headers,
            )
            
            if response.status_code not in (200, 201):
                return {"error": "Failed to revoke invitation"}
            
            return response.json()
            
    except httpx.RequestError:
        return {"error": "Failed to connect to Clerk API"}


# ================= ROUTES =================

@router.get("/")
async def get_officers():
    """Get all officers"""
    prisma = Prisma()
    await prisma.connect()
    try:
        officers = await prisma.policeofficer.find_many(
            order={"createdAt": "desc"}
        )
        return officers
    finally:
        await prisma.disconnect()


@router.get("/available")
async def get_available_officers():
    """Get officers not currently on active patrol"""
    prisma = Prisma()
    await prisma.connect()
    try:
        # Get all active patrol officer IDs
        active_patrols = await prisma.patrol.find_many(
            where={"status": "ACTIVE"},
            include={"officers": True}
        )
        
        active_officer_ids = set()
        for patrol in active_patrols:
            for officer in patrol.officers:
                active_officer_ids.add(officer.id)
        
        # Get all active officers not on patrol
        all_officers = await prisma.policeofficer.find_many(
            where={"status": "ACTIVE"}
        )
        
        available = [o for o in all_officers if o.id not in active_officer_ids]
        return available
    finally:
        await prisma.disconnect()


@router.get("/{officer_id}")
async def get_officer(officer_id: str):
    """Get a specific officer by ID"""
    prisma = Prisma()
    await prisma.connect()
    try:
        officer = await prisma.policeofficer.find_unique(
            where={"id": officer_id},
            include={
                "patrols": True,
                "leadingPatrols": True,
                "firsRegistered": True,
                "firsAssigned": True
            }
        )
        if not officer:
            raise HTTPException(status_code=404, detail="Officer not found")
        return officer
    finally:
        await prisma.disconnect()


@router.post("/invite")
async def invite_officer(payload: OfficerInvite):
    """
    Invite a new officer:
    1. Check for duplicate email
    2. Send Clerk invitation email
    3. Store officer in database as INVITED
    """
    prisma = Prisma()
    await prisma.connect()
    try:
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
        print(f"📧 Sending Clerk invitation to: {payload.email}")
        invite = create_clerk_invitation(payload.email)
        print(f"✅ Clerk invitation sent. Invite ID: {invite.get('id')}")

        # 2️⃣ Store officer locally as INVITED
        # Note: clerkUserId will be set later when user accepts invite and signs up
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
        print(f"✅ Officer created in DB: {officer.id}")

        return {
            "message": "Invitation email sent successfully",
            "clerk_invite_id": invite.get("id"),
            "officer": officer,
        }
    finally:
        await prisma.disconnect()


# ================= CLERK WEBHOOK =================

@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    """
    Clerk webhook endpoint to handle invitation.accepted and user.created events.
    This activates officers when they accept their invitation and sign up via Clerk.
    
    Configure this webhook URL in Clerk Dashboard:
    https://your-domain.com/api/officers/webhooks/clerk
    
    Events to subscribe:
    - invitation.accepted
    - user.created
    """
    prisma = Prisma()
    await prisma.connect()
    try:
        payload = await request.json()

        event_type = payload.get("type")
        data = payload.get("data", {})

        # Log the event for debugging
        print(f"📩 Clerk webhook received: {event_type}")
        print(f"📩 Webhook data: {data}")

        # We care only about these events
        if event_type not in ("invitation.accepted", "user.created"):
            print(f"ℹ️ Ignoring event: {event_type}")
            return {"ignored": True, "event": event_type}

        # Extract Clerk user ID
        clerk_user_id = data.get("id")
        
        # Extract email from the event data
        email_addresses = data.get("email_addresses", [])
        
        if not email_addresses:
            print("⚠️ No email addresses found in webhook payload")
            return {"error": "No email found in payload"}

        # Get the primary email
        email = email_addresses[0].get("email_address")
        
        if not email:
            return {"error": "Could not extract email"}

        print(f"🔍 Looking up officer with email: {email}")

        # Find officer by email
        officer = await prisma.policeofficer.find_unique(
            where={"email": email}
        )

        if not officer:
            print(f"⚠️ Officer not found for email: {email}")
            return {"error": "Officer not found", "email": email}

        # Activate officer ONLY if not already active
        if officer.status != "ACTIVE":
            print(f"✅ Activating officer: {officer.name} ({email})")
            
            updated_officer = await prisma.policeofficer.update(
                where={"email": email},
                data={
                    "status": "ACTIVE",
                    "clerkUserId": clerk_user_id,
                }
            )
            
            print(f"✅ Officer activated! ID: {updated_officer.id}, ClerkUserId: {clerk_user_id}")
            
            return {
                "status": "activated",
                "officer_id": updated_officer.id,
                "officer_name": updated_officer.name,
                "clerk_user_id": clerk_user_id
            }
        else:
            print(f"ℹ️ Officer already active: {officer.name}")
            return {
                "status": "already_active",
                "officer_id": officer.id
            }
            
    except Exception as e:
        print(f"❌ Webhook error: {str(e)}")
        return {"error": str(e)}
    finally:
        await prisma.disconnect()


@router.patch("/{officer_id}")
async def update_officer(officer_id: str, data: OfficerUpdate):
    """Update an officer's details"""
    prisma = Prisma()
    await prisma.connect()
    try:
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.rank is not None:
            update_data["rank"] = data.rank
        if data.badge is not None:
            update_data["badge"] = data.badge
        if data.phone is not None:
            update_data["phone"] = data.phone
        if data.status is not None:
            update_data["status"] = data.status.upper()
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        officer = await prisma.policeofficer.update(
            where={"id": officer_id},
            data=update_data
        )
        return officer
    except Exception as e:
        if "Record to update not found" in str(e):
            raise HTTPException(status_code=404, detail="Officer not found")
        raise
    finally:
        await prisma.disconnect()


@router.delete("/{officer_id}")
async def delete_officer(officer_id: str):
    """Delete an officer"""
    prisma = Prisma()
    await prisma.connect()
    try:
        # Get officer first
        officer = await prisma.policeofficer.find_unique(
            where={"id": officer_id}
        )
        
        if not officer:
            raise HTTPException(status_code=404, detail="Officer not found")
        
        # Delete from database
        await prisma.policeofficer.delete(where={"id": officer_id})
        
        return {"message": "Officer deleted successfully"}
    finally:
        await prisma.disconnect()