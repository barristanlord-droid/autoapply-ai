import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE")
    )

    # File info
    filename: Mapped[str] = mapped_column(String(255))
    file_url: Mapped[str] = mapped_column(Text)  # S3 URL
    file_type: Mapped[str] = mapped_column(String(10))  # pdf, docx
    file_size: Mapped[int] = mapped_column(Integer)  # bytes

    # Parsing
    is_parsed: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    parsed_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "Software Engineer Resume"

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="resumes")
