import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-mark">▲</span>
          <span className="logo-text">MarketFlow <span className="logo-ai">AI</span></span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/platform" className={`nav-link ${pathname === '/platform' ? 'active' : ''}`}>Platform</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="nav-link">GitHub</a>
        </div>

        <Link to="/platform" className="btn btn-primary btn-sm">
          Launch Platform →
        </Link>
      </div>
    </nav>
  )
}