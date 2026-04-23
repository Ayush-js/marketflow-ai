"""
MarketFlow AI — Integration Gateway
====================================
FastAPI orchestration layer that connects the three source projects:
  1. Marketing Planner Agent (CrewAI backend on Render)
  2. Marketing Content Generator (ChromaDB + Groq + FLUX)
  3. Laravel Docker App (DevOps deployment)

This gateway ONLY calls their APIs — it never modifies source projects.
"""

import os
import httpx
import asyncio
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ────────────────────────────────────────────
PLANNER_API_URL   = os.getenv("PLANNER_API_URL",   "https://marketing-planner-api.onrender.com")
CONTENT_GEN_URL   = os.getenv("CONTENT_GEN_API_URL", "http://localhost:8000")
LARAVEL_APP_URL   = os.getenv("LARAVEL_APP_URL",   "http://localhost:80")
GITHUB_TOKEN      = os.getenv("GITHUB_TOKEN",      "")
GITHUB_REPO       = os.getenv("GITHUB_REPO",       "")

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="MarketFlow AI Gateway",
    description="Unified orchestration gateway for the Marketing Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response Models ─────────────────────────────────

class PlanRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=4000,
                      description="High-level marketing goal to decompose")

class ContentRequest(BaseModel):
    content_type: str = Field(..., description="Ad Copy | Social Media Post | Email Campaign | Product Description")
    topic:        str = Field(..., description="Product or campaign topic")
    audience:     str = Field(..., description="Target audience description")
    tone:         str = Field(default="Professional", description="Brand tone")
    platform:     str = Field(default="General",      description="Target platform")
    usp:          str = Field(default="",             description="Unique selling point")

class WorkflowRequest(BaseModel):
    """Full end-to-end: Plan → pick best task → Generate content for it"""
    goal:         str
    content_type: str = "Ad Copy"
    tone:         str = "Professional"
    platform:     str = "General"

class DeployTriggerRequest(BaseModel):
    workflow_id:  str = Field(default="ci-cd.yml", description="GitHub Actions workflow file name")
    ref:          str = Field(default="main",       description="Branch or tag to deploy")

# ── Health Endpoints ─────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    """Gateway health check"""
    return {
        "ok": True,
        "service": "MarketFlow AI Gateway",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/health/all", tags=["system"])
async def health_all():
    """Check health of all three integrated services"""
    results = {}

    async def check(name: str, url: str, path: str = "/health"):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(f"{url}{path}")
                results[name] = {"ok": r.status_code < 400, "status": r.status_code}
        except Exception as e:
            results[name] = {"ok": False, "error": str(e)}

    await asyncio.gather(
        check("planner_agent", PLANNER_API_URL, "/api/health"),
        check("content_generator", CONTENT_GEN_URL, "/health"),
        check("laravel_app", LARAVEL_APP_URL, "/"),
    )

    return {
        "gateway": {"ok": True},
        "services": results,
        "timestamp": datetime.utcnow().isoformat(),
    }

# ── Stage 1: Plan ─────────────────────────────────────────────

@app.post("/api/plan", tags=["stage-1-plan"])
async def plan(req: PlanRequest):
    """
    Stage 1 — Marketing Planner Agent
    Decomposes a high-level marketing goal into an actionable execution schedule.
    Calls the existing CrewAI backend (marketing-planner-agent project).
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{PLANNER_API_URL}/api/plan",
                json={"goal": req.goal},
            )
            response.raise_for_status()
            data = response.json()
            return {
                "stage": "plan",
                "goal": req.goal,
                "result": data.get("schedule", data),
                "source_project": "marketing-planner-agent (CrewAI · LLaMA 3.3 · Groq)",
                "timestamp": datetime.utcnow().isoformat(),
            }
        except httpx.TimeoutException:
            raise HTTPException(503, "Planner Agent timed out — Render cold start may be in progress (30-50s). Retry.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(e.response.status_code, f"Planner Agent error: {e.response.text}")
        except Exception as e:
            raise HTTPException(502, f"Cannot reach Planner Agent at {PLANNER_API_URL}: {str(e)}")

# ── Stage 2: Generate ─────────────────────────────────────────

@app.post("/api/generate", tags=["stage-2-generate"])
async def generate(req: ContentRequest):
    """
    Stage 2 — Marketing Content Generator
    Generates professional marketing content using RAG + LLM.
    Calls the existing ChromaDB + Groq backend (marketing_gen project).
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{CONTENT_GEN_URL}/generate",
                json={
                    "content_type": req.content_type,
                    "topic":        req.topic,
                    "audience":     req.audience,
                    "tone":         req.tone,
                    "platform":     req.platform,
                    "usp":          req.usp,
                },
            )
            response.raise_for_status()
            return {
                "stage": "generate",
                "input": req.model_dump(),
                "result": response.json(),
                "source_project": "marketing_gen (ChromaDB · Groq · FLUX.1-schnell)",
                "timestamp": datetime.utcnow().isoformat(),
            }
        except httpx.TimeoutException:
            raise HTTPException(503, "Content Generator timed out.")
        except httpx.HTTPStatusError as e:
            raise HTTPException(e.response.status_code, f"Content Generator error: {e.response.text}")
        except Exception as e:
            raise HTTPException(502, f"Cannot reach Content Generator at {CONTENT_GEN_URL}: {str(e)}")

# ── Stage 3: Deploy Status ────────────────────────────────────

@app.get("/api/deploy/status", tags=["stage-3-deploy"])
async def deploy_status():
    """
    Stage 3 — DevOps Deployment Status
    Returns the health of the Laravel Docker app and latest pipeline run.
    """
    app_status = {"ok": False, "error": "not checked"}
    pipeline_status = {"runs": [], "error": "GitHub token not configured"}

    # Check Laravel app health
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            r = await client.get(LARAVEL_APP_URL)
            app_status = {"ok": r.status_code < 400, "status_code": r.status_code, "url": LARAVEL_APP_URL}
    except Exception as e:
        app_status = {"ok": False, "error": str(e), "url": LARAVEL_APP_URL}

    # Fetch GitHub Actions runs
    if GITHUB_TOKEN and GITHUB_REPO:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(
                    f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs?per_page=5",
                    headers={
                        "Authorization": f"Bearer {GITHUB_TOKEN}",
                        "Accept": "application/vnd.github+json",
                    },
                )
                runs_data = r.json().get("workflow_runs", [])
                pipeline_status = {
                    "runs": [
                        {
                            "id":          run["id"],
                            "name":        run["name"],
                            "status":      run["status"],
                            "conclusion":  run["conclusion"],
                            "branch":      run["head_branch"],
                            "created_at":  run["created_at"],
                            "html_url":    run["html_url"],
                        }
                        for run in runs_data
                    ]
                }
        except Exception as e:
            pipeline_status = {"runs": [], "error": str(e)}

    return {
        "stage": "deploy",
        "laravel_app": app_status,
        "github_actions": pipeline_status,
        "source_project": "marketing-laravel-docker (Docker · Jenkins · GitHub Actions)",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.post("/api/deploy/trigger", tags=["stage-3-deploy"])
async def deploy_trigger(req: DeployTriggerRequest):
    """
    Stage 3 — Trigger GitHub Actions deployment pipeline
    Uses repository_dispatch event to trigger CI/CD workflow.
    """
    if not GITHUB_TOKEN or not GITHUB_REPO:
        raise HTTPException(503, "GITHUB_TOKEN and GITHUB_REPO must be set to trigger deployments.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.post(
                f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{req.workflow_id}/dispatches",
                headers={
                    "Authorization": f"Bearer {GITHUB_TOKEN}",
                    "Accept": "application/vnd.github+json",
                },
                json={"ref": req.ref},
            )
            if r.status_code == 204:
                return {"ok": True, "message": f"Pipeline '{req.workflow_id}' triggered on branch '{req.ref}'"}
            else:
                raise HTTPException(r.status_code, r.text)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, str(e))

# ── Full Workflow ─────────────────────────────────────────────

@app.post("/api/workflow", tags=["workflow"])
async def full_workflow(req: WorkflowRequest):
    """
    Complete end-to-end workflow:
      1. Plan → get task schedule from Planner Agent
      2. Generate → create content for the first ready task
    Returns both results in a single response.
    """
    # Stage 1: Plan
    plan_response = await plan(PlanRequest(goal=req.goal))
    schedule = plan_response.get("result", {})
    timeline = schedule.get("timeline", [])

    # Pick the first ready task for content generation
    first_task = timeline[0] if timeline else None
    content_response = None

    if first_task:
        gen_req = ContentRequest(
            content_type=req.content_type,
            topic=first_task.get("task_name", req.goal),
            audience="Marketing Professionals",
            tone=req.tone,
            platform=req.platform,
            usp=first_task.get("description", ""),
        )
        try:
            content_response = await generate(gen_req)
        except HTTPException:
            content_response = {"error": "Content Generator unavailable — run Stage 2 manually"}

    return {
        "workflow": "plan_then_generate",
        "goal": req.goal,
        "plan": plan_response,
        "generate": content_response,
        "timestamp": datetime.utcnow().isoformat(),
    }