import { useState, useEffect } from 'react'
import './Stage.css'

const CONTENT_TYPES = ['Ad Copy', 'Social Media Post', 'Email Campaign', 'Product Description']
const TONES = ['Professional', 'Conversational', 'Authoritative', 'Inspirational', 'Playful', 'Urgent']
const PLATFORMS = ['General', 'LinkedIn', 'Instagram', 'Twitter / X', 'Email', 'Facebook', 'Google Ads']

const API = import.meta.env.VITE_GATEWAY_URL || ''

export default function GenerateStage({ planResult, onComplete, existingResult }) {
  const schedule = planResult?.result
  const firstTask = schedule?.timeline?.[0]

  const [form, setForm] = useState({
    content_type: 'Ad Copy',
    topic:        firstTask?.task_name ?? '',
    audience:     'Marketing Professionals',
    tone:         'Professional',
    platform:     'General',
    usp:          firstTask?.description ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [result,  setResult]  = useState(existingResult)

  useEffect(() => {
    if (firstTask) {
      setForm(f => ({ ...f, topic: firstTask.task_name, usp: firstTask.description ?? '' }))
    }
  }, [firstTask])

  function update(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const generatedText = result?.result?.content ?? result?.result?.generated_content

  return (
    <div className="stage-panel">
      <div className="stage-header">
        <div className="stage-header-left">
          <span className="stage-dot gen" />
          <div>
            <h2>Stage 2 — Content Generator</h2>
            <p className="text-sm text-muted">Powered by ChromaDB · Groq · FLUX.1-schnell</p>
          </div>
        </div>
        <span className="badge badge-gen">GenAI Project</span>
      </div>

      {/* Context from plan */}
      {firstTask && (
        <div className="context-banner card">
          <span className="badge badge-plan">From Plan</span>
          <span className="text-sm ml-2">Using task: <strong>{firstTask.task_name}</strong></span>
        </div>
      )}

      {!result && (
        <form onSubmit={handleSubmit} className="stage-form card">
          <div className="grid-2">
            <div>
              <label>Content Type</label>
              <select className="select" value={form.content_type} onChange={e => update('content_type', e.target.value)}>
                {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Platform</label>
              <select className="select" value={form.platform} onChange={e => update('platform', e.target.value)}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label>Topic / Product</label>
            <input className="input" value={form.topic}
              onChange={e => update('topic', e.target.value)} placeholder="e.g. SaaS product launch" />
          </div>

          <div className="mt-3">
            <label>Target Audience</label>
            <input className="input" value={form.audience}
              onChange={e => update('audience', e.target.value)} placeholder="e.g. B2B Marketing Managers" />
          </div>

          <div className="mt-3">
            <label>Tone</label>
            <div className="tone-pills">
              {TONES.map(t => (
                <button key={t} type="button"
                  className={`btn btn-sm ${form.tone === t ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => update('tone', t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label>Unique Selling Point</label>
            <textarea className="textarea" rows={2} value={form.usp}
              onChange={e => update('usp', e.target.value)}
              placeholder="What makes this product / campaign unique?" />
          </div>

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
              <p className="mt-2 text-xs">Make sure your Content Generator backend is running and CONTENT_GEN_API_URL is set in gateway/.env</p>
            </div>
          )}

          <button type="submit" className="btn btn-gen" disabled={loading || !form.topic.trim()}>
            {loading ? <><span className="spinner" /> Generating…</> : 'Generate Content →'}
          </button>
        </form>
      )}

      {result && (
        <div className="stage-results fade-up">
          {/* Meta badges */}
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="badge badge-gen">{form.content_type}</span>
            <span className="badge" style={{background:'rgba(255,255,255,.06)',color:'var(--clr-muted)'}}>{form.tone}</span>
            <span className="badge" style={{background:'rgba(255,255,255,.06)',color:'var(--clr-muted)'}}>{form.platform}</span>
            {result.result?.tokens_used && (
              <span className="badge" style={{background:'rgba(255,255,255,.06)',color:'var(--clr-muted)'}}>
                {result.result.tokens_used} tokens
              </span>
            )}
          </div>

          {/* Generated content */}
          <div className="card generated-content">
            <h4 className="mb-3">{form.content_type} — {form.topic}</h4>
            <div className="content-text">{generatedText ?? JSON.stringify(result.result, null, 2)}</div>
            <button className="btn btn-outline btn-sm mt-4"
              onClick={() => navigator.clipboard.writeText(generatedText ?? '')}>
              Copy to clipboard
            </button>
          </div>

          {/* Brand memory note */}
          {result.result?.brand_context_used && (
            <div className="card mt-3 info-card">
              <span className="badge badge-gen">Brand memory</span>
              <p className="text-xs mt-2">{result.result.brand_context_used}</p>
            </div>
          )}

          <div className="stage-actions mt-4">
            <button className="btn btn-outline btn-sm" onClick={() => setResult(null)}>← Regenerate</button>
            <button className="btn btn-deploy" onClick={() => onComplete({ ...result, input: form })}>
              Continue to Deploy →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}