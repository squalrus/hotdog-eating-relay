import { useState } from 'react'
import { ChevronDown, ChevronRight, Beer, AlertTriangle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatTime, parseTime } from '../lib/utils'
import { CONTEST_RULES } from '../lib/rules'
import type { Team } from '../types'

// ---------------------------------------------------------------------------
// TimeInput — local edit state, saves on blur, shows ✓ / error feedback
// ---------------------------------------------------------------------------

function TimeInput({
  value,
  onSave,
  'aria-label': ariaLabel,
}: {
  value: number | undefined
  onSave: (seconds: number | undefined) => void
  'aria-label': string
}) {
  const [local, setLocal] = useState(value != null ? formatTime(value) : '')
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function commit() {
    const trimmed = local.trim()
    if (!trimmed) {
      onSave(undefined)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
      return
    }
    const parsed = parseTime(trimmed)
    if (parsed == null) {
      setStatus('error')
      return
    }
    setLocal(formatTime(parsed)) // canonicalize display
    onSave(parsed)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={local}
        onChange={(e) => {
          setLocal(e.target.value)
          setStatus('idle')
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder="00:00.00"
        aria-label={ariaLabel}
        className={`w-28 px-2.5 py-1.5 rounded-lg border-2 font-mono text-sm text-center focus:outline-none transition-colors ${
          status === 'error'
            ? 'border-red-400 bg-red-50 text-red-700'
            : status === 'saved'
              ? 'border-green-500 bg-green-50'
              : 'border-olive/20 bg-cream focus:border-olive text-dark'
        }`}
      />
      <span
        className={`text-xs font-bold w-14 transition-opacity ${
          status === 'saved'
            ? 'text-green-600 opacity-100'
            : status === 'error'
              ? 'text-red-500 opacity-100'
              : 'opacity-0'
        }`}
      >
        {status === 'saved' ? '✓ Saved' : status === 'error' ? 'Invalid' : '✓ Saved'}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual-sum warning helper
// ---------------------------------------------------------------------------

function useSumWarning(team: Team): { diff: number; sumSeconds: number } | null {
  if (team.teamTime == null) return null
  const times = team.members.map((m) => m.time).filter((t): t is number => t != null)
  if (times.length < 3) return null
  const sumSeconds = times.reduce((a, b) => a + b, 0)
  const diff = Math.abs(sumSeconds - team.teamTime)
  return diff > 5 ? { diff, sumSeconds } : null
}

// ---------------------------------------------------------------------------
// TeamRow — one card per team with expandable individual time inputs
// ---------------------------------------------------------------------------

function TeamRow({ team, eventId }: { team: Team; eventId: string }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const sumWarning = useSumWarning(team)

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden ${
        team.isBrewer
          ? 'border-olive/30 bg-olive/5'
          : 'border-cream-dark bg-cream-dark'
      }`}
    >
      {/* ── Team row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-dark/30 hover:text-dark transition-colors flex-shrink-0"
          title={expanded ? 'Hide individual times' : 'Show individual times'}
        >
          {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-lg text-dark leading-tight">
              {team.name}
            </span>
            {team.isBrewer && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-olive/20 text-olive-dark px-2 py-0.5 rounded-full">
                <Beer size={10} /> Brewers
              </span>
            )}
          </div>
          {team.notes && (
            <p className="text-xs text-dark/40 italic mt-0.5">{team.notes}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          <TimeInput
            value={team.teamTime}
            aria-label={`Team time for ${team.name}`}
            onSave={(time) =>
              dispatch({ type: 'SET_TEAM_TIME', eventId, teamId: team.id, time })
            }
          />
        </div>
      </div>

      {/* ── Expanded: individual member rows ─────────────────────────── */}
      {expanded && (
        <div className="border-t border-dark/10 divide-y divide-dark/5 bg-white/40">
          {team.members.map((member, i) => (
            <div key={i} className="flex items-center gap-3 pl-12 pr-4 py-2.5">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-xs text-dark/30 w-4 text-right flex-shrink-0">
                  {i + 1}.
                </span>
                <span className="text-sm text-dark/70 truncate">{member.name}</span>
                {member.time != null && (
                  <span className="text-xs text-dark/30 font-mono">
                    {formatTime(member.time)}
                  </span>
                )}
              </div>
              <TimeInput
                value={member.time}
                aria-label={`Time for ${member.name}`}
                onSave={(time) =>
                  dispatch({
                    type: 'SET_MEMBER_TIME',
                    eventId,
                    teamId: team.id,
                    memberIndex: i as 0 | 1 | 2,
                    time,
                  })
                }
              />
            </div>
          ))}

          {/* Sum mismatch warning */}
          {sumWarning && (
            <div className="flex items-start gap-2 pl-12 pr-4 py-2.5 bg-amber-50">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Individual times sum to{' '}
                <strong className="font-mono">{formatTime(sumWarning.sumSeconds)}</strong>
                {' '}— team time is{' '}
                <strong className="font-mono">{formatTime(team.teamTime!)}</strong>
                {' '}({sumWarning.diff.toFixed(2)}s apart).
                Double-check the splits.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible rules reference for judges
// ---------------------------------------------------------------------------

function RulesPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border-2 border-olive/20 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-olive/8 hover:bg-olive/15 transition-colors text-left"
      >
        <Info size={14} className="text-olive flex-shrink-0" />
        <span className="flex-1 text-sm font-bold text-dark/60">
          Contest Rules — judge reference
        </span>
        {open ? (
          <ChevronDown size={14} className="text-dark/30" />
        ) : (
          <ChevronRight size={14} className="text-dark/30" />
        )}
      </button>

      {open && (
        <ol className="px-4 py-3 space-y-2 bg-cream">
          {CONTEST_RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-dark/70">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange text-cream text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Results() {
  const { activeEvent } = useApp()

  if (!activeEvent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <p className="text-5xl">⏱</p>
        <p className="font-display text-2xl text-dark">No active event</p>
        <p className="text-dark/50 text-sm">
          Set one up in{' '}
          <Link to="/event" className="text-orange underline font-semibold">
            Event Setup
          </Link>
          .
        </p>
      </div>
    )
  }

  if (activeEvent.status === 'archived') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <p className="text-5xl">📦</p>
        <p className="font-display text-2xl text-dark">Event archived</p>
        <p className="text-dark/50 text-sm">
          <strong>{activeEvent.name}</strong> is read-only. Set a different event as
          active to enter results.
        </p>
      </div>
    )
  }

  const eligible = activeEvent.teams.filter((t) => !t.isBrewer)
  const brewers = activeEvent.teams.filter((t) => t.isBrewer)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-dark">Results Entry</h2>
        <p className="text-sm text-dark/50 mt-0.5">{activeEvent.name}</p>
      </div>

      {/* Rules panel */}
      <RulesPanel />

      {/* Empty state */}
      {activeEvent.teams.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-olive/20 rounded-xl">
          <p className="text-4xl mb-3">🌭</p>
          <p className="text-dark/40 text-sm">
            No teams yet —{' '}
            <Link to="/teams" className="text-orange underline">
              add them in Team Manager
            </Link>
            .
          </p>
        </div>
      )}

      {/* Eligible teams */}
      {eligible.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-dark/40 uppercase tracking-widest">
            Prize-Eligible Teams
          </h3>
          {eligible.map((team) => (
            <TeamRow key={team.id} team={team} eventId={activeEvent.id} />
          ))}
        </section>
      )}

      {/* Brewer teams */}
      {brewers.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-1.5">
            <Beer size={11} /> Brewers
          </h3>
          {brewers.map((team) => (
            <TeamRow key={team.id} team={team} eventId={activeEvent.id} />
          ))}
        </section>
      )}

      {/* Footer hint */}
      {activeEvent.teams.length > 0 && (
        <p className="text-xs text-dark/30 text-center pb-2">
          Click ▶ on any team to enter individual splits &middot; Format:{' '}
          <span className="font-mono">MM:SS.cc</span> &middot; Press Enter or click away
          to save
        </p>
      )}
    </div>
  )
}
