import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import './Landing.css'

const STAGES = [
  {
    number: '01',
    label: 'Plan',
    color: 'plan',
    icon: '◈',
    title: 'Marketing Planner Agent',
    desc: 'Enter a high-level goal. The CrewAI multi-agent system — Planner, Validator, Scheduler — decomposes it into a validated execution schedule.',
    tech: ['CrewAI', 'LLaMA 3.3', 'Groq', 'FastAPI'],
    project: 'Agentic AI Project',
  },
  {
    number: '02',
    label: 'Generate',
    color: 'gen',
    icon: '◉',
    title: 'Marketing Content Generator',
    desc: 'Transform your plan into professional ad copy, social posts, emails and product descriptions. RAG ensures brand consistency across every generation.',
    tech: ['ChromaDB', 'FLUX.1', 'Groq', 'Python RAG'],
    project: 'GenAI Project',
  },
  {
    number: '03',
    label: 'Deploy',
    color: 'deploy',
    icon: '◎',
    title: 'DevOps Pipeline',
    desc: 'Monitor your containerized Laravel app, trigger CI/CD pipelines via GitHub Actions, and watch deployments roll out in real time.',
    tech: ['Docker', 'GitHub Actions', 'Kubernetes', 'Laravel'],
    project: 'DevOps Project',
  },
]

const FEATURES = [
  { icon: '⬡', title: 'Multi-agent AI',       desc: 'Three specialized CrewAI agents collaborate to plan, validate, and schedule marketing tasks autonomously.' },
  { icon: '⬡', title: 'RAG-powered content',  desc: 'ChromaDB vector store maintains brand memory so every piece of content stays consistent in tone and style.' },
  { icon: '⬡', title: 'CI/CD automation',     desc: 'GitHub Actions pipelines run free on every push, rebuilding Docker containers and verifying deployments.' },
  { icon: '⬡', title: 'Zero AWS required',    desc: 'Built entirely on free-tier services — GitHub Actions, Groq, Render, Streamlit Cloud, and local Docker.' },
  { icon: '⬡', title: 'Container-first',      desc: 'Every service runs in Docker with Kubernetes manifests ready for Minikube or any free cluster.' },
  { icon: '⬡', title: 'Non-destructive',      desc: 'The three source projects are never touched. MarketFlow AI only calls their APIs from the outside.' },
]

export default function Landing() {
  return (
    <div className="landing">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero section">
        <div className="container text-center">
          <div className="hero-badge fade-up">
            <span className="badge badge-plan">Agentic AI</span>
            <span className="badge badge-gen">GenAI</span>
            <span className="badge badge-deploy">DevOps</span>
          </div>

          <h1 className="hero-title fade-up">
            Three Projects.<br />
            <span className="gradient-text">One Platform.</span>
          </h1>

          <p className="hero-desc fade-up">
            MarketFlow AI unifies a multi-agent planner, an AI content generator, and a containerized DevOps pipeline into a single step-by-step marketing intelligence workflow.
          </p>

          <div className="hero-cta fade-up">
            <Link to="/platform" className="btn btn-primary btn-lg">
              Launch Platform →
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-outline btn-lg">
              View on GitHub
            </a>
          </div>

          <div className="hero-stack fade-up">
            {['Python', 'React', 'CrewAI', 'ChromaDB', 'Docker', 'K8s', 'FastAPI', 'Groq'].map(t => (
              <span key={t} className="stack-pill">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow stages ─────────────────────────────────── */}
      <section className="stages section">
        <div className="container">
          <div className="section-header text-center">
            <h2>The Three-Stage Workflow</h2>
            <p>Each stage corresponds to an independent source project, connected through the MarketFlow AI gateway.</p>
          </div>

          <div className="stages-grid">
            {STAGES.map((s, i) => (
              <div key={s.number} className={`stage-card card stage-${s.color}`}>
                <div className="stage-top">
                  <span className={`stage-num badge badge-${s.color}`}>{s.number}</span>
                  <span className="stage-icon">{s.icon}</span>
                </div>
                <h3 className="stage-title">{s.title}</h3>
                <p className="stage-desc">{s.desc}</p>
                <div className="stage-tech">
                  {s.tech.map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>
                <div className="stage-footer">
                  <span className="text-faint text-xs">{s.project}</span>
                  {i < 2 && <span className="stage-arrow">→</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture ────────────────────────────────────── */}
      <section className="arch section">
        <div className="container">
          <div className="arch-inner">
            <div className="arch-text">
              <h2>Non-destructive integration</h2>
              <p>The three source projects are never modified. MarketFlow AI sits alongside them as a pure orchestration layer — a gateway that calls their APIs and a frontend that presents the results.</p>
              <p style={{marginTop: '1rem'}}>Your existing deployments on Render, Streamlit Cloud, and Docker keep running exactly as they are.</p>
              <Link to="/platform" className="btn btn-primary mt-6" style={{display:'inline-flex'}}>
                Start a workflow →
              </Link>
            </div>
            <div className="arch-diagram">
              <div className="arch-box gateway">MarketFlow Gateway<br/><span>FastAPI orchestrator</span></div>
              <div className="arch-arrows">
                <div className="arch-arrow plan">→ Planner Agent<br/><span>Render / Local</span></div>
                <div className="arch-arrow gen">→ Content Generator<br/><span>Streamlit / Local</span></div>
                <div className="arch-arrow dep">→ Laravel App<br/><span>Docker / GitHub Actions</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="features section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Built for the course. Ready for production.</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card card">
                <span className="feature-icon">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="cta-section section">
        <div className="container text-center">
          <h2>Ready to run the workflow?</h2>
          <p className="mt-3">Plan a campaign, generate content, and monitor your deployment — all in one place.</p>
          <Link to="/platform" className="btn btn-primary btn-lg mt-6" style={{display:'inline-flex', margin:'1.5rem auto 0'}}>
            Open Platform →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <p className="text-faint text-xs text-center">
            MarketFlow AI · Medicaps University — Datagami Skill Based Course · Academic Year 2025-2026
          </p>
        </div>
      </footer>
    </div>
  )
}