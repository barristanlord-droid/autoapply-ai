import json
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, hash_password, verify_password
from app.models.user import User
from app.models.profile import Profile, UserSkill, WorkExperience, Education
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])
logger = structlog.get_logger()


# ── Combined user + profile response ──

class MeResponse(UserResponse):
    """Extends UserResponse with embedded profile data."""
    profile: ProfileResponse | None = None


@router.get("/me", response_model=MeResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user with profile, skills, work experience, and education."""
    # Eagerly load all nested relationships
    result = await db.execute(
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.profile)
            .selectinload(Profile.skills)
            .selectinload(UserSkill.skill),
            selectinload(User.profile)
            .selectinload(Profile.work_experiences),
            selectinload(User.profile)
            .selectinload(Profile.education),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return MeResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's basic info (name, avatar)."""
    if update.full_name is not None:
        current_user.full_name = update.full_name
    if update.avatar_url is not None:
        current_user.avatar_url = update.avatar_url

    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    logger.info("user_updated", user_id=current_user.id)
    return UserResponse.model_validate(current_user)


@router.put("/me/profile", response_model=ProfileResponse)
async def update_profile(
    update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile / career preferences."""
    # Get profile with relationships loaded
    result = await db.execute(
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(
            selectinload(Profile.skills).selectinload(UserSkill.skill),
            selectinload(Profile.work_experiences),
            selectinload(Profile.education),
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Apply updates
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # JSON-serialise list fields for SQLite Text columns
        if isinstance(value, list):
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)

    profile.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(profile)

    # Re-query with relationships for the response
    result = await db.execute(
        select(Profile)
        .where(Profile.id == profile.id)
        .options(
            selectinload(Profile.skills).selectinload(UserSkill.skill),
            selectinload(Profile.work_experiences),
            selectinload(Profile.education),
        )
    )
    profile = result.scalar_one()
    logger.info("profile_updated", user_id=current_user.id)
    return ProfileResponse.model_validate(profile)


@router.put("/me/password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="Cannot change password for OAuth accounts",
        )

    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    current_user.hashed_password = hash_password(new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info("password_changed", user_id=current_user.id)
    return {"message": "Password updated successfully"}
