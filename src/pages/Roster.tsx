import { Link } from 'react-router-dom'
import { Beer, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CONTEST_RULES } from '../lib/rules'
import CheckerboardStripe from '../components/CheckerboardStripe'
import Star from '../components/Star'
import type { Team } from '../types'

// ---------------------------------------------------------------------------
// Team card
// ---------------------------------------------------------------------------

function TeamCard({ team }: { team: Team }) {
  return (
    <div
      className={`rounded-xl border-2 p-4 flex flex-col gap-2 ${
        team.isBrewer
          ? 'border-olive/40 bg-olive/10'
          : 'border-cream bg-white/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl text-dark leading-tight">{team.name}</h3>
        {team.isBrewer ? (
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold bg-olive/20 text-olive-dark px-2 py-0.5 rounded-full mt-0.5">
            <Beer size={10} /> Brewers
          </span>
        ) : (
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold bg-orange/10 text-orange px-2 py-0.5 rounded-full mt-0.5">
            <Trophy size={10} /> Eligible
          </span>
        )}
      </div>

      {team.members.length === 3 ? (
        <ol className="space-y-1">
          {team.members.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-dark/10 text-dark/50 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-dark font-medium">{m.name}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-dark/35 italic mt-1">Members not listed</p>
      )}

      {team.notes && (
        <p className="text-xs text-dark/40 italic border-t border-dark/10 pt-1.5 mt-1">
          {team.notes}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sponsor strip (text-only; images added in Step 9)
// ---------------------------------------------------------------------------

function SponsorStrip({ sponsors }: { sponsors: { id: string; name: string; imageData: string }[] }) {
  if (sponsors.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
      {sponsors.map((s) =>
        s.imageData ? (
          <img
            key={s.id}
            src={s.imageData}
            alt={s.name}
            className="h-8 object-contain opacity-80"
          />
        ) : (
          <span key={s.id} className="text-sm font-bold text-cream/50 tracking-wide">
            {s.name}
          </span>
        ),
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Roster() {
  const { activeEvent } = useApp()

  // -- No active event -------------------------------------------------------
  if (!activeEvent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <p className="text-6xl">🌭</p>
        <p className="font-display text-2xl text-dark">No active event</p>
        <p className="text-dark/50 text-sm">
          Set an event as active in{' '}
          <Link to="/event" className="text-orange underline font-semibold">
            Event Setup
          </Link>{' '}
          to show the roster.
        </p>
      </div>
    )
  }

  const eligible = activeEvent.teams.filter((t) => !t.isBrewer)
  const brewers = activeEvent.teams.filter((t) => t.isBrewer)
  const hasTeams = activeEvent.teams.length > 0

  const eventDate = new Date(activeEvent.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="max-w-4xl mx-auto space-y-0">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-dark rounded-t-2xl overflow-hidden">
        <CheckerboardStripe />

        <div className="px-6 pt-6 pb-2 relative">
          {/* Star decorators */}
          <Star className="absolute top-6 right-8 w-8 h-8 text-orange/60" />
          <Star className="absolute top-14 right-20 w-5 h-5 text-orange/40" />
          <Star className="absolute top-8 left-6 w-4 h-4 text-orange/30" />

          {/* Context tag */}
          <div className="inline-block bg-cream/10 text-cream/70 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wide">
            {activeEvent.context}
          </div>

          {/* Event name */}
          <h1 className="font-display text-4xl sm:text-6xl text-orange leading-none mb-1">
            {activeEvent.name}
          </h1>
          <p className="font-display text-xl sm:text-2xl text-cream/80 mb-4">
            @ {activeEvent.venue}
          </p>

          {/* Date */}
          <p className="text-cream/50 text-sm mb-6">{eventDate}</p>
        </div>

        {/* Featured beer */}
        {activeEvent.featuredBeer.name && (
          <div className="mx-6 mb-6 bg-olive/20 border border-olive/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🍺</span>
            <div>
              <p className="text-xs text-olive-light font-bold uppercase tracking-wide">
                Tonight's Beer
              </p>
              <p className="font-display text-xl text-cream leading-tight">
                {activeEvent.featuredBeer.name}
              </p>
              {activeEvent.featuredBeer.description && (
                <p className="text-xs text-cream/50 mt-0.5">
                  {activeEvent.featuredBeer.description}
                </p>
              )}
            </div>
          </div>
        )}

        <CheckerboardStripe />
      </div>

      {/* ── Teams ────────────────────────────────────────────────────────── */}
      <div className="bg-cream-dark px-6 py-6 space-y-6">
        {!hasTeams ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-3">🌭</p>
            <p className="text-dark/40 font-display text-xl">Teams coming soon</p>
            <p className="text-dark/30 text-sm mt-1">
              Add teams in{' '}
              <Link to="/teams" className="text-orange underline">
                Team Manager
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Eligible teams */}
            {eligible.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-orange flex-shrink-0" />
                  <h2 className="font-display text-2xl text-dark">Competitors</h2>
                  <Star className="w-5 h-5 text-orange flex-shrink-0" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {eligible.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              </div>
            )}

            {/* Brewer teams */}
            {brewers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🍺</span>
                  <h2 className="font-display text-2xl text-dark">Brewers</h2>
                  <span className="text-xs text-dark/40 font-semibold pt-1">
                    competing for glory, not prizes
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {brewers.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Rules ────────────────────────────────────────────────────────── */}
      <div className="bg-olive/10 border-t-2 border-b-2 border-olive/20 px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-orange" />
          <h2 className="font-display text-2xl text-dark">The Rules</h2>
          <Star className="w-4 h-4 text-orange" />
        </div>
        <ol className="space-y-2">
          {CONTEST_RULES.map((rule, i) => (
            <li key={i} className="flex gap-3 items-start text-sm text-dark/80">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange text-cream font-bold text-xs flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{rule}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Sponsors ─────────────────────────────────────────────────────── */}
      {activeEvent.sponsors.length > 0 && (
        <div className="bg-dark rounded-b-2xl px-6 py-5 space-y-3">
          <CheckerboardStripe className="-mx-6 -mt-5 mb-4" />
          <p className="text-xs text-cream/30 uppercase tracking-widest text-center font-bold">
            Presented by
          </p>
          <SponsorStrip sponsors={activeEvent.sponsors} />
        </div>
      )}
    </div>
  )
}
