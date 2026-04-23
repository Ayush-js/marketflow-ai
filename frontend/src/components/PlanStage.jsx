import { useState } from 'react'
import './Stage.css'

const EXAMPLE_GOALS = [
  'Launch a social media campaign for our new SaaS product',
  'Analyze competitor ad strategies for Q3 planning',
  'Create a content marketing plan for a B2B tech brand',
  'Build an email nurture sequence for trial users',
]

const API = import.meta.env.VITE_GATEWAY_URL || ''

export default function PlanStage({ onComplete, existingResult }) {
  const [goal,    setGoal]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [result,  setResult]  = useState(existingResult)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!goal.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const schedule = result?.result
  const timeline = schedule?.timeline ?? []
  const flagged  = schedule?.flagged  ?? []
  const summary  = schedule?.summary  ?? {}

  return (
    <div className="stage-panel">
      {/* Header */}
      <div className="stage-header">
        <div className="stage-header-left">
          <span className="stage-dot plan" />
          <div>
            <h2>Stage 1 — Marketing Planner Agent</h2>
            <p className="text-sm text-muted">Powered by CrewAI · LLaMA 3.3 · Groq</p>
          </div>
        </div>
        <span className="badge badge-plan">Agentic AI Project</span>
      </div>

      {/* Goal form */}
      {!result && (
        <form onSubmit={handleSubmit} className="stage-form card">
          <label>Marketing Goal</label>
          <textarea
            className="textarea"
            placeholder="e.g. Launch a social media campaign for our new product..."
            value={goal}
            onChange={e => setGoal(e.target.value)}
            rows={3}
          />

          <div className="example-goals">
            <span className="text-xs text-faint">Examples:</span>
            {EXAMPLE_GOALS.map(g => (
              <button key={g} type="button" className="btn btn-ghost btn-sm example-btn"
                onClick={() => setGoal(g)}>
                {g}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
              {error.includes('cold start') && <p className="mt-2 text-xs">Render free tier is warming up. Wait 30s and retry.</p>}
            </div>
          )}

          <button type="submit" className="btn btn-plan" disabled={loading || !goal.trim()}>
            {loading ? <><span className="spinner" /> Agents working…</> : 'Generate Plan →'}
          </button>
        </form>
      )}

      {/* Results */}
      {result && (
        <div className="stage-results fade-up">

          {/* Stats row */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">{schedule?.total_tasks ?? 0}</span>
              <span className="stat-label">Total tasks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value text-deploy">{schedule?.ready_count ?? 0}</span>
              <span className="stat-label">Ready</span>
            </div>
            <div className="stat-card">
              <span className="stat-value text-warn">{schedule?.flagged_count ?? 0}</span>
              <span className="stat-label">Flagged</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{summary?.project_duration ?? '–'}</span>
              <span className="stat-label">Days</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="card mt-4">
            <h4 className="mb-3">Execution Timeline</h4>
            <div className="timeline">
              {timeline.map((task, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-marker">
                    <span className="timeline-num">{task.order}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">{task.task_name}</strong>
                      <span className="badge badge-ok text-xs">✓ Ready</span>
                    </div>
                    <p className="text-xs mt-1">{task.description}</p>
                    <div className="timeline-meta">
                      <span>Day {task.start_day}–{task.end_day}</span>
                      <span>{task.duration_days}d</span>
                      <span>${task.estimated_cost?.toLocaleString()}</span>
                      <span>{task.team_members?.join(', ')}</span>
                    </div>
                    {task.depends_on?.length > 0 && (
                      <p className="text-xs text-faint mt-1">Depends on: {task.depends_on.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
              {flagged.map((task, i) => (
                <div key={`f-${i}`} className="timeline-item flagged">
                  <div className="timeline-marker warn">
                    <span>!</span>
                  </div>
                  <div className="timeline-content">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">{task.task_name}</strong>
                      <span className="badge badge-warn text-xs">Flagged</span>
                    </div>
                    <p className="text-xs mt-1 text-muted">{task.reason || 'Validation failed'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget summary */}
          {summary?.total_budget && (
            <div className="card mt-3">
              <div className="flex gap-6 flex-wrap">
                <div><span className="text-xs text-muted">Budget</span><br/><strong>${summary.total_budget?.toLocaleString()}</strong></div>
                <div><span className="text-xs text-muted">Team</span><br/><strong>{summary.team_involved?.join(', ')}</strong></div>
                <div><span className="text-xs text-muted">Completion</span><br/><strong>{summary.completion_rate}</strong></div>
              </div>
            </div>
          )}

          <div className="stage-actions mt-4">
            <button className="btn btn-outline btn-sm" onClick={() => setResult(null)}>
              ← New goal
            </button>
            <button className="btn btn-plan" onClick={() => onComplete(result)}>
              Continue to Generate →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}