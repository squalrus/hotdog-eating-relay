import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, Beer, Trophy, ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { rankTeams, formatTime, computeRanks } from '../lib/utils'
import { exportEventJSON } from '../lib/exportImport'
import CheckerboardStripe from '../components/CheckerboardStripe'
import type { HotdogEvent } from '../types'

// ---------------------------------------------------------------------------
// Read-only scoreboard for a historical event
// ---------------------------------------------------------------------------

const MEDAL_COLORS = ['text-yellow-300', 'text-gray-300', 'text-amber-400']
const MEDAL_EMOJI  = ['🥇', '🥈', '🥉']

function Scoreboard({ event }: { event: HotdogEvent }) {
  const { eligible, brewers } = rankTeams(event.teams)
  const eligibleRanks = computeRanks(eligible.map((t) => t.teamTime))
  const brewerRanks   = computeRanks(brewers.map((t) => t.teamTime))

  if (event.teams.length === 0) {
    return <p className="text-cream/30 text-sm px-4 py-6 text-center">No teams recorded.</p>
  }

  const Row = ({ team, rank, isBrewer = false }: { team: HotdogEvent['teams'][number]; rank: number; isBrewer?: boolean }) => {
    const hasSplits  = team.members.some((m) => m.time != null)
    const isDNS      = team.teamTime == null
    const medalEmoji = !isBrewer && rank <= 3 ? MEDAL_EMOJI[rank - 1] : undefined
    const medalColor = !isBrewer && rank <= 3 ? MEDAL_COLORS[rank - 1] : 'text-cream'

    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${isDNS ? 'opacity-40' : ''}`}>
        <div className="w-10 flex-shrink-0 text-center">
          {isBrewer ? (
            <span className="font-display text-lg text-olive-light">{rank}.</span>
          ) : isDNS ? (
            <span className="text-xs font-bold text-cream/20 uppercase">TBD</span>
          ) : medalEmoji ? (
            <span className="text-2xl leading-none">{medalEmoji}</span>
          ) : (
            <span className="font-display text-xl text-cream/40">{rank}.</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-display text-lg leading-tight truncate ${isBrewer ? 'text-cream/60' : 'text-cream'}`}>
            {team.name}
          </p>
          {team.members.length === 3 && (
            <p className="text-cream/25 text-xs mt-0.5 truncate">
              {team.members.map((m) => m.name).join(' · ')}
            </p>
          )}
          {hasSplits && team.members.length === 3 && (
            <p className="text-cream/30 text-xs font-mono mt-0.5 tabular-nums">
              {team.members.map((m) => (m.time != null ? formatTime(m.time) : '—')).join(' · ')}
            </p>
          )}
          {team.notes && (
            <p className="text-cream/25 text-xs italic mt-0.5">{team.notes}</p>
          )}
        </div>
        <span className={`font-mono tabular-nums text-base flex-shrink-0 ${medalColor} ${isBrewer ? 'text-cream/50' : ''}`}>
          {isDNS ? '—' : formatTime(team.teamTime!)}
        </span>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5">
      {eligible.map((team, i) => (
        <Row key={team.id} team={team} rank={eligibleRanks[i]} />
      ))}
      {brewers.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 h-px bg-olive/25" />
            <span className="text-xs text-olive-light font-bold">🍺 BREWERS</span>
            <div className="flex-1 h-px bg-olive/25" />
          </div>
          {brewers.map((team, i) => (
            <Row key={team.id} team={team} rank={brewerRanks[i]} isBrewer />
          ))}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-only roster for a historical event
// ---------------------------------------------------------------------------

function Roster({ event }: { event: HotdogEvent }) {
  const eligible = event.teams.filter((t) => !t.isBrewer)
  const brewers  = event.teams.filter((t) => t.isBrewer)

  if (event.teams.length === 0) {
    return <p className="text-dark/40 text-sm text-center py-6">No teams recorded.</p>
  }

  const TeamCard = ({ team }: { team: HotdogEvent['teams'][number] }) => (
    <div className={`rounded-xl border-2 p-3 ${team.isBrewer ? 'border-olive/30 bg-olive/5' : 'border-cream bg-white/60'}`}>
      <p className="font-display text-lg text-dark leading-tight">{team.name}</p>
      {team.members.length === 3 ? (
        <ol className="mt-1.5 space-y-0.5">
          {team.members.map((m, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-dark/30 w-4 text-right">{i + 1}.</span>
              <span className="text-dark/70">{m.name}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-dark/35 italic mt-1">Members not listed</p>
      )}
      {team.notes && <p className="text-xs text-dark/40 italic mt-1.5 border-t border-dark/8 pt-1.5">{team.notes}</p>}
    </div>
  )

  return (
    <div className="space-y-4 p-4">
      {eligible.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy size={11} /> Prize-Eligible
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {eligible.map((t) => <TeamCard key={t.id} team={t} />)}
          </div>
        </div>
      )}
      {brewers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-1.5">
            <Beer size={11} /> Brewers
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {brewers.map((t) => <TeamCard key={t.id} team={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { data } = useApp()
  const [tab, setTab] = useState<'results' | 'roster'>('results')

  const event = data.events.find((e) => e.slug === slug || e.id === slug) ?? null

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <p className="text-5xl">📅</p>
        <p className="font-display text-2xl text-dark">Event not found</p>
        <p className="text-dark/50 text-sm">
          This link may be outdated.{' '}
          <Link to="/history" className="text-orange underline font-semibold">Browse all history</Link>
        </p>
      </div>
    )
  }

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* Back link */}
      <div className="mb-4">
        <Link to="/history" className="inline-flex items-center gap-1.5 text-sm text-dark/50 hover:text-dark transition-colors">
          <ArrowLeft size={14} /> History
        </Link>
      </div>

      {/* Dark header */}
      <div className="bg-dark rounded-t-2xl overflow-hidden">
        <CheckerboardStripe />
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-orange leading-none">{event.name}</h1>
            <p className="text-cream/40 text-sm mt-1">{eventDate} · {event.venue}</p>
            {event.context && <p className="text-cream/30 text-xs mt-0.5">{event.context}</p>}
          </div>
          <div className="flex items-center gap-2">
            {event.featuredBeer.name && (
              <span className="text-xs bg-olive/20 border border-olive/30 text-olive-light px-2 py-1 rounded-lg">
                🍺 {event.featuredBeer.name}
              </span>
            )}
            <button
              onClick={() => exportEventJSON(event)}
              title="Download JSON"
              className="flex items-center gap-1 text-xs text-cream/40 hover:text-cream border border-white/15 hover:border-white/40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Download size={12} /> JSON
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/8">
          {(['results', 'roster'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'text-orange border-b-2 border-orange' : 'text-cream/40 hover:text-cream'
              }`}
            >
              {t === 'results' ? '🏆 Results' : '👥 Roster'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`rounded-b-2xl border-2 border-t-0 overflow-hidden ${tab === 'results' ? 'bg-dark border-dark' : 'bg-cream-dark border-olive/20'}`}>
        {tab === 'results' ? (
          <Scoreboard event={event} />
        ) : (
          <Roster event={event} />
        )}
      </div>

      {/* Sponsor strip */}
      {event.sponsors.filter((s) => s.name).length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 pt-4 pb-2">
          {event.sponsors.map((s) =>
            s.imageData ? (
              <img key={s.id} src={s.imageData} alt={s.name} className="h-6 object-contain opacity-60" />
            ) : (
              <span key={s.id} className="text-xs text-dark/30 font-semibold">{s.name}</span>
            )
          )}
        </div>
      )}
    </div>
  )
}
