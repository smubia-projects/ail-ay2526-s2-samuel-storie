from __future__ import annotations

import base64
import json
import re
import traceback

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import settings
from app.rate_limit import check_rate_limit

router = APIRouter(prefix="/api", tags=["ai"])

SAFETY_PROMPT_PREFIX = (
    "Illustration for children's storybook, soft lighting, friendly and gentle, "
    "no scary elements, toddler-safe, warm colors. CRITICAL: NO TEXT, NO WORDS, "
    "NO LETTERS, NO WRITING, NO TITLES, NO LABELS, NO CAPTIONS, NO SPEECH BUBBLES, "
    "NO SIGNS WITH TEXT. The image must contain ONLY visual artwork with absolutely "
    "no readable text of any kind."
)

NO_TEXT_INSTRUCTION = (
    "IMPORTANT: This image MUST NOT contain any text, words, letters, numbers, "
    "writing, titles, labels, captions, speech bubbles, or signs with text. "
    "Generate ONLY pure visual artwork with no readable elements."
)


async def _openrouter_chat(client: httpx.AsyncClient, messages: list, temperature: float = 0.7) -> str:
    resp = await client.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.openrouter_model,
            "messages": messages,
            "temperature": temperature,
        },
        timeout=60.0,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"OpenRouter chat error: {resp.text}")
    return resp.json()["choices"][0]["message"]["content"]


async def _openrouter_image(client: httpx.AsyncClient, prompt: str) -> str:
    # OpenRouter has no /images/generations endpoint — image generation goes
    # through chat completions with modalities, and requires an image-output
    # model (e.g. google/gemini-2.5-flash-image).
    resp = await client.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.openrouter_image_model,
            "messages": [{"role": "user", "content": prompt}],
            "modalities": ["image", "text"],
        },
        timeout=120.0,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"OpenRouter image error: {resp.text}")

    images = resp.json()["choices"][0]["message"].get("images") or []
    if images:
        url = images[0].get("image_url", {}).get("url", "")
        if url.startswith("data:"):
            return url
        if url:
            img_resp = await client.get(url, timeout=30.0)
            img_resp.raise_for_status()
            return f"data:image/png;base64,{base64.b64encode(img_resp.content).decode()}"
    raise HTTPException(status_code=502, detail="No image data in OpenRouter response")


def _extract_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise HTTPException(status_code=502, detail="Invalid story format from model")
    return json.loads(match.group(0))


class GenerateStorybookRequest(BaseModel):
    prompt: str
    child_name: str
    visual_style: str


@router.post("/generate-storybook")
async def generate_storybook(body: GenerateStorybookRequest, request: Request):
    check_rate_limit(request, "gen")

    system_prompt = (
        f"You are a children's storybook writer. Create a 4-act story structure "
        f"based on the given idea. The story is for a toddler named {body.child_name}.\n\n"
        f"Output ONLY valid JSON with this exact structure:\n"
        f'{{\n'
        f'  "title": "Story title",\n'
        f'  "acts": [\n'
        f'    {{\n'
        f'      "actNumber": 1,\n'
        f'      "actTitle": "Introduction",\n'
        f'      "sceneDescription": "Brief visual scene description for image generation.",\n'
        f'      "textContent": "The story text for this page (50-80 words)"\n'
        f"    }}\n"
        f"  ]\n"
        f"}}\n\n"
        f"Act titles must be: Introduction, The Journey, The Gentle Conflict, The Sleepy Resolution.\n"
        f"Keep language simple, warm, and suitable for bedtime stories. Include {body.child_name} naturally."
    )

    async with httpx.AsyncClient() as client:
        content = await _openrouter_chat(
            client,
            [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Create a bedtime story for a child named {body.child_name} based on: "
                        f"{body.prompt}. Remember, the child's name is {body.child_name} — "
                        f"use it throughout the story."
                    ),
                },
            ],
        )
        structure = _extract_json(content)

        pages = []
        for act in structure.get("acts", []):
            image_url = None
            try:
                img_prompt = (
                    f"{SAFETY_PROMPT_PREFIX}, {body.visual_style} style, "
                    f"{act['sceneDescription']}. {NO_TEXT_INSTRUCTION}"
                )
                image_url = await _openrouter_image(client, img_prompt)
            except Exception:
                traceback.print_exc()

            pages.append(
                {
                    "page_number": act["actNumber"],
                    "act_title": act["actTitle"],
                    "text_content": act["textContent"],
                    "image_url": image_url,
                    "image_prompt": act["sceneDescription"],
                }
            )

    return {"title": structure.get("title", ""), "pages": pages}


class RegenerateImageRequest(BaseModel):
    image_prompt: str
    visual_style: str
    feedback: str = ""


@router.post("/regenerate-image")
async def regenerate_image(body: RegenerateImageRequest, request: Request):
    check_rate_limit(request, "img")

    prompt = (
        f"{SAFETY_PROMPT_PREFIX}, {body.visual_style} style, "
        f"{body.image_prompt}. {NO_TEXT_INSTRUCTION}"
    )
    if body.feedback:
        prompt += f" User feedback for improvement: {body.feedback}"

    async with httpx.AsyncClient() as client:
        image_url = await _openrouter_image(client, prompt)
    return {"image_url": image_url}


class RegenerateTextRequest(BaseModel):
    prompt: str
    child_name: str
    act_title: str
    act_number: int
    current_text: str = ""
    feedback: str = ""


@router.post("/regenerate-text")
async def regenerate_text(body: RegenerateTextRequest, request: Request):
    check_rate_limit(request, "txt")

    async with httpx.AsyncClient() as client:
        new_text = await _openrouter_chat(
            client,
            [
                {
                    "role": "system",
                    "content": (
                        f"You are a children's storybook writer. Rewrite the following paragraph "
                        f"for act {body.act_number} ({body.act_title}) of a bedtime story "
                        f"for {body.child_name}. Use simple, warm language with gentle rhythm. "
                        f"Apply the user's feedback to improve it. Do not include act titles or labels."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Story premise: {body.prompt}\n\n"
                        f"Current text: {body.current_text}\n\n"
                        f"User feedback: {body.feedback}\n\n"
                        f"Rewrite the text addressing the feedback."
                    ),
                },
            ],
        )

    return {"text_content": new_text.strip()}
