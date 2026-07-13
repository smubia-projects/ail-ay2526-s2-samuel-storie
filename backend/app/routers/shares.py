from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import psycopg
from fastapi import APIRouter, Header, HTTPException
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter(prefix="/api/shares", tags=["shares"])

SHARE_LIFETIME = timedelta(days=7)


class StoryPageSnapshot(BaseModel):
    page_number: int = Field(ge=1, le=20)
    act_title: str = Field(max_length=120)
    text_content: str = Field(max_length=4000)
    image_url: str | None = Field(default=None, max_length=8_000_000)
    image_prompt: str = Field(default="", max_length=2000)


class ShareStoryRequest(BaseModel):
    client_story_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=240)
    child_name: str = Field(default="", max_length=120)
    original_prompt: str = Field(default="", max_length=4000)
    visual_style: str = Field(default="", max_length=120)
    pages: list[StoryPageSnapshot] = Field(min_length=1, max_length=4)


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _require_database_url() -> str:
    if not settings.database_url:
        raise HTTPException(
            status_code=503,
            detail="Story sharing is taking a little nap. Please try again soon.",
        )
    return settings.database_url


def _owner_digest(owner_token: str | None) -> str:
    if not owner_token or len(owner_token) < 24 or len(owner_token) > 200:
        raise HTTPException(status_code=400, detail="This browser could not be recognised.")
    return _digest(owner_token)


@router.post("")
async def create_share(
    body: ShareStoryRequest,
    x_storie_owner: str | None = Header(default=None),
):
    database_url = _require_database_url()
    owner_hash = _owner_digest(x_storie_owner)
    token = secrets.token_urlsafe(32)
    token_hash = _digest(token)
    expires_at = datetime.now(timezone.utc) + SHARE_LIFETIME
    story = body.model_dump(exclude={"client_story_id"})

    try:
        async with await psycopg.AsyncConnection.connect(database_url) as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM story_shares WHERE expires_at <= NOW()")
                await cur.execute(
                    """
                    DELETE FROM story_shares
                    WHERE owner_hash = %s AND client_story_id = %s
                    """,
                    (owner_hash, body.client_story_id),
                )
                await cur.execute(
                    """
                    INSERT INTO story_shares
                        (token_hash, owner_hash, client_story_id, story, expires_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        token_hash,
                        owner_hash,
                        body.client_story_id,
                        Jsonb(story),
                        expires_at,
                    ),
                )
    except psycopg.Error as exc:
        raise HTTPException(
            status_code=503,
            detail="The sharing spell did not work. Please try again in a moment.",
        ) from exc

    return {"token": token, "expires_at": expires_at.isoformat()}


@router.get("/{token}")
async def get_share(token: str):
    if len(token) < 24 or len(token) > 200:
        raise HTTPException(status_code=404, detail="This story link could not be found.")

    database_url = _require_database_url()
    expired = False
    try:
        async with await psycopg.AsyncConnection.connect(
            database_url, row_factory=dict_row
        ) as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT story, expires_at
                    FROM story_shares
                    WHERE token_hash = %s
                    """,
                    (_digest(token),),
                )
                row = await cur.fetchone()
                if not row:
                    raise HTTPException(
                        status_code=404,
                        detail="This story link could not be found.",
                    )
                if row["expires_at"] <= datetime.now(timezone.utc):
                    await cur.execute(
                        "DELETE FROM story_shares WHERE token_hash = %s",
                        (_digest(token),),
                    )
                    expired = True
    except HTTPException:
        raise
    except psycopg.Error as exc:
        raise HTTPException(
            status_code=503,
            detail="This story cannot be opened just now. Please try again soon.",
        ) from exc

    if expired:
        raise HTTPException(
            status_code=410,
            detail="This enchanted story link has faded after 7 days.",
        )

    return {"story": row["story"], "expires_at": row["expires_at"].isoformat()}
