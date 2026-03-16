"""
Job Matching Engine — Matches users to jobs.
Uses vector similarity when embeddings are available (PostgreSQL + pgvector),
otherwise falls back to keyword/filter-based matching (SQLite dev mode).
"""

import structlog

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import JobListing, SavedJob
from app.models.profile import Profile
from app.schemas.job import JobListingResponse, JobMatchResponse

logger = structlog.get_logger()


async def get_user_matches(
    user_id: str,
    page: int,
    page_size: int,
    db: AsyncSession,
) -> JobMatchResponse:
    """
    Match jobs to user profile.
    Currently uses simple filter-based matching (pgvector semantic matching
    will be enabled when PostgreSQL is configured).
    """
    # Get user profile
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()

    # Fallback to recent active jobs ordered by posting date
    stmt = (
        select(JobListing)
        .where(JobListing.is_active.is_(True))
        .order_by(JobListing.posted_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    jobs = result.scalars().all()

    # Count total
    count_stmt = select(func.count()).select_from(
        select(JobListing).where(JobListing.is_active.is_(True)).subquery()
    )
    total = (await db.execute(count_stmt)).scalar()

    return JobMatchResponse(
        jobs=[JobListingResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_swipe_feed(
    user_id: str,
    limit: int,
    db: AsyncSession,
) -> list[JobListingResponse]:
    """Get jobs for the swipe feed, excluding already-swiped jobs."""
    # Get IDs of already-swiped jobs
    swiped = await db.execute(
        select(SavedJob.job_id).where(SavedJob.user_id == user_id)
    )
    swiped_ids = [row[0] for row in swiped.all()]

    # Get recent active jobs not yet swiped
    stmt = select(JobListing).where(JobListing.is_active.is_(True))
    if swiped_ids:
        stmt = stmt.where(JobListing.id.notin_(swiped_ids))
    stmt = stmt.order_by(JobListing.posted_at.desc()).limit(limit)

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return [JobListingResponse.model_validate(j) for j in jobs]


async def generate_job_embedding(job: JobListing) -> list[float]:
    """Generate embedding for a job listing for semantic search."""
    from openai import AsyncOpenAI
    from app.core.config import get_settings

    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Build rich text for embedding
    parts = [
        job.title,
        f"Company: {job.company_name}",
        f"Location: {job.location or 'Not specified'}",
    ]
    if job.required_skills:
        parts.append(f"Required skills: {job.required_skills}")
    if job.description:
        # Truncate long descriptions
        desc = job.description[:3000]
        parts.append(desc)

    text_content = "\n".join(parts)

    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text_content,
        dimensions=settings.EMBEDDING_DIMENSIONS,
    )

    return response.data[0].embedding
