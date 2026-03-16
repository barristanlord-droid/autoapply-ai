"""
Celery background tasks for heavy/async operations:
- Resume parsing
- Job scraping
- Embedding generation
- Auto-apply processing
"""

import asyncio
import json
import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger()


def run_async(coro):
    """Helper to run async code in sync Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3)
def parse_resume(self, resume_id: str, content_encoded: str):
    """Parse an uploaded resume: extract text, parse with AI, generate embedding."""

    async def _parse():
        from sqlalchemy import select
        from app.core.database import async_session
        from app.models.resume import Resume
        from app.models.profile import Profile, Skill, UserSkill
        from app.services.resume_parser import parse_resume_text, generate_profile_embedding

        async with async_session() as db:
            result = await db.execute(select(Resume).where(Resume.id == resume_id))
            resume = result.scalar_one_or_none()
            if not resume:
                logger.error("resume_not_found", resume_id=resume_id)
                return

            try:
                raw_text = content_encoded.encode("latin-1").decode("utf-8", errors="replace")

                # AI parsing
                parsed_data = await parse_resume_text(raw_text)

                # Update resume
                resume.raw_text = raw_text
                resume.parsed_data = parsed_data
                resume.is_parsed = True

                # Update profile
                profile_result = await db.execute(
                    select(Profile).where(Profile.user_id == resume.user_id)
                )
                profile = profile_result.scalar_one_or_none()

                if profile:
                    profile.headline = parsed_data.get("headline")
                    profile.summary = parsed_data.get("summary")
                    profile.years_of_experience = parsed_data.get("years_of_experience")
                    profile.parsed_data = parsed_data

                    # Sync skills
                    for skill_data in parsed_data.get("skills", []):
                        # Find or create skill
                        skill_result = await db.execute(
                            select(Skill).where(Skill.name == skill_data["name"])
                        )
                        skill = skill_result.scalar_one_or_none()
                        if not skill:
                            skill = Skill(
                                name=skill_data["name"],
                                category=skill_data.get("category", "technical"),
                            )
                            db.add(skill)
                            await db.flush()

                        # Link to user
                        existing_link = await db.execute(
                            select(UserSkill).where(
                                UserSkill.profile_id == profile.id,
                                UserSkill.skill_id == skill.id,
                            )
                        )
                        if not existing_link.scalar_one_or_none():
                            db.add(UserSkill(
                                profile_id=profile.id,
                                skill_id=skill.id,
                                proficiency=skill_data.get("proficiency"),
                                source="parsed",
                            ))

                    # Generate embedding
                    embedding = await generate_profile_embedding(parsed_data)
                    profile.embedding = embedding

                await db.commit()
                logger.info("resume_parsed_successfully", resume_id=resume_id)

            except Exception as e:
                logger.error("resume_parse_failed", resume_id=resume_id, error=str(e))
                await db.rollback()
                raise

    try:
        run_async(_parse())
    except Exception as exc:
        self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@celery_app.task(bind=True, max_retries=3)
def generate_application_materials(self, application_id: str, tone: str = "professional"):
    """Generate cover letter and tailored resume for an application."""

    async def _generate():
        from sqlalchemy import select
        from app.core.database import async_session
        from app.models.application import Application
        from app.services.ai_generator import generate_cover_letter, tailor_resume

        async with async_session() as db:
            result = await db.execute(select(Application).where(Application.id == application_id))
            app = result.scalar_one_or_none()
            if not app:
                return

            try:
                # Generate cover letter
                cl = await generate_cover_letter(app.user_id, app.job_id, tone, None, db)
                app.cover_letter_id = cl.id

                # Tailor resume
                tr_result = await tailor_resume(app.user_id, app.job_id, db)
                app.tailored_resume_id = tr_result["id"]

                app.status = "ready"
                await db.commit()
                logger.info("application_materials_generated", application_id=application_id)

            except Exception as e:
                logger.error("material_generation_failed", application_id=application_id, error=str(e))
                await db.rollback()
                raise

    try:
        run_async(_generate())
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=2)
def process_auto_apply(self, application_id: str, tone: str = "professional"):
    """Full auto-apply pipeline: generate materials + submit application."""

    async def _auto_apply():
        from sqlalchemy import select
        from app.core.database import async_session
        from app.models.application import Application
        from app.services.ai_generator import generate_cover_letter, tailor_resume

        async with async_session() as db:
            result = await db.execute(select(Application).where(Application.id == application_id))
            app = result.scalar_one_or_none()
            if not app:
                return

            try:
                # Step 1: Generate materials
                cl = await generate_cover_letter(app.user_id, app.job_id, tone, None, db)
                app.cover_letter_id = cl.id

                tr_result = await tailor_resume(app.user_id, app.job_id, db)
                app.tailored_resume_id = tr_result["id"]

                # Step 2: Submit (placeholder - real implementation would use
                # browser automation or API integration per job board)
                app.status = "submitted"
                app.submission_method = "auto"

                await db.commit()
                logger.info("auto_apply_completed", application_id=application_id)

            except Exception as e:
                logger.error("auto_apply_failed", application_id=application_id, error=str(e))
                app.status = "failed"
                await db.commit()
                raise

    try:
        run_async(_auto_apply())
    except Exception as exc:
        self.retry(exc=exc, countdown=120)


@celery_app.task
def scrape_new_jobs():
    """Periodic task: scrape new jobs from various sources."""
    logger.info("job_scraping_started")
    # Implementation would integrate with job board APIs
    # (Indeed API, LinkedIn API, direct scraping with rate limiting)


@celery_app.task
def refresh_job_embeddings():
    """Periodic task: generate embeddings for new jobs without embeddings."""

    async def _refresh():
        from sqlalchemy import select
        from app.core.database import async_session
        from app.models.job import JobListing
        from app.services.job_matcher import generate_job_embedding

        async with async_session() as db:
            result = await db.execute(
                select(JobListing).where(
                    JobListing.is_active.is_(True),
                    JobListing.embedding.is_(None),
                ).limit(100)
            )
            jobs = result.scalars().all()

            for job in jobs:
                try:
                    embedding = await generate_job_embedding(job)
                    job.embedding = embedding
                except Exception as e:
                    logger.error("embedding_failed", job_id=str(job.id), error=str(e))

            await db.commit()
            logger.info("embeddings_refreshed", count=len(jobs))

    run_async(_refresh())


@celery_app.task
def deactivate_expired_jobs():
    """Periodic task: mark expired jobs as inactive."""
    logger.info("deactivating_expired_jobs")


@celery_app.task
def refill_monthly_credits():
    """Periodic task: refill credits for active subscriptions."""
    logger.info("refilling_monthly_credits")
