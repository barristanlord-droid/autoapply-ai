import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(Text, nullable=True)  # null for OAuth users
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # OAuth
    auth_provider: Mapped[str] = mapped_column(String(20), default="email")  # email|google|linkedin
    provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Tier
    tier: Mapped[str] = mapped_column(String(20), default="free")  # free|pro|premium

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete")
    applications = relationship("Application", back_populates="user", cascade="all, delete")
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    credit_balance = relationship("CreditBalance", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete")
