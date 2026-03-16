import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class JobListing(Base):
    __tablename__ = "job_listings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Source tracking
    source: Mapped[str] = mapped_column(String(50), index=True)  # indeed, linkedin, company
    source_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    apply_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Job info
    title: Mapped[str] = mapped_column(String(500), index=True)
    company_name: Mapped[str] = mapped_column(String(255), index=True)
    company_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    description_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Location
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Compensation
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    salary_period: Mapped[str | None] = mapped_column(String(20), nullable=True)  # yearly, monthly, hourly

    # Classification
    job_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # full-time, part-time, etc.
    experience_level: Mapped[str | None] = mapped_column(String(20), nullable=True)  # entry, mid, senior
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Requirements (extracted by AI)
    required_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    education_requirement: Mapped[str | None] = mapped_column(String(100), nullable=True)
    visa_sponsorship: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # AI-extracted structured data
    structured_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Embedding for semantic search
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    applications = relationship("Application", back_populates="job")
    saved_by = relationship("SavedJob", back_populates="job")


class JobEmbedding(Base):
    """Precomputed embeddings index for fast similarity search"""
    __tablename__ = "job_embeddings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_listings.id", ondelete="CASCADE"), unique=True
    )
    embedding: Mapped[str] = mapped_column(Text)
    text_hash: Mapped[str] = mapped_column(String(64))  # detect changes

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE")
    )
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_listings.id", ondelete="CASCADE")
    )
    action: Mapped[str] = mapped_column(String(20))  # liked, disliked, saved
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="saved_jobs")
    job = relationship("JobListing", back_populates="saved_by")
