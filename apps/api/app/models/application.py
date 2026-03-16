import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_listings.id", ondelete="CASCADE"), index=True
    )

    # Status tracking
    status: Mapped[str] = mapped_column(
        String(30), default="draft", index=True
    )  # draft|ready|submitted|viewed|interview|rejected|offer|accepted|withdrawn

    # Application materials
    tailored_resume_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tailored_resumes.id"), nullable=True
    )
    cover_letter_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("cover_letters.id"), nullable=True
    )

    # Submission details
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    submission_method: Mapped[str | None] = mapped_column(String(30), nullable=True)  # auto|manual|one-click
    submission_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # form fields submitted

    # Tracking
    match_score: Mapped[float | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_history: Mapped[str | None] = mapped_column(Text, nullable=True)  # [{status, timestamp, note}]

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("JobListing", back_populates="applications")
    tailored_resume = relationship("TailoredResume")
    cover_letter = relationship("CoverLetter")


class TailoredResume(Base):
    __tablename__ = "tailored_resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE")
    )
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_listings.id"))
    base_resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id"))

    content: Mapped[str] = mapped_column(Text)  # Markdown/structured content
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # Generated PDF URL
    modifications: Mapped[str | None] = mapped_column(Text, nullable=True)  # What was changed and why

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE")
    )
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_listings.id"))

    content: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(String(20), default="professional")  # professional, casual, enthusiastic
    version: Mapped[int] = mapped_column(default=1)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
