import { useState, useCallback } from 'react'
import Navbar from '../components/Navbar.jsx'
import PlanStage from '../components/PlanStage.jsx'
import GenerateStage from '../components/GenerateStage.jsx'
import DeployStage from '../components/DeployStage.jsx'
import './Platform.css'

const STAGES = [
  { id: 1, key: 'plan',     label: 'Plan',     icon: '◈', color: 'plan',   desc: 'Decompose your marketing goal' },
  { id: 2, key: 'generate', label: 'Generate', icon: '◉', color: 'gen',    desc: 'Create professional content' },
  { id: 3, key: 'deploy',   label: 'Deploy',   icon: '◎', color: 'deploy', desc: 'Monitor CI/CD pipeline' },
]

export default function Platform() {
  const [activeStage, setActiveStage] = useState(1)
  const [planResult,  setPlanResult]  = useState(null)
  const [genResult,   setGenResult]   = useState(null)

  const handlePlanComplete = useCallback((result) => {
    setPlanResult(result)
    setActiveStage(2)
  }, [])

  const handleGenComplete = useCallback((result) => {
    setGenResult(result)
    setActiveStage(3)
  }, [])

  const goToStage = (n) => {
    if (n < activeStage || (n === 2 && planResult) || (n === 3 && planResult)) {
      setActiveStage(n)
    }
  }

  return (
    <div className="platform">
      <Navbar />

      <div className="platform-inner container">

        {/* ── Stage stepper ──────────────────────────────── */}
        <div className="stepper">
          {STAGES.map((s, i) => (
            <div key={s.id} className="stepper-item">
              <button
                className={`stepper-btn stage-${s.color} ${activeStage === s.id ? 'active' : ''} ${s.id < activeStage ? 'done' : ''}`}
                onClick={() => goToStage(s.id)}
              >
                <span className="stepper-icon">{s.id < activeStage ? '✓' : s.icon}</span>
                <div className="stepper-labels">
                  <span className="stepper-num">Stage {s.id}</span>
                  <span className="stepper-name">{s.label}</span>
                </div>
              </button>
              {i < STAGES.length - 1 && (
                <div className={`stepper-line ${s.id < activeStage ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Active stage content ───────────────────────── */}
        <div className="stage-content fade-up">
          {activeStage === 1 && (
            <PlanStage onComplete={handlePlanComplete} existingResult={planResult} />
          )}
          {activeStage === 2 && (
            <GenerateStage planResult={planResult} onComplete={handleGenComplete} existingResult={genResult} />
          )}
          {activeStage === 3 && (
            <DeployStage planResult={planResult} genResult={genResult} />
          )}
        </div>

        {/* ── Workflow summary sidebar (compact) ─────────── */}
        {(planResult || genResult) && (
          <div className="workflow-summary card fade-up">
            <h4>Workflow State</h4>

            {planResult && (
              <div className="summary-item">
                <span className="badge badge-plan">Plan ✓</span>
                <span className="text-xs text-muted">
                  {planResult.result?.total_tasks ?? '–'} tasks · {planResult.result?.ready_count ?? '–'} ready
                </span>
              </div>
            )}

            {genResult && (
              <div className="summary-item">
                <span className="badge badge-gen">Generate ✓</span>
                <span className="text-xs text-muted">
                  {genResult.input?.content_type ?? 'Content'} generated
                </span>
              </div>
            )}

            <button
              className="btn btn-ghost btn-sm w-full mt-4"
              onClick={() => { setPlanResult(null); setGenResult(null); setActiveStage(1); }}
            >
              ↺ Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}