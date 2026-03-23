#!/usr/bin/env python3
"""
Alimail Webmail Extension - Email Reply Generator Server
FastAPI application for generating professional email replies using LLM.
"""

import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="Alimail Reply Generator", version="1.0")

# Enable CORS for userscript access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DEFAULT_LLM_URL = os.environ.get("LLM_URL", "http://host.docker.internal:4000")
DEFAULT_API_KEY = os.environ.get("LLM_API_KEY", "")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "gpt-4o")


class GenerateReplyRequest(BaseModel):
    original_email: str
    user_input: str
    tone: str = "professional"
    language: str = "english"


class GenerateReplyResponse(BaseModel):
    generated_reply: str


def build_system_prompt(tone: str, language: str) -> str:
    """Build the system prompt for the LLM."""
    
    tone_instructions = {
        "professional": "Use a formal, professional tone suitable for business communication.",
        "friendly": "Use a warm, friendly but still professional tone.",
        "concise": "Be brief and to the point while maintaining professionalism.",
        "detailed": "Provide comprehensive information with all necessary details.",
    }
    
    language_instructions = {
        "english": "Write the reply in English.",
        "chinese": "Write the reply in Traditional Chinese (繁體中文).",
        "portuguese": "Write the reply in Portuguese.",
        "mixed": "Write the reply in English, but you may include Chinese or Portuguese phrases where appropriate for the Macau government context.",
    }
    
    tone_text = tone_instructions.get(tone, tone_instructions["professional"])
    language_text = language_instructions.get(language, language_instructions["english"])
    
    return f"""You are a professional email assistant helping the user to draft email replies.

{tone_text}
{language_text}

Guidelines:
- Start with an appropriate greeting
- Address all points from the original email
- Incorporate the user's input/points into a coherent response
- Maintain a respectful and courteous tone throughout
- End with an appropriate professional closing
- Do not add markdown formatting (no **, no bullet points unless necessary)
- Output ONLY the email body text, nothing else
- Do not include signatures unless specifically requested in the user's input"""


def build_user_prompt(original_email: str, user_input: str) -> str:
    """Build the user prompt for the LLM."""
    return f"""Original Email:
---
{original_email}
---

My points to include in the reply:
{user_input}

Please generate a professional reply based on the original email and my points above."""


@app.get("/")
def root():
    return {
        "service": "Alimail Reply Generator",
        "version": "1.0",
        "endpoints": {
            "/generate-reply": "POST - Generate professional email reply",
            "/health": "GET - Health check"
        }
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "llm_url": DEFAULT_LLM_URL,
        "model": DEFAULT_MODEL
    }


@app.post("/generate-reply", response_model=GenerateReplyResponse)
async def generate_reply(request: GenerateReplyRequest):
    """
    Generate a professional email reply based on the original email and user input.
    """
    llm_url = os.environ.get("LLM_URL", DEFAULT_LLM_URL)
    api_key = os.environ.get("LLM_API_KEY", DEFAULT_API_KEY)
    model = os.environ.get("LLM_MODEL", DEFAULT_MODEL)
    
    # Build the messages for the chat completion
    messages = [
        {"role": "system", "content": build_system_prompt(request.tone, request.language)},
        {"role": "user", "content": build_user_prompt(request.original_email, request.user_input)}
    ]
    
    # Prepare the request to the LLM
    headers = {
        "Content-Type": "application/json"
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{llm_url}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            generated_text = result["choices"][0]["message"]["content"].strip()
            
            return GenerateReplyResponse(generated_reply=generated_text)
            
        except httpx.HTTPStatusError as e:
            return GenerateReplyResponse(
                generated_reply=f"Error: LLM server returned {e.response.status_code}. Please check your LLM configuration."
            )
        except httpx.ConnectError:
            return GenerateReplyResponse(
                generated_reply=f"Error: Cannot connect to LLM server at {llm_url}. Please ensure the LLM server is running."
            )
        except Exception as e:
            return GenerateReplyResponse(
                generated_reply=f"Error generating reply: {str(e)}"
            )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
