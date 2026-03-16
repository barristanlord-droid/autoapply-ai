"""
AI Career Assistant — Conversational AI for career advice, interview prep, and resume help.
Maintains conversation history and provides context-aware responses.
"""

import uuid
from typing import AsyncGenerator

import structlog
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.chat import ChatConversation, ChatMessage
from app.models.profile import Profile

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = structlog.get_logger()

SYSTEM_PROMPTS = {
    "general": """You are an AI career assistant called Careerly Coach. You help job seekers with:
- Career advice and strategy
- Resume improvement tips
- Job search strategies
- Professional development guidance

Be encouraging but honest. Give specific, actionable advice.
Keep responses concise (under 200 words unless detail is requested).
If the user asks something outside career/job topics, gently redirect.""",

    "interview_prep": """You are an expert interview coach. Help the user prepare for interviews by:
- Conducting mock interviews
- Providing feedback on answers
- Suggesting STAR method responses
- Coaching on body language and confidence
Ask one question at a time during mock interviews.""",

    "resume_review": """You are a senior recruiter reviewing resumes. Provide specific,
actionable feedback on resume content, formatting, and ATS optimization.
Focus on concrete improvements, not vague suggestions.""",

    "career_advice": """You are a senior career counselor. Help with:
- Career transitions
- Skill development planning
- Industry insights
- Networking strategies
Give nuanced, personalized advice based on the user's background.""",
}


async def process_chat_message(
    user_id: uuid.UUID,
    message: str,
    conversation_id: uuid.UUID | None,
    context_type: str,
    db: AsyncSession,
) -> dict:
    """Process a chat message and return AI response."""
    # Get or create conversation
    if conversation_id:
        result = await db.execute(
            select(ChatConversation).where(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == user_id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise ValueError("Conversation not found")
    else:
        conversation = ChatConversation(
            user_id=user_id,
            context_type=context_type,
            title=message[:50],
        )
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=message,
    )
    db.add(user_msg)

    # Build message history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at)
    )
    history = history_result.scalars().all()

    # Get user profile context
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    # Build OpenAI messages
    system_prompt = SYSTEM_PROMPTS.get(context_type, SYSTEM_PROMPTS["general"])
    if profile and profile.headline:
        system_prompt += f"\n\nUser's background: {profile.headline}"
        if profile.desired_job_titles:
            system_prompt += f"\nLooking for: {', '.join(profile.desired_job_titles)}"

    messages = [{"role": "system", "content": system_prompt}]

    # Include last 20 messages for context (avoid token overflow)
    for msg in history[-20:]:
        messages.append({"role": msg.role, "content": msg.content})

    # Add current message
    messages.append({"role": "user", "content": message})

    # Get AI response
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=1000,
    )

    ai_content = response.choices[0].message.content

    # Save AI response
    ai_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_content,
        token_count=response.usage.total_tokens if response.usage else None,
    )
    db.add(ai_msg)
    await db.flush()

    return {
        "conversation_id": conversation.id,
        "message": ai_content,
        "token_count": response.usage.total_tokens if response.usage else None,
    }


async def stream_chat_message(
    user_id: uuid.UUID,
    message: str,
    conversation_id: uuid.UUID | None,
    context_type: str,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """Stream a chat response using SSE."""
    # Similar setup as process_chat_message but with streaming
    if conversation_id:
        result = await db.execute(
            select(ChatConversation).where(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == user_id,
            )
        )
        conversation = result.scalar_one_or_none()
    else:
        conversation = ChatConversation(
            user_id=user_id,
            context_type=context_type,
            title=message[:50],
        )
        db.add(conversation)
        await db.flush()

    db.add(ChatMessage(conversation_id=conversation.id, role="user", content=message))

    system_prompt = SYSTEM_PROMPTS.get(context_type, SYSTEM_PROMPTS["general"])
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    full_response = ""
    stream = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=1000,
        stream=True,
    )

    async for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_response += content
            yield content

    # Save the full response
    db.add(ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=full_response,
    ))
    await db.flush()
