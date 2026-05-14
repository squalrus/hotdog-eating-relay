import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatTime } from '../lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// timestamps: [start, split1, split2, end]  — length 0–4
// phase === timestamps.length, capped at 4

function memberElapsed(timestamps: number[], phase: number, now: number): number {
  if (phase === 0 || phase >= 4) return 0
  const memberStart = timestamps[phase - 1]
  return (now - memberStart) / 1000
}

function totalElapsed(timestamps: number[], phase: number, now: number): number {
  if (timestamps.length === 0) return 0
  const end = phase >= 4 ? timestamps[3] : now
  return (end - timestamps[0]) / 1000
}

// Round to centiseconds before storing
function roundCs(sec: number) {
  return Math.round(sec * 100) / 100
}

// ---------------------------------------------------------------------------
// Hotdog parade — animated while timer is running
// ---------------------------------------------------------------------------

function GlizzyParade() {
  return (
    <div className="flex items-end justify-center gap-2 h-10 sm:h-16">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="text-2xl sm:text-4xl select-none animate-glizzy-run"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          🌭
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Big circle trigger button
// ---------------------------------------------------------------------------

function TriggerButton({
  phase,
  onClick,
}: {
  phase: number
  onClick: () => void
}) {
  const LABELS = ['START', 'SPLIT 1', 'SPLIT 2', 'FINISH', '']
  const label = LABELS[phase] ?? ''

  const colorClass =
    phase === 0
      ? 'bg-olive hover:bg-olive-light shadow-olive/30'
      : 'bg-orange hover:bg-orange-light shadow-orange/30'

  return (
    <button
      onClick={onClick}
      className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full font-display text-2xl sm:text-3xl text-cream shadow-2xl transition-all duration-100 active:scale-95 ${colorClass}`}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Timer() {
  const { activeEvent, dispatch } = useApp()

  const [timestamps, setTimestamps] = useState<number[]>([])
  const [now, setNow] = useState(Date.now())
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [applied, setApplied] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const phase = Math.min(timestamps.length, 4)
  const isRunning = phase >= 1 && phase < 4
  const isDone = phase === 4

  // Live clock
  useEffect(() => {
    if (!isRunning) return
    let id: number
    const tick = () => {
      setNow(Date.now())
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [isRunning])

  // Trigger hotdog celebration on finish
  useEffect(() => {
    if (!isDone) return
    setCelebrating(true)
    const id = setTimeout(() => setCelebrating(false), 2200)
    return () => clearTimeout(id)
  }, [isDone])

  // Team / member info
  const teams = activeEvent?.teams ?? []
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null
  const memberNames =
    selectedTeam?.members.length === 3
      ? selectedTeam.members.map((m) => m.name)
      : ['Member 1', 'Member 2', 'Member 3']

  // Derived display values
  const totalSec = totalElapsed(timestamps, phase, now)
  const memberSec = memberElapsed(timestamps, phase, now)

  // Captured split durations (seconds)
  const splits = [
    timestamps.length >= 2 ? (timestamps[1] - timestamps[0]) / 1000 : null,
    timestamps.length >= 3 ? (timestamps[2] - timestamps[1]) / 1000 : null,
    timestamps.length >= 4 ? (timestamps[3] - timestamps[2]) / 1000 : null,
  ]
  const teamTotal = isDone ? (timestamps[3] - timestamps[0]) / 1000 : null

  // Phase copy
  const phaseLabel =
    phase === 0
      ? 'Select a team and press Space or tap to start'
      : phase === 1
        ? `🌭 ${memberNames[0]} is up!`
        : phase === 2
          ? `🌭 ${memberNames[1]} is up!`
          : phase === 3
            ? `🌭 ${memberNames[2]} is up!`
            : '🏁 Finished!'

  // Trigger action
  const handleAction = useCallback(() => {
    if (isDone) return
    const t = Date.now()
    setTimestamps((prev) => [...prev, t])
    setNow(t)
    setApplied(false)
  }, [isDone])

  // Spacebar — skip when focus is on a form element or button
  const actionRef = useRef(handleAction)
  actionRef.current = handleAction

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag)) return
      e.preventDefault()
      actionRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Apply captured times to the selected team
  function applyTimes() {
    if (!activeEvent || !selectedTeamId || !isDone || teamTotal == null) return
    const eid = activeEvent.id
    const tid = selectedTeamId
    dispatch({ type: 'SET_TEAM_TIME', eventId: eid, teamId: tid, time: roundCs(teamTotal) })
    if (selectedTeam?.members.length === 3) {
      splits.forEach((t, i) => {
        if (t != null) {
          dispatch({
            type: 'SET_MEMBER_TIME',
            eventId: eid,
            teamId: tid,
            memberIndex: i as 0 | 1 | 2,
            time: roundCs(t),
          })
        }
      })
    }
    setApplied(true)
  }

  function reset() {
    setTimestamps([])
    setNow(Date.now())
    setApplied(false)
    setCelebrating(false)
  }

  // -- No active event -------------------------------------------------------
  if (!activeEvent) {
    return (
      <div className="text-center py-16 space-y-3">
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-dark text-cream flex flex-col h-full">

      {/* ── Top bar: team selector ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 border-b border-white/8">
        <label className="text-xs text-cream/35 font-bold uppercase tracking-wide flex-shrink-0">
          Team
        </label>
        <select
          value={selectedTeamId}
          onChange={(e) => {
            setSelectedTeamId(e.target.value)
            setApplied(false)
          }}
          className="flex-1 bg-dark-light border border-white/10 text-cream text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-olive"
        >
          <option value="">— pick a team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.isBrewer ? ' 🍺' : ''}
            </option>
          ))}
        </select>
        {(phase > 0) && (
          <button
            onClick={reset}
            title="Reset timer"
            className="p-1.5 rounded text-cream/30 hover:text-cream transition-colors flex-shrink-0"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* ── Content: grows upward, never pushes the button ─────────────── */}
      <div className="flex-1 flex flex-col items-center justify-end gap-2 sm:gap-4 px-4 pt-4 sm:pt-6 pb-2 sm:pb-4 min-h-0 overflow-y-auto">

        {/* Phase label */}
        <p className="text-cream/50 text-sm font-semibold tracking-wide text-center">
          {phaseLabel}
        </p>

        {/* Primary: current member split (running) or final team total (done) */}
        <div className="text-center">
          {phase > 1 && isRunning && (
            <p className="text-cream/30 text-xs uppercase tracking-widest mb-1">
              {memberNames[phase - 1]}
            </p>
          )}
          <p className={`font-display text-6xl sm:text-8xl md:text-9xl tabular-nums leading-none transition-colors ${isDone ? 'text-orange' : 'text-cream'}`}>
            {formatTime(isDone && teamTotal != null ? teamTotal : phase >= 1 ? memberSec : 0)}
          </p>
        </div>

        {/* Secondary: running total (member 2 or 3 only) */}
        {isRunning && phase > 1 && (
          <div className="text-center">
            <p className="text-cream/25 text-xs uppercase tracking-widest mb-0.5">Total</p>
            <p className="font-display text-3xl sm:text-4xl tabular-nums text-cream/50">
              {formatTime(totalSec)}
            </p>
          </div>
        )}

        {/* Hotdog parade */}
        {isRunning && <GlizzyParade />}

        {/* Captured splits */}
        {splits.some((s) => s != null) && (
          <div className="flex flex-col gap-1.5 items-center">
            {splits.map((split, i) =>
              split != null ? (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-cream/30 text-xs w-20 text-right">{memberNames[i]}</span>
                  <span className="font-mono text-orange text-lg tabular-nums">
                    {formatTime(split)}
                  </span>
                </div>
              ) : null,
            )}
          </div>
        )}

      </div>

      {/* ── Action zone: fixed height so button never moves ─────────────── */}
      {/* min-h accommodates the largest element (h-44 button = 176px + gaps) */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3 px-4 pb-4 sm:pb-8 pt-1 sm:pt-2 min-h-[200px] sm:min-h-[240px]">
        {!isDone ? (
          <>
            <TriggerButton phase={phase} onClick={handleAction} />
            <p className="text-cream/20 text-xs text-center">
              {phase === 0
                ? 'Tap button or press Space to start'
                : phase === 3
                  ? 'Tap or press Space to finish'
                  : 'Tap or press Space to capture split'}
            </p>
          </>
        ) : (
          <div className="flex gap-2 w-full max-w-xs">
            <button
              onClick={applyTimes}
              disabled={!selectedTeamId || applied}
              className="flex-1 flex items-center justify-center gap-2 bg-olive text-cream font-bold py-3 rounded-xl text-sm hover:bg-olive-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {applied ? (
                <><Check size={15} /> Applied!</>
              ) : selectedTeamId ? (
                `Apply to ${selectedTeam?.name ?? 'team'}`
              ) : (
                'Select a team above'
              )}
            </button>
            <button
              onClick={reset}
              title="Reset timer"
              className="px-4 py-3 rounded-xl border border-white/15 text-cream/40 hover:text-cream hover:border-white/40 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Flying hotdogs on finish ─────────────────────────────────────── */}
      {celebrating && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[
            { top: '8%',  delay: 0,   dur: 1000 },
            { top: '22%', delay: 120, dur: 900  },
            { top: '38%', delay: 240, dur: 1100 },
            { top: '53%', delay: 60,  dur: 950  },
            { top: '67%', delay: 320, dur: 1050 },
            { top: '80%', delay: 160, dur: 850  },
            { top: '15%', delay: 440, dur: 1150 },
            { top: '72%', delay: 500, dur: 1200 },
          ].map((hd, i) => (
            <span
              key={i}
              className="absolute text-5xl select-none"
              style={{
                top: hd.top,
                animation: `hotdog-fly ${hd.dur}ms ease-out ${hd.delay}ms forwards`,
              }}
            >
              🌭
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
