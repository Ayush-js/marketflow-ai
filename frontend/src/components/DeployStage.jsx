import { useState, useEffect, useCallback } from 'react'
import './Stage.css'

const API = import.meta.env.VITE_GATEWAY_URL || ''

export default function DeployStage({ planResult, genResult }) {
  const [status,     setStatus]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [trigMsg,    setTrigMsg]    = useState(null)
  const [error,      setError]      = useState(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API}/api/deploy/status`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
      setStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  async function triggerDeploy() {
    setTriggering(true); setTrigMsg(null)
    try {
      const res  = await fetch(`${API}/api/deploy/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'ci-cd.yml', ref: 'main' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Trigger failed')
      setTrigMsg({ ok: true, msg: data.message })
      setTimeout(fetchStatus, 3000)
    } catch (err) {
      setTrigMsg({ ok: false, msg: err.message })
    } finally {
      setTriggering(false)
    }
  }

  const laravel  = status?.laravel_app
  const ghRuns   = status?.github_actions?.runs ?? []
  const ghError  = status?.github_actions?.error

  function statusBadge(run) {
    if (run.status === 'completed') {
      return run.conclusion === 'success'
        ? <span className="badge badge-ok">✓ success</span>
        : <span className="badge badge-err">✕ {run.conclusion}</span>
    }
    return <span className="badge badge-warn pulse">{run.status}</span>
  }

  return (
    <div className="stage-panel">
      <div className="stage-header">
        <div className="stage-header-left">
          <span className="stage-dot deploy" />
          <div>
            <h2>Stage 3 — DevOps Pipeline</h2>
            <p className="text-sm text-muted">Docker · GitHub Actions · Kubernetes</p>
          </div>
        </div>
        <span className="badge badge-deploy">DevOps Project</span>
      </div>

      <div className="deploy-summary card">
        <h4 className="mb-3">Workflow complete</h4>
        <div className="flex gap-4 flex-wrap">
          {planResult && (
            <div className="summary-pill">
              <span className="badge badge-plan">Plan</span>
              <span className="text-xs">{planResult.result?.total_tasks ?? '–'} tasks planned</span>
            </div>
          )}
          {genResult && (
            <div className="summary-pill">
              <span className="badge badge-gen">Generate</span>
              <span className="text-xs">{genResult.input?.content_type} generated</span>
            </div>
          )}
          <div className="summary-pill">
            <span className="badge badge-deploy">Deploy</span>
            <span className="text-xs">Pipeline monitoring active</span>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4>Laravel App (Docker)</h4>
          <button className="btn btn-ghost btn-sm" onClick={fetchStatus} disabled={loading}>
            {loading ? <span className="spinner" /> : '↺'} Refresh
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {laravel && (
          <div className="flex items-center gap-3">
            <span className={`status-dot ${laravel.ok ? 'ok' : 'err'}`} />
            <span className={laravel.ok ? 'text-deploy' : 'text-sm text-muted'}>
              {laravel.ok ? 'App is running' : 'App unreachable'}
            </span>
            {laravel.status_code && <span className="badge badge-ok">{laravel.status_code}</span>}
            {laravel.url && (
              <a href={laravel.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                Open ↗
              </a>
            )}
          </div>
        )}

        {!laravel && !loading && (
          <p className="text-xs text-muted">Could not reach Laravel app. Check LARAVEL_APP_URL in gateway/.env</p>
        )}
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4>GitHub Actions — CI/CD Pipeline</h4>
          <button className="btn btn-deploy btn-sm" onClick={triggerDeploy} disabled={triggering}>
            {triggering ? <><span className="spinner" /> Triggering…</> : '▶ Trigger Deploy'}
          </button>
        </div>

        {trigMsg && (
          <div className={`${trigMsg.ok ? 'success-box' : 'error-box'} mb-3`}>{trigMsg.msg}</div>
        )}

        {ghError && (
          <div className="info-box mb-3">
            <strong>GitHub not connected</strong>
            <p className="text-xs mt-1">Set GITHUB_TOKEN and GITHUB_REPO in gateway/.env to see pipeline runs.</p>
          </div>
        )}

        {ghRuns.length > 0 && (
          <div className="runs-list">
            {ghRuns.map(run => (
              <div key={run.id} className="run-item">
                <div className="run-main">
                  {statusBadge(run)}
                  <span className="text-sm">{run.name}</span>
                  <span className="badge" style={{background:'rgba(255,255,255,.06)',color:'var(--clr-muted)',fontSize:'0.68rem'}}>
                    {run.branch}
                  </span>
                </div>
                <div className="run-meta">
                  <span className="text-xs text-faint">{new Date(run.created_at).toLocaleString()}</span>
                  <a href={run.html_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Details ↗</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {ghRuns.length === 0 && !ghError && !loading && (
          <p className="text-xs text-muted">No recent pipeline runs found.</p>
        )}
      </div>

      <div className="card mt-4">
        <h4 className="mb-2">Kubernetes Manifests</h4>
        <p className="text-sm text-muted">K8s manifests are in the <code>k8s/</code> folder. Run locally with Minikube:</p>
        <pre className="mt-3">{`minikube start\nkubectl apply -f k8s/\nminikube service marketflow-frontend --url`}</pre>
      </div>

      <div className="card mt-4 arch-note">
        <h4 className="mb-2">DevOps Architecture</h4>
        <div className="arch-flow">
          <div className="arch-step">git push</div>
          <span className="arch-arrow-sm">→</span>
          <div className="arch-step">GitHub Actions</div>
          <span className="arch-arrow-sm">→</span>
          <div className="arch-step">Docker Build</div>
          <span className="arch-arrow-sm">→</span>
          <div className="arch-step">GHCR Push</div>
          <span className="arch-arrow-sm">→</span>
          <div className="arch-step">Deploy ✓</div>
        </div>
        <p className="text-xs text-faint mt-3">Free tier: GitHub Actions · GitHub Container Registry · No AWS required</p>
      </div>
    </div>
  )
}