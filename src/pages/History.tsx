import { useState, useRef } from 'react'
import { Download, Upload, ChevronDown, ChevronRight, Beer, Trophy, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { exportEventJSON, importEventJSON } from '../lib/exportImport'
import { rankTeams, formatTime } from '../lib/utils'
import CheckerboardStripe from '../components/CheckerboardStripe'
import type { HotdogEvent } from '../types'

// ---------------------------------------------------------------------------
// Read-only scoreboard view for a historical event
// ---------------------------------------------------------------------------

const MEDAL = ['🥇', '🥈', '🥉']

function HistoryScoreboard({ event }: { event: HotdogEvent }) {
  const { eligible, brewers } = rankTeams(event.teams)

  if (event.teams.length === 0) {
    return <p className="text-cream/30 text-sm px-4 py-3">No teams recorded.</p>
  }

  return (
    <div className="bg-dark rounded-xl overflow-hidden text-cream">
      {/* Featured beer */}
      {event.featuredBeer.name && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-olive/10">
          <span>🍺</span>
          <span className="text-sm font-bold text-olive-light">{event.featuredBeer.name}</span>
          {event.featuredBeer.description && (
            <span className="text-xs text-cream/40">— {event.featuredBeer.description}</span>
          )}
        </div>
      )}

      {/* Eligible teams */}
      <div className="divide-y divide-white/5">
        {eligible.map((team, i) => (
          <div key={team.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl w-7 text-center flex-shrink-0 leading-none">
              {MEDAL[i] ?? <span className="font-display text-cream/40">{i + 1}.</span>}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg text-cream leading-tight truncate">
                {team.name}
              </p>
              {team.notes && (
                <p className="text-xs text-cream/30 italic">{team.notes}</p>
              )}
              {team.members.some((m) => m.time != null) && (
                <p className="text-xs font-mono text-cream/30 mt-0.5">
                  {team.members.map((m) => (m.time != null ? formatTime(m.time) : '—')).join(' · ')}
                </p>
              )}
            </div>
            <span className="font-mono tabular-nums flex-shrink-0 text-lg">
              {team.teamTime != null ? (
                <span className={i < 3 ? ['text-yellow-300', 'text-gray-300', 'text-amber-400'][i] : 'text-cream'}>
                  {formatTime(team.teamTime)}
                </span>
              ) : (
                <span className="text-cream/20">DNS</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Brewers */}
      {brewers.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-4 py-2 border-t border-white/5">
            <div className="flex-1 h-px bg-olive/30" />
            <span className="text-xs text-olive-light font-bold">🍺 BREWERS</span>
            <div className="flex-1 h-px bg-olive/30" />
          </div>
          <div className="divide-y divide-white/5">
            {brewers.map((team, i) => (
              <div key={team.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-display text-sm text-cream/30 w-7 text-center flex-shrink-0">
                  {i + 1}.
                </span>
                <p className="flex-1 font-display text-base text-cream/50 truncate">
                  {team.name}
                </p>
                <span className="font-mono tabular-nums text-cream/40 flex-shrink-0">
                  {team.teamTime != null ? formatTime(team.teamTime) : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-only roster view for a historical event
// ---------------------------------------------------------------------------

function HistoryRoster({ event }: { event: HotdogEvent }) {
  const eligible = event.teams.filter((t) => !t.isBrewer)
  const brewers = event.teams.filter((t) => t.isBrewer)

  if (event.teams.length === 0) {
    return <p className="text-dark/40 text-sm">No teams recorded.</p>
  }

  return (
    <div className="space-y-4">
      {eligible.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy size={11} /> Prize-Eligible
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {eligible.map((team) => (
              <div
                key={team.id}
                className="bg-cream rounded-xl border-2 border-cream-dark p-3"
              >
                <p className="font-display text-lg text-dark leading-tight">{team.name}</p>
                {team.members.length === 3 ? (
                  <ol className="mt-1.5 space-y-0.5">
                    {team.members.map((m, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-dark/30 w-4 text-right flex-shrink-0">{i + 1}.</span>
                        <span className="text-dark/70">{m.name}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-dark/35 italic mt-1.5">Members not listed</p>
                )}
                {team.notes && (
                  <p className="text-xs text-dark/40 italic mt-1.5 border-t border-dark/8 pt-1.5">
                    {team.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {brewers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-1.5">
            <Beer size={11} /> Brewers
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {brewers.map((team) => (
              <div
                key={team.id}
                className="bg-olive/8 rounded-xl border-2 border-olive/20 p-3"
              >
                <p className="font-display text-lg text-dark leading-tight">{team.name}</p>
                {team.members.length === 3 ? (
                  <ol className="mt-1.5 space-y-0.5">
                    {team.members.map((m, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-dark/30 w-4 text-right flex-shrink-0">{i + 1}.</span>
                        <span className="text-dark/60">{m.name}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-dark/35 italic mt-1.5">Members not listed</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Event card — collapsible with Results / Roster tabs
// ---------------------------------------------------------------------------

function EventCard({
  event,
  onExport,
}: {
  event: HotdogEvent
  onExport: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'results' | 'roster'>('results')

  const { eligible } = rankTeams(event.teams)
  const winner = eligible.find((t) => t.teamTime != null)

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const eligibleCount = event.teams.filter((t) => !t.isBrewer).length
  const brewerCount = event.teams.filter((t) => t.isBrewer).length

  return (
    <div className="bg-cream-dark rounded-xl border-2 border-olive/20 overflow-hidden">
      {/* Card header */}
      <div className="flex items-start gap-3 px-4 py-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-dark/30 hover:text-dark transition-colors flex-shrink-0 mt-0.5"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-xl text-dark leading-tight">{event.name}</h3>
            <span className="text-xs bg-dark text-cream px-2 py-0.5 rounded font-bold">
              {new Date(event.date).getUTCFullYear()}
            </span>
          </div>

          <p className="text-sm text-dark/50 mt-0.5">
            {eventDate} · {event.venue}
          </p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {winner ? (
              <span className="text-sm text-dark/70 flex items-center gap-1.5">
                🥇{' '}
                <strong className="text-dark">{winner.name}</strong>
                {winner.teamTime != null && (
                  <span className="font-mono text-dark/60">{formatTime(winner.teamTime)}</span>
                )}
              </span>
            ) : (
              <span className="text-sm text-dark/30 italic">No results recorded</span>
            )}

            <span className="text-xs text-dark/35">
              {eligibleCount} team{eligibleCount !== 1 ? 's' : ''}
              {brewerCount > 0 && ` · ${brewerCount} brewer${brewerCount !== 1 ? 's' : ''}`}
            </span>

            {event.featuredBeer.name && (
              <span className="text-xs text-olive-dark flex items-center gap-1">
                🍺 {event.featuredBeer.name}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {event.slug && (
            <Link
              to={`/history/${event.slug}`}
              onClick={(e) => e.stopPropagation()}
              title="Open shareable link"
              className="flex items-center gap-1 text-xs text-dark/50 font-bold px-2.5 py-1.5 rounded-lg border-2 border-dark/15 hover:bg-dark/5 transition-colors"
            >
              <Link2 size={12} /> Share
            </Link>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onExport()
            }}
            title="Download JSON backup"
            className="flex items-center gap-1 text-xs text-olive-dark font-bold px-2.5 py-1.5 rounded-lg border-2 border-olive/30 hover:bg-olive/10 transition-colors"
          >
            <Download size={12} /> JSON
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-olive/15 px-4 pb-4 pt-3 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-cream rounded-lg p-1 w-fit">
            {(['results', 'roster'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded text-sm font-bold transition-colors capitalize ${
                  tab === t
                    ? 'bg-dark text-cream'
                    : 'text-dark/50 hover:text-dark'
                }`}
              >
                {t === 'results' ? '🏆 Results' : '👥 Roster'}
              </button>
            ))}
          </div>

          {tab === 'results' ? (
            <HistoryScoreboard event={event} />
          ) : (
            <HistoryRoster event={event} />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function History() {
  const { data, dispatch } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  const archived = data.events
    .filter((e) => e.status === 'archived')
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const event = await importEventJSON(file)
      // Always import as archived — history is read-only
      dispatch({ type: 'IMPORT_EVENT', event: { ...event, status: 'archived' } })
      setImportSuccess(`"${event.name}" imported.`)
      setImportError(null)
      setTimeout(() => setImportSuccess(null), 3000)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
      setImportSuccess(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImport}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-dark">Event History</h2>
          <p className="text-sm text-dark/50 mt-0.5">
            {archived.length} archived event{archived.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 border-2 border-olive/40 text-olive-dark font-bold text-sm px-4 py-2 rounded-lg hover:bg-olive/10 transition-colors flex-shrink-0"
        >
          <Upload size={14} /> Import JSON
        </button>
      </div>

      {/* Import feedback */}
      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ {importSuccess}
        </div>
      )}

      {/* Empty state */}
      {archived.length === 0 && (
        <div className="bg-cream-dark rounded-xl border-2 border-olive/20 overflow-hidden">
          <CheckerboardStripe />
          <div className="text-center py-14 px-6 space-y-3">
            <p className="text-6xl">📅</p>
            <p className="font-display text-2xl text-dark">No archived events yet</p>
            <p className="text-dark/50 text-sm max-w-sm mx-auto">
              Archive an event from{' '}
              <strong>Event Setup</strong> to preserve it here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-orange underline font-semibold"
              >
                import a JSON backup
              </button>
              .
            </p>
          </div>
          <CheckerboardStripe />
        </div>
      )}

      {/* Event list */}
      {archived.length > 0 && (
        <div className="space-y-3">
          {archived.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onExport={() => exportEventJSON(event)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <p className="text-xs text-dark/30 text-center pb-2">
          Archived events are read-only · Use <strong>Import JSON</strong> to restore a backup from another device
        </p>
      )}
    </div>
  )
}
