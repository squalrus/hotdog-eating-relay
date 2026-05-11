import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Beer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { rankTeams, formatTime } from '../lib/utils'
import CheckerboardStripe from '../components/CheckerboardStripe'
import type { Team, Prize } from '../types'

// Flashes the row briefly when teamTime changes (e.g. a new score comes in)
function useScoreFlash(teamTime: number | undefined): boolean {
  const prev = useRef(teamTime)
  const [flashing, setFlashing] = useState(false)

  useEffect(() => {
    if (prev.current !== teamTime && teamTime != null) {
      setFlashing(true)
      const id = setTimeout(() => setFlashing(false), 850)
      prev.current = teamTime
      return () => clearTimeout(id)
    }
    prev.current = teamTime
  }, [teamTime])

  return flashing
}

// ---------------------------------------------------------------------------
// Medal config — only applied to prize-eligible teams
// ---------------------------------------------------------------------------

const MEDALS = [
  {
    emoji: '🥇',
    borderColor: '#C9A84C',
    bgClass: 'bg-yellow-400/8',
    textClass: 'text-yellow-300',
  },
  {
    emoji: '🥈',
    borderColor: '#9EA3A8',
    bgClass: 'bg-gray-400/8',
    textClass: 'text-gray-300',
  },
  {
    emoji: '🥉',
    borderColor: '#A0632A',
    bgClass: 'bg-amber-600/8',
    textClass: 'text-amber-400',
  },
]

// ---------------------------------------------------------------------------
// Score row
// ---------------------------------------------------------------------------

function ScoreRow({
  team,
  rank,
  prize,
  isBrewer = false,
}: {
  team: Team
  rank: number
  prize?: Prize
  isBrewer?: boolean
}) {
  const medal = !isBrewer && rank <= 3 ? MEDALS[rank - 1] : undefined
  const isDNS = team.teamTime == null
  const hasSplits = team.members.some((m) => m.time != null)
  const flashing = useScoreFlash(team.teamTime)

  return (
    <div
      className={`flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4 border-l-4 ${
        flashing ? 'animate-score-flash' : 'transition-colors duration-300'
      } ${medal ? medal.bgClass : ''} ${isDNS ? 'opacity-40' : ''}`}
      style={{ borderLeftColor: medal?.borderColor ?? 'transparent' }}
    >
      {/* Place / medal */}
      <div className="w-10 sm:w-14 flex-shrink-0 flex items-center justify-center">
        {isBrewer ? (
          <span className="font-display text-xl text-olive-light">{rank}.</span>
        ) : medal ? (
          <span className="text-3xl leading-none">{medal.emoji}</span>
        ) : isDNS ? (
          <span className="text-xs font-bold text-cream/20 uppercase tracking-wide">DNS</span>
        ) : (
          <span className="font-display text-2xl text-cream/40">{rank}.</span>
        )}
      </div>

      {/* Team info */}
      <div className="flex-1 min-w-0">
        {/* Name + badges */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`font-display leading-tight ${
              isBrewer
                ? 'text-xl sm:text-2xl text-cream/70'
                : 'text-2xl sm:text-3xl text-cream'
            }`}
          >
            {team.name}
          </span>

          {isBrewer && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-olive/20 text-olive-light px-2 py-0.5 rounded-full flex-shrink-0">
              <Beer size={10} /> Brewers
            </span>
          )}

          {prize && (
            <span className="text-xs font-bold bg-orange/20 text-orange px-2 py-0.5 rounded flex-shrink-0">
              {prize.description}
            </span>
          )}
        </div>

        {/* Member names — only shown when individually named */}
        {team.members.length === 3 && (
          <p className="text-cream/25 text-xs mt-0.5 truncate">
            {team.members.map((m) => m.name).join(' · ')}
          </p>
        )}

        {/* Individual splits (only if any member has a time) */}
        {hasSplits && (
          <p className="text-cream/35 text-xs font-mono mt-0.5 tabular-nums">
            {team.members.map((m) => (m.time != null ? formatTime(m.time) : '—')).join(' · ')}
          </p>
        )}

        {/* Scorekeeper note */}
        {team.notes && (
          <p className="text-cream/25 text-xs italic mt-0.5">{team.notes}</p>
        )}
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0">
        {isDNS ? (
          <span className="font-display text-xl text-cream/20">—</span>
        ) : (
          <span
            className={`font-mono font-bold tabular-nums ${
              isBrewer
                ? 'text-2xl sm:text-3xl text-cream/60'
                : medal
                  ? `text-3xl sm:text-4xl ${medal.textClass}`
                  : 'text-3xl sm:text-4xl text-cream'
            }`}
          >
            {formatTime(team.teamTime!)}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
      <div className="flex-1 h-px bg-olive/25" />
      <span className="text-xs text-olive-light font-bold uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-olive/25" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sponsor strip (shared with Roster — text fallback until images added)
// ---------------------------------------------------------------------------

function SponsorStrip({
  sponsors,
}: {
  sponsors: { id: string; name: string; imageData: string }[]
}) {
  if (sponsors.length === 0) return null
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 py-3">
      {sponsors.map((s) =>
        s.imageData ? (
          <img key={s.id} src={s.imageData} alt={s.name} className="h-7 object-contain opacity-60" />
        ) : (
          <span key={s.id} className="text-sm font-bold text-cream/30 tracking-wide">
            {s.name}
          </span>
        ),
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// No-event empty state
// ---------------------------------------------------------------------------

function NoEvent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
      <span className="text-7xl">🌭</span>
      <h2 className="font-display text-4xl text-orange">Hot Dog Eating Relay</h2>
      <p className="text-cream/40 text-sm max-w-xs">
        No active event. Head to{' '}
        <Link to="/event" className="text-orange underline">
          Event Setup
        </Link>{' '}
        to create one and set it active.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Scoreboard() {
  const { activeEvent } = useApp()

  // Full-bleed dark container — breaks out of main's padding
  return (
    <div className="-m-4 sm:-m-6 bg-dark text-cream flex flex-col min-h-[calc(100vh-8rem)] scoreboard-print-root">
      <CheckerboardStripe className="no-print" />

      {!activeEvent ? (
        <NoEvent />
      ) : (
        <>
          {/* ── Event header ─────────────────────────────────────────── */}
          <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/8 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-orange leading-none">
                {activeEvent.name}
              </h2>
              <p className="text-cream/40 text-xs mt-1">
                {activeEvent.venue} &middot; {activeEvent.context}
              </p>
            </div>

            {activeEvent.featuredBeer.name && (
              <div className="flex items-center gap-2 bg-olive/15 border border-olive/25 rounded-xl px-3 py-2">
                <span className="text-xl">🍺</span>
                <div>
                  <p className="text-xs text-olive-light font-bold uppercase tracking-wide leading-none mb-0.5">
                    Tonight's Beer
                  </p>
                  <p className="font-display text-lg text-cream leading-none">
                    {activeEvent.featuredBeer.name}
                  </p>
                  {activeEvent.featuredBeer.description && (
                    <p className="text-xs text-cream/35 mt-0.5">
                      {activeEvent.featuredBeer.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Column headers ───────────────────────────────────────── */}
          <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-1.5 border-b border-white/5">
            <div className="w-10 sm:w-14 flex-shrink-0" />
            <div className="flex-1 text-xs font-bold text-cream/25 uppercase tracking-widest">
              Team
            </div>
            <div className="text-xs font-bold text-cream/25 uppercase tracking-widest">
              Time
            </div>
          </div>

          {/* ── Rows ─────────────────────────────────────────────────── */}
          {(() => {
            const { eligible, brewers } = rankTeams(activeEvent.teams)
            const prizes = activeEvent.prizes

            return (
              <div className="flex-1 divide-y divide-white/5">
                {/* No teams yet */}
                {activeEvent.teams.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                    <span className="text-5xl">🌭</span>
                    <p className="text-cream/30 text-sm">
                      No teams registered yet —{' '}
                      <Link to="/teams" className="text-orange underline">
                        add teams
                      </Link>{' '}
                      to see the scoreboard.
                    </p>
                  </div>
                )}

                {/* Eligible teams */}
                {eligible.map((team, i) => (
                  <ScoreRow
                    key={team.id}
                    team={team}
                    rank={i + 1}
                    prize={prizes[i]}
                  />
                ))}

                {/* Brewer divider + rows */}
                {brewers.length > 0 && (
                  <>
                    <SectionDivider label="🍺 Brewers" />
                    {brewers.map((team, i) => (
                      <ScoreRow
                        key={team.id}
                        team={team}
                        rank={i + 1}
                        isBrewer
                      />
                    ))}
                  </>
                )}
              </div>
            )
          })()}

          {/* ── Sponsor strip (hidden in print) ──────────────────────── */}
          {activeEvent.sponsors.length > 0 && (
            <div className="border-t border-white/8 no-print">
              <SponsorStrip sponsors={activeEvent.sponsors} />
            </div>
          )}
        </>
      )}

      <CheckerboardStripe className="no-print" />
    </div>
  )
}
