import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { rankTeams, formatTime } from '../lib/utils'
import CheckerboardStripe from '../components/CheckerboardStripe'
import Star from '../components/Star'
import type { HotdogEvent } from '../types'

// ---------------------------------------------------------------------------
// Glizzy Vault event card
// ---------------------------------------------------------------------------

function VaultCard({ event }: { event: HotdogEvent }) {
  const { eligible, brewers } = rankTeams(event.teams)
  const podium = eligible.filter((t) => t.teamTime != null).slice(0, 3)
  const medals = ['🥇', '🥈', '🥉']

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="bg-cream rounded-xl border-2 border-olive/20 overflow-hidden flex flex-col">
      {/* Card header */}
      <div className="bg-dark px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl text-orange leading-tight truncate">
            {event.name}
          </p>
          <p className="text-xs text-cream/40 mt-0.5">
            {eventDate} &middot; {event.venue}
          </p>
        </div>
        <span className="bg-olive text-cream text-xs font-bold px-2 py-1 rounded flex-shrink-0">
          {new Date(event.date).getUTCFullYear()}
        </span>
      </div>

      {/* Podium results */}
      <div className="px-4 py-4 flex-1 space-y-2">
        {podium.length === 0 ? (
          <p className="text-dark/30 text-sm italic">No results recorded</p>
        ) : (
          podium.map((team, i) => (
            <div key={team.id} className="flex items-center gap-2">
              <span className="text-lg w-6 flex-shrink-0 leading-none">{medals[i]}</span>
              <span
                className={`flex-1 min-w-0 truncate text-sm font-semibold ${
                  i === 0 ? 'text-dark' : 'text-dark/70'
                }`}
              >
                {team.name}
              </span>
              <span className="font-mono text-xs text-dark/50 flex-shrink-0 tabular-nums">
                {formatTime(team.teamTime!)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer meta + CTA */}
      <div className="border-t border-olive/15 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-dark/35 flex-wrap">
          <span>{eligible.length} team{eligible.length !== 1 ? 's' : ''}</span>
          {brewers.length > 0 && (
            <span>🍺 {brewers.length} brewer{brewers.length !== 1 ? 's' : ''}</span>
          )}
          {event.featuredBeer.name && (
            <span className="truncate max-w-[120px]">{event.featuredBeer.name}</span>
          )}
        </div>
        <Link
          to="/history"
          className="text-xs font-bold text-olive hover:text-olive-dark transition-colors flex-shrink-0"
        >
          Full results →
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const { data, activeEvent } = useApp()

  const vaultEvents = data.events
    .filter((e) => e.status === 'archived')
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 bg-dark text-cream mb-16">
        <CheckerboardStripe />

        <div className="px-6 py-12 text-center relative overflow-hidden">
          {/* Star decorators */}
          <Star className="absolute top-8 left-6 w-6 h-6 text-orange/30" />
          <Star className="absolute top-12 left-20 w-4 h-4 text-orange/20" />
          <Star className="absolute top-6 right-8 w-8 h-8 text-orange/35" />
          <Star className="absolute top-14 right-24 w-4 h-4 text-orange/20" />
          <Star className="absolute bottom-8 left-12 w-5 h-5 text-orange/20" />
          <Star className="absolute bottom-6 right-16 w-6 h-6 text-orange/25" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="text-6xl sm:text-7xl leading-none select-none">🌭</div>

            <h1 className="font-display text-6xl sm:text-8xl text-orange leading-none tracking-wide">
              Glizzy Relay
            </h1>

            <p className="font-display text-xl sm:text-2xl text-cream/70">
              The World's Premier Hot Dog Eating Relay Race App
            </p>

            <p className="text-cream/40 text-sm leading-relaxed max-w-md mx-auto">
              Three teammates. One hot dog and one beer each, eaten in sequence.
              Show the judges an empty mouth before tagging your teammate.
              Fastest combined time wins.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {activeEvent ? (
                <>
                  <Link
                    to="/scoreboard"
                    className="bg-orange text-cream font-bold px-6 py-2.5 rounded-xl hover:bg-orange-light transition-colors text-sm"
                  >
                    🏆 Live Scoreboard
                  </Link>
                  <Link
                    to="/roster"
                    className="border-2 border-cream/20 text-cream font-bold px-6 py-2.5 rounded-xl hover:border-cream/50 transition-colors text-sm"
                  >
                    👥 View Teams
                  </Link>
                  <Link
                    to="/event"
                    className="text-cream/50 hover:text-cream transition-colors text-sm font-semibold underline underline-offset-2"
                  >
                    ⚙️ Manage Event
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/event"
                    className="bg-orange text-cream font-bold px-6 py-2.5 rounded-xl hover:bg-orange-light transition-colors text-sm"
                  >
                    ⚙️ Set Up an Event
                  </Link>
                  {vaultEvents.length > 0 && (
                    <Link
                      to="/history"
                      className="border-2 border-cream/20 text-cream font-bold px-6 py-2.5 rounded-xl hover:border-cream/50 transition-colors text-sm"
                    >
                      📅 Browse History
                    </Link>
                  )}
                </>
              )}
            </div>

            {activeEvent && (
              <p className="text-olive-light text-xs font-semibold">
                {activeEvent.name} is live
              </p>
            )}
          </div>
        </div>

        <CheckerboardStripe />
      </div>

      {/* ── The Glizzy Vault ─────────────────────────────────────────────── */}
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-orange flex-shrink-0" />
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-dark leading-none">
              The Glizzy Vault
            </h2>
            <p className="text-dark/40 text-sm mt-1">
              Official results from every event, preserved for all time
            </p>
          </div>
          <Star className="w-5 h-5 text-orange flex-shrink-0" />
        </div>

        {vaultEvents.length === 0 ? (
          <div className="bg-cream-dark rounded-xl border-2 border-dashed border-olive/25 p-10 text-center space-y-2">
            <p className="text-4xl">🏆</p>
            <p className="font-display text-2xl text-dark/50">No records yet</p>
            <p className="text-dark/35 text-sm max-w-xs mx-auto">
              Run your first event, then commit the exported JSON to join The Glizzy Vault.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultEvents.map((event) => (
              <VaultCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {vaultEvents.length > 0 && (
          <div className="text-center">
            <Link
              to="/history"
              className="text-sm font-bold text-olive hover:text-olive-dark transition-colors underline underline-offset-2"
            >
              View full results & export history →
            </Link>
          </div>
        )}
      </div>

      {/* ── How events join The Glizzy Vault ─────────────────────────────── */}
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-olive/10 border-2 border-olive/20 rounded-xl p-5 sm:p-6 space-y-4">
          <h3 className="font-display text-2xl text-dark flex items-center gap-2">
            📂 How events join The Glizzy Vault
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-dark">One-off events</p>
              <p className="text-sm text-dark/55 leading-relaxed">
                Use the app for a single event without any setup. Run teams, enter
                times, project the scoreboard — everything lives in your browser's
                local storage. Nothing needs to be committed or deployed.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-dark">Permanent records</p>
              <p className="text-sm text-dark/55 leading-relaxed">
                After the event, archive and export it from{' '}
                <Link to="/event" className="text-olive font-semibold hover:underline">
                  Event Setup
                </Link>
                . Contribute the downloaded JSON file to the GitHub repository and
                it will appear in The Glizzy Vault automatically on the next
                deploy — no import needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
