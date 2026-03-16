"""
AI Content Generator — Generates tailored cover letters, resume modifications,
interview prep materials, and resume feedback.
"""

import json
import uuid
import structlog

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.application import CoverLetter, TailoredResume
from app.models.job import JobListing
from app.models.profile import Profile
from app.models.resume import Resume

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = structlog.get_logger()


async def _get_user_context(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """Fetch user profile and resume data for AI context."""
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == user_id, Resume.is_primary.is_(True))
    )
    resume = resume_result.scalar_one_or_none()

    return {
        "profile": profile.parsed_data if profile else {},
        "resume_text": resume.raw_text if resume else "",
        "headline": profile.headline if profile else "",
        "skills": [s.skill.name for s in (profile.skills if profile else [])],
    }


async def generate_cover_letter(
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    tone: str,
    custom_instructions: str | None,
    db: AsyncSession,
) -> CoverLetter:
    """Generate a personalized cover letter using GPT-4."""
    # Fetch context
    user_ctx = await _get_user_context(user_id, db)
    job_result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise ValueError("Job not found")

    system_prompt = f"""You are an expert career coach writing cover letters.
Write a {tone} cover letter for the candidate below, tailored to the specific job.

Rules:
- Keep it under 400 words
- Open with a compelling hook, not "I am writing to apply for..."
- Connect specific experiences/skills to job requirements
- Show genuine interest in the company
- End with a clear call to action
- Be authentic, not generic
- Use concrete metrics and achievements from the resume
{"- Additional instructions: " + custom_instructions if custom_instructions else ""}"""

    user_prompt = f"""CANDIDATE PROFILE:
{json.dumps(user_ctx['profile'], indent=2, default=str)}

JOB:
Title: {job.title}
Company: {job.company_name}
Description: {job.description[:3000]}
Required Skills: {', '.join(job.required_skills or [])}"""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    content = response.choices[0].message.content

    # Count existing versions
    existing = await db.execute(
        select(CoverLetter).where(
            CoverLetter.user_id == user_id,
            CoverLetter.job_id == job_id,
        )
    )
    version = len(existing.scalars().all()) + 1

    cover_letter = CoverLetter(
        user_id=user_id,
        job_id=job_id,
        content=content,
        tone=tone,
        version=version,
    )
    db.add(cover_letter)
    await db.flush()

    logger.info("cover_letter_generated", user_id=str(user_id), job_id=str(job_id), tone=tone)
    return cover_letter


async def tailor_resume(
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """Generate a tailored resume optimized for a specific job."""
    user_ctx = await _get_user_context(user_id, db)
    job_result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise ValueError("Job not found")

    system_prompt = """You are an expert resume optimizer. Given a candidate's resume and a target job,
suggest specific modifications to maximize ATS compatibility and recruiter appeal.

Return JSON with:
{
  "optimized_summary": "New professional summary tailored to this role",
  "skill_reordering": ["skills ordered by relevance to this job"],
  "experience_modifications": [
    {
      "company": "company name",
      "title": "potentially updated title",
      "modified_highlights": ["rewritten bullet points emphasizing relevant achievements"]
    }
  ],
  "keywords_to_add": ["ATS keywords from job description not in resume"],
  "keywords_present": ["keywords already matching"],
  "match_score": 85,
  "improvement_tips": ["specific actionable tips"]
}"""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"RESUME:\n{user_ctx['resume_text'][:5000]}\n\nJOB:\n{job.title} at {job.company_name}\n{job.description[:3000]}",
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=3000,
    )

    modifications = json.loads(response.choices[0].message.content)

    # Get primary resume
    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == user_id, Resume.is_primary.is_(True))
    )
    resume = resume_result.scalar_one_or_none()

    tailored = TailoredResume(
        user_id=user_id,
        job_id=job_id,
        base_resume_id=resume.id if resume else None,
        content=json.dumps(modifications),
        modifications=modifications,
    )
    db.add(tailored)
    await db.flush()

    return {"id": tailored.id, "modifications": modifications}


async def analyze_resume(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """Provide comprehensive feedback on a resume."""
    user_ctx = await _get_user_context(user_id, db)
    if not user_ctx["resume_text"]:
        raise ValueError("No resume found. Please upload a resume first.")

    system_prompt = """You are a senior recruiter and career coach. Analyze this resume and provide
actionable feedback. Return JSON:
{
  "overall_score": 0-100,
  "strengths": ["what's working well"],
  "weaknesses": ["areas for improvement"],
  "ats_score": 0-100,
  "ats_issues": ["specific ATS compatibility issues"],
  "formatting_suggestions": ["formatting improvements"],
  "content_suggestions": ["content improvements"],
  "missing_sections": ["sections that should be added"],
  "action_items": [
    {"priority": "high|medium|low", "action": "specific action to take"}
  ]
}"""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze this resume:\n\n{user_ctx['resume_text'][:6000]}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=2000,
    )

    return json.loads(response.choices[0].message.content)


async def generate_interview_prep(
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """Generate interview preparation materials."""
    user_ctx = await _get_user_context(user_id, db)
    job_result = await db.execute(select(JobListing).where(JobListing.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise ValueError("Job not found")

    system_prompt = """You are an expert interview coach. Generate comprehensive interview preparation
materials. Return JSON:
{
  "likely_questions": [
    {"question": "string", "type": "behavioral|technical|situational", "tip": "how to answer well",
     "sample_answer_outline": "key points to cover"}
  ],
  "questions_to_ask": ["smart questions the candidate should ask the interviewer"],
  "company_research_points": ["things to research about the company"],
  "key_talking_points": ["experience/skills to emphasize"],
  "potential_concerns": ["gaps or weaknesses to prepare for"],
  "salary_negotiation_tips": ["specific tips for this role/company"]
}"""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"CANDIDATE:\n{json.dumps(user_ctx['profile'], default=str)[:3000]}\n\nJOB:\n{job.title} at {job.company_name}\n{job.description[:2000]}",
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.5,
        max_tokens=3000,
    )

    return json.loads(response.choices[0].message.content)
