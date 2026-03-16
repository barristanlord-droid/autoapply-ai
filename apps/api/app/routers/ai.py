import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.application import CoverLetter
from app.models.chat import ChatConversation, ChatMessage
from app.models.user import User
from app.schemas.application import CoverLetterGenerate, CoverLetterResponse

router = APIRouter(prefix="/ai", tags=["AI Services"])


@router.post("/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    body: CoverLetterGenerate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI-tailored cover letter for a specific job."""
    from app.services.ai_generator import generate_cover_letter as gen_cl

    result = await gen_cl(current_user.id, body.job_id, body.tone, body.custom_instructions, db)
    return CoverLetterResponse.model_validate(result)


@router.post("/tailor-resume")
async def tailor_resume(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a tailored resume optimized for a specific job."""
    from app.services.ai_generator import tailor_resume

    result = await tailor_resume(current_user.id, job_id, db)
    return result


@router.post("/resume-feedback")
async def get_resume_feedback(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI feedback on the user's primary resume."""
    from app.services.ai_generator import analyze_resume

    return await analyze_resume(current_user.id, db)


@router.post("/chat")
async def chat(
    message: str,
    conversation_id: uuid.UUID | None = None,
    context_type: str = "general",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Chat with the AI career assistant. Supports streaming."""
    from app.services.ai_chat import process_chat_message

    response = await process_chat_message(
        user_id=current_user.id,
        message=message,
        conversation_id=conversation_id,
        context_type=context_type,
        db=db,
    )
    return response


@router.post("/chat/stream")
async def chat_stream(
    message: str,
    conversation_id: uuid.UUID | None = None,
    context_type: str = "general",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Streaming chat with the AI career assistant."""
    from app.services.ai_chat import stream_chat_message

    async def event_generator() -> AsyncGenerator[str, None]:
        async for chunk in stream_chat_message(
            user_id=current_user.id,
            message=message,
            conversation_id=conversation_id,
            context_type=context_type,
            db=db,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/chat/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatConversation)
        .where(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.updated_at.desc())
        .limit(20)
    )
    conversations = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "context_type": c.context_type,
            "updated_at": c.updated_at,
        }
        for c in conversations
    ]


@router.post("/interview-prep")
async def interview_prep(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate interview preparation materials for a specific job."""
    from app.services.ai_generator import generate_interview_prep

    return await generate_interview_prep(current_user.id, job_id, db)
