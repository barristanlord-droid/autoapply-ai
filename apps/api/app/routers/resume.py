import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.resume import Resume
from app.models.user import User

router = APIRouter(prefix="/resume", tags=["Resume"])

ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    label: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a resume (PDF or DOCX). Triggers AI parsing."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    file_type = "pdf" if "pdf" in file.content_type else "docx"

    # Upload to S3
    from app.services.storage import upload_file

    file_url = await upload_file(
        content, f"resumes/{current_user.id}/{file.filename}", file.content_type
    )

    # Check if first resume (make it primary)
    existing = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id)
    )
    is_first = existing.scalar_one_or_none() is None

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_url=file_url,
        file_type=file_type,
        file_size=len(content),
        is_primary=is_first,
        label=label,
    )
    db.add(resume)
    await db.flush()

    # Trigger async parsing
    from app.workers.tasks import parse_resume

    parse_resume.delay(str(resume.id), content.decode("latin-1"))

    return {
        "id": resume.id,
        "filename": resume.filename,
        "status": "parsing",
        "message": "Resume uploaded. AI parsing in progress.",
    }


@router.get("")
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "is_parsed": r.is_parsed,
            "is_primary": r.is_primary,
            "label": r.label,
            "created_at": r.created_at,
        }
        for r in resumes
    ]


@router.get("/{resume_id}/parsed")
async def get_parsed_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the AI-parsed data from a resume."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.is_parsed:
        return {"status": "parsing", "message": "Resume is still being parsed"}

    return {
        "id": resume.id,
        "filename": resume.filename,
        "parsed_data": resume.parsed_data,
        "raw_text": resume.raw_text[:500] if resume.raw_text else None,
    }


@router.post("/{resume_id}/set-primary")
async def set_primary_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Unset current primary
    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id, Resume.is_primary.is_(True))
    )
    current_primary = result.scalar_one_or_none()
    if current_primary:
        current_primary.is_primary = False

    # Set new primary
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume.is_primary = True

    return {"status": "ok", "primary_resume_id": resume.id}
