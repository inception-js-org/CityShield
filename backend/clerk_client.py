import os
import requests

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_API_BASE = "https://api.clerk.com/v1"

HEADERS = {
    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
    "Content-Type": "application/json",
}

def create_clerk_invitation(email: str, role: str = "OFFICER"):
    res = requests.post(
        f"{CLERK_API_BASE}/invitations",
        headers=HEADERS,
        json={
            "email_address": email,
            "public_metadata": {
                "role": role
            }
        },
        timeout=10,
    )

    if not res.ok:
        raise Exception(res.text)

    return res.json()