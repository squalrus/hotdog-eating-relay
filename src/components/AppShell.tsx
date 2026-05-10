import { NavLink, Outlet } from 'react-router-dom'
import CheckerboardStripe from './CheckerboardStripe'

const navLinks = [
  { to: '/', label: '🏆 Scoreboard', end: true },
  { to: '/roster', label: '👥 Roster', end: false },
  { to: '/event', label: '⚙️ Event', end: false },
  { to: '/teams', label: '🌭 Teams', end: false },
  { to: '/results', label: '⏱ Results', end: false },
  { to: '/prizes', label: '🥇 Prizes', end: false },
  { to: '/history', label: '📅 History', end: false },
]

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <CheckerboardStripe />

      <header className="bg-dark text-cream px-4 py-3 flex items-center gap-3">
        <span className="text-4xl leading-none select-none">🌭</span>
        <div className="flex-1">
          <h1 className="font-display text-2xl sm:text-3xl text-orange leading-none tracking-wide">
            Hot Dog Eating Relay
          </h1>
          <p className="text-xs text-cream/60 mt-0.5">
            @ Halcyon Brewing &middot; Seattle Beer Week
          </p>
        </div>
        <span className="bg-olive text-cream text-xs font-bold px-2 py-1 rounded font-body">
          2026
        </span>
      </header>

      <nav className="bg-dark-light border-b border-olive/40 px-4 overflow-x-auto">
        <div className="flex min-w-max">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'text-orange border-orange'
                    : 'text-cream/60 border-transparent hover:text-cream hover:border-cream/30'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>

      <CheckerboardStripe />
    </div>
  )
}
