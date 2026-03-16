import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )

    # Parsed resume data
    headline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Location preferences
    current_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    preferred_locations: Mapped[str | None] = mapped_column(Text, nullable=True)
    open_to_remote: Mapped[bool] = mapped_column(Boolean, default=True)
    open_to_relocation: Mapped[bool] = mapped_column(Boolean, default=False)

    # Job preferences
    desired_job_titles: Mapped[str | None] = mapped_column(Text, nullable=True)
    desired_industries: Mapped[str | None] = mapped_column(Text, nullable=True)
    desired_salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    desired_salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(3), default="USD")
    job_type_preferences: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # full-time, part-time, contract, internship
    requires_visa_sponsorship: Mapped[bool] = mapped_column(Boolean, default=False)

    # Embedding for matching
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Raw parsed data from resume
    parsed_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="profile")
    skills = relationship("UserSkill", back_populates="profile", cascade="all, delete")
    work_experiences = relationship("WorkExperience", back_populates="profile", cascade="all, delete")
    education = relationship("Education", back_populates="profile", cascade="all, delete")


class Skill(Base):
    """Global skills taxonomy"""
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)  # technical, soft, language
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id"))
    proficiency: Mapped[str | None] = mapped_column(String(20), nullable=True)  # beginner|intermediate|advanced|expert
    years: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="parsed")  # parsed|manual

    profile = relationship("Profile", back_populates="skills")
    skill = relationship("Skill")


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    company: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(20), nullable=True)  # null = current
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    highlights: Mapped[str | None] = mapped_column(Text, nullable=True)

    profile = relationship("Profile", back_populates="work_experiences")


class Education(Base):
    __tablename__ = "education"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE")
    )
    institution: Mapped[str] = mapped_column(String(255))
    degree: Mapped[str | None] = mapped_column(String(255), nullable=True)
    field_of_study: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gpa: Mapped[float | None] = mapped_column(Float, nullable=True)

    profile = relationship("Profile", back_populates="education")
