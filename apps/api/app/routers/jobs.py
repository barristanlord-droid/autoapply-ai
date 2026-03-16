from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.job import JobListing, SavedJob
from app.models.profile import Profile
from app.models.user import User
from app.schemas.job import (
    JobDetailResponse,
    JobListingResponse,
    JobMatchResponse,
    JobSearchParams,
    JobSwipeAction,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/search", response_model=JobMatchResponse)
async def search_jobs(
    query: str | None = None,
    location: str | None = None,
    is_remote: bool | None = None,
    job_type: str | None = None,
    salary_min: int | None = None,
    experience_level: str | None = None,
    visa_sponsorship: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search jobs with filters. Results are ranked by match score to user profile."""
    stmt = select(JobListing).where(JobListing.is_active.is_(True))

    if query:
        stmt = stmt.where(
            JobListing.title.ilike(f"%{query}%")
            | JobListing.company_name.ilike(f"%{query}%")
            | JobListing.description.ilike(f"%{query}%")
        )
    if location:
        stmt = stmt.where(JobListing.location.ilike(f"%{location}%"))
    if is_remote is not None:
        stmt = stmt.where(JobListing.is_remote == is_remote)
    if job_type:
        stmt = stmt.where(JobListing.job_type == job_type)
    if salary_min:
        stmt = stmt.where(JobListing.salary_max >= salary_min)
    if experience_level:
        stmt = stmt.where(JobListing.experience_level == experience_level)
    if visa_sponsorship is not None:
        stmt = stmt.where(JobListing.visa_sponsorship == visa_sponsorship)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar()

    # Paginate
    stmt = stmt.order_by(JobListing.posted_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return JobMatchResponse(
        jobs=[JobListingResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/matches", response_model=JobMatchResponse)
async def get_matched_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-matched jobs for the current user using vector similarity."""
    from app.services.job_matcher import get_user_matches

    return await get_user_matches(current_user.id, page, page_size, db)


@router.get("/feed", response_model=list[JobListingResponse])
async def get_job_feed(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get swipeable job feed (excludes already-swiped jobs)."""
    from app.services.job_matcher import get_swipe_feed

    return await get_swipe_feed(current_user.id, limit, db)


@router.get("/saved", response_model=list[JobListingResponse])
async def get_saved_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's bookmarked/saved jobs."""
    stmt = (
        select(JobListing)
        .join(SavedJob, SavedJob.job_id == JobListing.id)
        .where(
            SavedJob.user_id == current_user.id,
            SavedJob.action == "saved",
        )
        .order_by(SavedJob.created_at.desc())
    )
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    return [JobListingResponse.model_validate(j) for j in jobs]


@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_job_detail(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if saved/applied
    saved = await db.execute(
        select(SavedJob).where(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
    )
    is_saved = saved.scalar_one_or_none() is not None

    response = JobDetailResponse.model_validate(job)
    response.is_saved = is_saved
    return response


@router.post("/swipe")
async def swipe_job(
    body: JobSwipeAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a swipe action (like/dislike/save) for the recommendation engine."""
    existing = await db.execute(
        select(SavedJob).where(
            SavedJob.user_id == current_user.id, SavedJob.job_id == body.job_id
        )
    )
    saved = existing.scalar_one_or_none()

    if saved:
        saved.action = body.action
    else:
        db.add(SavedJob(user_id=current_user.id, job_id=body.job_id, action=body.action))

    return {"status": "ok", "action": body.action}
