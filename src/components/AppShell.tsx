import { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Maximize2, Minimize2, EyeOff, Eye } from 'lucide-react'
import { useApp } from '../context/AppContext'
import CheckerboardStripe from './CheckerboardStripe'

interface NavItem {
  to: string
  label: string
  end: boolean
}

const displayLinks: NavItem[] = [
  { to: '/', label: '🏠 Home', end: true },
  { to: '/scoreboard', label: '🏆 Scoreboard', end: false },
  { to: '/roster', label: '👥 Roster', end: false },
  { to: '/timer', label: '⏱ Timer', end: false },
]

const adminLinks: NavItem[] = [
  { to: '/event', label: '⚙️ Event', end: false },
  { to: '/teams', label: '🌭 Teams', end: false },
  { to: '/results', label: '⏱ Results', end: false },
  { to: '/prizes', label: '🥇 Prizes', end: false },
  { to: '/history', label: '📅 History', end: false },
]

function NavItems({ links }: { links: NavItem[] }) {
  return (
    <>
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `px-3 py-1.5 sm:py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              isActive
                ? 'text-orange border-orange'
                : 'text-cream/60 border-transparent hover:text-cream hover:border-cream/30'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  )
}

export default function AppShell() {
  const { activeEvent } = useApp()
  const location = useLocation()
  const [navHidden, setNavHidden] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const eventYear = activeEvent
    ? new Date(activeEvent.date).getUTCFullYear().toString()
    : null

  const subtitle = activeEvent
    ? `${activeEvent.venue} · ${activeEvent.context}`
    : 'No active event'

  // Dynamic document title
  useEffect(() => {
    document.title = eventYear
      ? `Glizzy Relay ${eventYear}`
      : 'Glizzy Relay'
  }, [eventYear])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ESC restores hidden nav (browser handles fullscreen ESC separately)
  useEffect(() => {
    if (!navHidden) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavHidden(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navHidden])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden in print — decorative chrome */}
      <CheckerboardStripe className="no-print" />

      <header className="bg-dark text-cream px-4 py-2 sm:py-3 flex items-center gap-3 no-print">
        <span className="text-4xl leading-none select-none">🌭</span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl text-orange leading-none tracking-wide truncate">
            Glizzy Relay
          </h1>
          <p className="text-xs text-cream/60 mt-0.5 truncate">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {eventYear && (
            <span className="bg-olive text-cream text-xs font-bold px-2 py-1 rounded">
              {eventYear}
            </span>
          )}
          <button
            onClick={() => setNavHidden((v) => !v)}
            title={navHidden ? 'Show navigation (Esc)' : 'Hide navigation for presentation'}
            className="p-1.5 rounded text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
          >
            {navHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {!navHidden && (
        <nav className="bg-dark-light border-b border-olive/40 px-4 overflow-x-auto no-print">
          <div className="flex items-stretch min-w-max">
            <div className="flex items-stretch">
              <NavItems links={displayLinks} />
            </div>
            <div className="w-px bg-olive/40 mx-2 my-1.5" />
            <div className="flex items-stretch">
              <NavItems links={adminLinks} />
            </div>
          </div>
        </nav>
      )}

      {!activeEvent && (
        <div className="bg-orange/10 border-b border-orange/20 px-4 py-2 text-sm text-center no-print">
          <span className="text-orange/80">No active event — </span>
          <Link to="/event" className="text-orange font-semibold underline underline-offset-2">
            set one up in Event Setup
          </Link>
        </div>
      )}

      {navHidden && (
        <button
          onClick={() => setNavHidden(false)}
          className="fixed bottom-4 right-4 z-50 bg-dark/80 text-cream/70 hover:text-cream text-xs px-3 py-1.5 rounded-full border border-olive/40 backdrop-blur-sm transition-colors no-print"
        >
          <Eye size={12} className="inline mr-1" />
          Show nav
        </button>
      )}

      {/* key on pathname triggers remount → re-runs fade-in animation on every navigation */}
      <main key={location.pathname} className="flex-1 p-4 sm:p-6 animate-fade-in">
        <Outlet />
      </main>

      <CheckerboardStripe className="no-print" />
    </div>
  )
}
