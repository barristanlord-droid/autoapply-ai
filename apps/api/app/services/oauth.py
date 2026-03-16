"""OAuth verification for Google and LinkedIn sign-in."""

import httpx
from fastapi import HTTPException


async def verify_oauth_token(provider: str, access_token: str) -> dict:
    """Verify OAuth access token and return user info."""
    if provider == "google":
        return await _verify_google(access_token)
    elif provider == "linkedin":
        return await _verify_linkedin(access_token)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


async def _verify_google(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        data = resp.json()
        return {
            "email": data["email"],
            "name": data.get("name", data["email"]),
            "picture": data.get("picture"),
            "sub": data["sub"],
        }


async def _verify_linkedin(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid LinkedIn token")
        data = resp.json()
        return {
            "email": data["email"],
            "name": data.get("name", data["email"]),
            "picture": data.get("picture"),
            "sub": data["sub"],
        }
