"""
MarketFlow AI — Content Generator API Wrapper
=============================================
Thin FastAPI wrapper around the existing marketing_gen project.
Imports directly from marketing_gen — never modifies it.
Run on port 8001 separately from the main gateway.
"""

import sys
import os

# ── Point Python to your marketing_gen project ───────────────
MARKETING_GEN_PATH = os.getenv("MARKETING_GEN_PATH", r"D:\git_reps\marketing_gen")
sys.path.insert(0, MARKETING_GEN_PATH)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load marketing_gen's own .env (has GROQ_API_KEY)
load_dotenv(os.path.join(MARKETING_GEN_PATH, ".env"))

# Import directly from marketing_gen
from core.llm_engine import LLMEngine
from vectordb.store import ContentVectorStore

app = FastAPI(title="MarketFlow Content Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize once
llm   = LLMEngine()
store = ContentVectorStore()

class GenerateRequest(BaseModel):
    content_type: str = "Ad Copy"
    topic:        str
    audience:     str = "Marketing Professionals"
    tone:         str = "Professional"
    platform:     str = "General"
    usp:          str = ""

@app.get("/health")
def health():
    return {"ok": True, "service": "Content Generator API"}

@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        # Find similar past content for RAG
        similar_context = store.find_similar(
            content_type=req.content_type,
            topic=req.topic,
            audience=req.audience,
        )

        # Generate content using marketing_gen's LLMEngine
        result = llm.generate_content(
            content_type=req.content_type,
            topic=req.topic,
            audience=req.audience,
            tone=req.tone,
            platform=req.platform,
            usp=req.usp,
            similar_context=similar_context,
        )

        # Save to ChromaDB for future RAG
        store.save_content(
            content_type=req.content_type,
            topic=req.topic,
            audience=req.audience,
            tone=req.tone,
            platform=req.platform,
            generated_content=result["content"],
        )

        return {
            "content":           result["content"],
            "tokens_used":       result["tokens_used"],
            "model":             result["model"],
            "brand_context_used": similar_context[:200] if similar_context else None,
        }

    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))