from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.application import Application, CoverLetter, TailoredResume
from app.models.job import JobListing
from app.models.subscription import CreditBalance
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationResponse,
    ApplicationStatusUpdate,
    AutoApplyRequest,
    AutoApplyResponse,
    CoverLetterGenerate,
    CoverLetterResponse,
    DashboardStats,
    TailoredResumeResponse,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=list[ApplicationResponse])
async def list_applications(
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Application)
        .options(joinedload(Application.job))
        .where(Application.user_id == current_user.id)
    )
    if status:
        stmt = stmt.where(Application.status == status)
    stmt = stmt.order_by(Application.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    apps = result.unique().scalars().all()

    return [
        ApplicationResponse(
            **{
                "id": a.id,
                "job_id": a.job_id,
                "status": a.status,
                "match_score": a.match_score,
                "submitted_at": a.submitted_at,
                "submission_method": a.submission_method,
                "notes": a.notes,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
                "job_title": a.job.title if a.job else None,
                "company_name": a.job.company_name if a.job else None,
            }
        )
        for a in apps
    ]


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    body: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check job exists
    job_result = await db.execute(select(JobListing).where(JobListing.id == body.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check not already applied
    existing = await db.execute(
        select(Application).where(
            Application.user_id == current_user.id,
            Application.job_id == body.job_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already applied to this job")

    app = Application(user_id=current_user.id, job_id=body.job_id, status="draft")
    db.add(app)
    await db.flush()

    # Queue AI material generation if requested
    if body.auto_generate_materials:
        from app.workers.tasks import generate_application_materials

        generate_application_materials.delay(str(app.id), body.cover_letter_tone)

    return ApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        status=app.status,
        match_score=app.match_score,
        submitted_at=app.submitted_at,
        submission_method=app.submission_method,
        notes=app.notes,
        created_at=app.created_at,
        updated_at=app.updated_at,
        job_title=job.title,
        company_name=job.company_name,
    )


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Application)
        .options(joinedload(Application.job))
        .where(Application.id == application_id, Application.user_id == current_user.id)
    )
    app = result.unique().scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Update status history (stored as JSON string in SQLite)
    import json
    history = json.loads(app.status_history) if app.status_history else []
    history.append({
        "from_status": app.status,
        "to_status": body.status,
        "note": body.note,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    app.status = body.status
    app.status_history = json.dumps(history)
    if body.note:
        app.notes = body.note

    if body.status == "submitted":
        app.submitted_at = datetime.now(timezone.utc)

    return ApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        status=app.status,
        match_score=app.match_score,
        submitted_at=app.submitted_at,
        submission_method=app.submission_method,
        notes=app.notes,
        created_at=app.created_at,
        updated_at=app.updated_at,
        job_title=app.job.title if app.job else None,
        company_name=app.job.company_name if app.job else None,
    )


@router.patch("/{application_id}/notes")
async def update_application_notes(
    application_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update notes on an application."""
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.notes = body.get("notes", "")
    return {"status": "ok", "notes": app.notes}


@router.post("/auto-apply", response_model=AutoApplyResponse)
async def auto_apply(
    body: AutoApplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Queue multiple auto-apply jobs. Consumes credits."""
    # Check credits
    result = await db.execute(
        select(CreditBalance).where(CreditBalance.user_id == current_user.id)
    )
    balance = result.scalar_one_or_none()
    if not balance or balance.auto_apply_credits < len(body.job_ids):
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Need {len(body.job_ids)}, have {balance.auto_apply_credits if balance else 0}",
        )

    applications = []
    for job_id in body.job_ids:
        # Skip if already applied
        existing = await db.execute(
            select(Application).where(
                Application.user_id == current_user.id,
                Application.job_id == job_id,
            )
        )
        if existing.scalar_one_or_none():
            continue

        app = Application(
            user_id=current_user.id,
            job_id=job_id,
            status="queued",
            submission_method="auto",
        )
        db.add(app)
        applications.append(app)

    # Deduct credits
    balance.auto_apply_credits -= len(applications)
    await db.flush()

    # Queue background jobs
    from app.workers.tasks import process_auto_apply

    for app in applications:
        process_auto_apply.delay(str(app.id), body.cover_letter_tone)

    return AutoApplyResponse(
        queued=len(applications),
        credits_remaining=balance.auto_apply_credits,
        applications=[
            ApplicationResponse(
                id=a.id,
                job_id=a.job_id,
                status=a.status,
                match_score=None,
                submitted_at=None,
                submission_method="auto",
                notes=None,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in applications
        ],
    )


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get application analytics for the dashboard."""
    # Total applications
    total_result = await db.execute(
        select(func.count()).where(Application.user_id == current_user.id)
    )
    total = total_result.scalar()

    # This week
    week_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    week_result = await db.execute(
        select(func.count()).where(
            Application.user_id == current_user.id,
            Application.created_at >= week_ago,
        )
    )
    this_week = week_result.scalar()

    # Status breakdown
    status_result = await db.execute(
        select(Application.status, func.count())
        .where(Application.user_id == current_user.id)
        .group_by(Application.status)
    )
    breakdown = {row[0]: row[1] for row in status_result.all()}

    # Rates
    interview_count = breakdown.get("interview", 0)
    interview_rate = (interview_count / total * 100) if total > 0 else 0
    responded = sum(v for k, v in breakdown.items() if k not in ("draft", "queued", "submitted"))
    response_rate = (responded / total * 100) if total > 0 else 0

    # Credits
    credit_result = await db.execute(
        select(CreditBalance).where(CreditBalance.user_id == current_user.id)
    )
    credits = credit_result.scalar_one_or_none()

    return DashboardStats(
        total_applications=total,
        applications_this_week=this_week,
        interview_rate=round(interview_rate, 1),
        response_rate=round(response_rate, 1),
        status_breakdown=breakdown,
        credits_remaining={
            "auto_apply": credits.auto_apply_credits if credits else 0,
            "ai_generation": credits.ai_generation_credits if credits else 0,
        },
        top_matching_score=None,
    )


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get application analytics for charts — weekly trends, top companies, status over time."""
    now = datetime.now(timezone.utc)

    # Weekly application counts (last 8 weeks)
    weekly_data = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        count_result = await db.execute(
            select(func.count()).where(
                Application.user_id == current_user.id,
                Application.created_at >= week_start,
                Application.created_at < week_end,
            )
        )
        weekly_data.append({
            "week": week_end.strftime("%b %d"),
            "applications": count_result.scalar() or 0,
        })

    # Top companies applied to
    company_result = await db.execute(
        select(JobListing.company_name, func.count())
        .join(Application, Application.job_id == JobListing.id)
        .where(Application.user_id == current_user.id)
        .group_by(JobListing.company_name)
        .order_by(func.count().desc())
        .limit(6)
    )
    top_companies = [
        {"company": row[0], "count": row[1]} for row in company_result.all()
    ]

    # Status breakdown (for pie chart)
    status_result = await db.execute(
        select(Application.status, func.count())
        .where(Application.user_id == current_user.id)
        .group_by(Application.status)
    )
    status_breakdown = [
        {"status": row[0], "count": row[1]} for row in status_result.all()
    ]

    # Match score distribution (scores stored as 0.0–1.0 decimals)
    score_buckets = []
    for low, high, label in [(0, 0.50, "0-50%"), (0.50, 0.70, "50-70%"), (0.70, 0.85, "70-85%"), (0.85, 1.01, "85-100%")]:
        bucket_result = await db.execute(
            select(func.count()).where(
                Application.user_id == current_user.id,
                Application.match_score >= low,
                Application.match_score < high,
            )
        )
        score_buckets.append({"range": label, "count": bucket_result.scalar() or 0})

    # Recent activity (last 30 days daily)
    daily_data = []
    for i in range(29, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count_result = await db.execute(
            select(func.count()).where(
                Application.user_id == current_user.id,
                Application.created_at >= day_start,
                Application.created_at < day_end,
            )
        )
        daily_data.append({
            "date": day_start.strftime("%b %d"),
            "count": count_result.scalar() or 0,
        })

    return {
        "weekly_trend": weekly_data,
        "top_companies": top_companies,
        "status_breakdown": status_breakdown,
        "score_distribution": score_buckets,
        "daily_activity": daily_data,
    }


# NOTE: /{application_id} routes MUST be defined after /dashboard to avoid
# FastAPI matching "dashboard" as an application_id parameter.

@router.get("/{application_id}", response_model=ApplicationDetailResponse)
async def get_application_detail(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full application detail including cover letter, resume, and timeline."""
    result = await db.execute(
        select(Application)
        .options(
            joinedload(Application.job),
            joinedload(Application.cover_letter),
            joinedload(Application.tailored_resume),
        )
        .where(Application.id == application_id, Application.user_id == current_user.id)
    )
    app = result.unique().scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return ApplicationDetailResponse(
        id=app.id,
        job_id=app.job_id,
        status=app.status,
        match_score=app.match_score,
        submitted_at=app.submitted_at,
        submission_method=app.submission_method,
        notes=app.notes,
        created_at=app.created_at,
        updated_at=app.updated_at,
        job_title=app.job.title if app.job else None,
        company_name=app.job.company_name if app.job else None,
        job_location=app.job.location if app.job else None,
        job_is_remote=app.job.is_remote if app.job else None,
        job_salary_min=app.job.salary_min if app.job else None,
        job_salary_max=app.job.salary_max if app.job else None,
        job_salary_currency=app.job.salary_currency if app.job else None,
        job_type=app.job.job_type if app.job else None,
        job_apply_url=app.job.apply_url if app.job else None,
        cover_letter=CoverLetterResponse.model_validate(app.cover_letter) if app.cover_letter else None,
        tailored_resume=TailoredResumeResponse.model_validate(app.tailored_resume) if app.tailored_resume else None,
        status_history=app.status_history,
    )
