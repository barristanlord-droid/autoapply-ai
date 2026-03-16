"""
AI Resume Parser — Extracts structured data from resume text using GPT-4.
Handles PDF and DOCX formats, outputs structured JSON for profile population.
"""

import json
import io
import structlog

from openai import AsyncOpenAI
from PyPDF2 import PdfReader

from app.core.config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = structlog.get_logger()

PARSE_SYSTEM_PROMPT = """You are an expert resume parser. Extract structured information from the resume text.

Return a JSON object with exactly this structure:
{
  "full_name": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "headline": "A one-line professional headline summarizing this person",
  "summary": "2-3 sentence professional summary",
  "years_of_experience": number or null,
  "skills": [
    {"name": "skill name", "category": "technical|soft|language", "proficiency": "beginner|intermediate|advanced|expert"}
  ],
  "work_experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null (null if current)",
      "is_current": boolean,
      "description": "string",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string or null",
      "field_of_study": "string or null",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null",
      "gpa": number or null
    }
  ],
  "certifications": ["cert name"],
  "languages": [{"language": "string", "proficiency": "string"}]
}

Be thorough. Extract ALL skills mentioned, including those implied by job descriptions.
Infer years of experience from work history if not explicitly stated.
For the headline, write something compelling like "Senior Full-Stack Engineer with 5+ years in React & Node.js"."""


async def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes."""
    reader = PdfReader(io.BytesIO(content))
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n".join(text_parts)


async def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes."""
    import docx

    doc = docx.Document(io.BytesIO(content))
    return "\n".join(paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip())


async def parse_resume_text(raw_text: str) -> dict:
    """Parse resume text into structured data using GPT-4."""
    logger.info("parsing_resume", text_length=len(raw_text))

    # Truncate very long resumes to stay within token limits
    if len(raw_text) > 15000:
        raw_text = raw_text[:15000]

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": PARSE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Parse this resume:\n\n{raw_text}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,  # Low temperature for consistent extraction
        max_tokens=4000,
    )

    parsed = json.loads(response.choices[0].message.content)
    logger.info(
        "resume_parsed",
        skills_count=len(parsed.get("skills", [])),
        experience_count=len(parsed.get("work_experience", [])),
    )
    return parsed


async def generate_profile_embedding(parsed_data: dict) -> list[float]:
    """Generate an embedding vector from parsed resume data for semantic matching."""
    # Build a rich text representation for embedding
    parts = []

    if parsed_data.get("headline"):
        parts.append(parsed_data["headline"])
    if parsed_data.get("summary"):
        parts.append(parsed_data["summary"])

    skills = parsed_data.get("skills", [])
    if skills:
        skill_names = [s["name"] for s in skills]
        parts.append(f"Skills: {', '.join(skill_names)}")

    for exp in parsed_data.get("work_experience", [])[:3]:  # Top 3 most recent
        parts.append(f"{exp['title']} at {exp['company']}: {exp.get('description', '')}")

    for edu in parsed_data.get("education", []):
        edu_text = f"{edu.get('degree', '')} in {edu.get('field_of_study', '')} from {edu['institution']}"
        parts.append(edu_text)

    text = "\n".join(parts)

    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text,
        dimensions=settings.EMBEDDING_DIMENSIONS,
    )

    return response.data[0].embedding
