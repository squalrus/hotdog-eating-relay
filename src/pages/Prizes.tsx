import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { generateId } from '../lib/utils'
import type { Prize } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEDAL = ['🥇', '🥈', '🥉']
const PLACE_HINT = ['1st', '2nd', '3rd']

function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0])
}

// ---------------------------------------------------------------------------
// Prize row — inline editable, commits on blur
// ---------------------------------------------------------------------------

function PrizeRow({
  prize,
  index,
  total,
  onSave,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  prize: Prize
  index: number
  total: number
  onSave: (p: Prize) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const [place, setPlace] = useState(prize.place)
  const [desc, setDesc] = useState(prize.description)

  function commit() {
    onSave({
      ...prize,
      place: place.trim() || PLACE_HINT[index] || prize.place,
      description: desc.trim(),
    })
  }

  const medal = MEDAL[index]

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-cream rounded-xl px-3 py-3 border-2 border-transparent hover:border-olive/20 transition-colors">
      {/* Medal / position indicator */}
      <span className="text-2xl w-8 text-center flex-shrink-0 leading-none">
        {medal ?? '🏅'}
      </span>

      {/* Inline inputs */}
      <div className="flex-1 grid grid-cols-[90px_1fr] gap-2 min-w-0">
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder={PLACE_HINT[index] ?? ordinal(index + 1)}
          aria-label="Place label"
          className="px-2 py-1.5 rounded-lg border-2 border-olive/20 bg-cream-dark focus:border-olive focus:outline-none text-dark text-sm font-bold text-center"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder="Prize description"
          aria-label="Prize description"
          className="px-2 py-1.5 rounded-lg border-2 border-olive/20 bg-cream-dark focus:border-olive focus:outline-none text-dark text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          disabled={index === 0}
          onClick={onMoveUp}
          title="Move up"
          className="p-1.5 rounded text-dark/30 hover:text-dark disabled:opacity-20 transition-colors"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={onMoveDown}
          title="Move down"
          className="p-1.5 rounded text-dark/30 hover:text-dark disabled:opacity-20 transition-colors"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Remove prize"
          className="p-1.5 rounded text-dark/30 hover:text-orange transition-colors ml-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add prize form
// ---------------------------------------------------------------------------

function AddPrizeForm({
  nextIndex,
  onAdd,
}: {
  nextIndex: number
  onAdd: (place: string, description: string) => void
}) {
  const [place, setPlace] = useState('')
  const [desc, setDesc] = useState('')

  function submit() {
    if (!desc.trim()) return
    onAdd(
      place.trim() || PLACE_HINT[nextIndex] || ordinal(nextIndex + 1),
      desc.trim(),
    )
    setPlace('')
    setDesc('')
  }

  return (
    <div className="bg-cream-dark rounded-xl border-2 border-olive/20 p-4 space-y-3">
      <h3 className="text-sm font-bold text-dark/60">Add Prize</h3>

      <div className="grid grid-cols-[90px_1fr] gap-2">
        <div>
          <label className="block text-xs text-dark/40 mb-1">Place</label>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={PLACE_HINT[nextIndex] ?? ordinal(nextIndex + 1)}
            className="w-full px-2 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm font-bold text-center"
          />
        </div>
        <div>
          <label className="block text-xs text-dark/40 mb-1">Prize Description</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. Trophy + $50 gift card"
            className="w-full px-2 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!desc.trim()}
        className="flex items-center gap-1.5 bg-orange text-cream text-sm font-bold px-4 py-2 rounded-lg hover:bg-orange-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={14} /> Add Prize
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scoreboard preview — shows how prizes map to ranks
// ---------------------------------------------------------------------------

function ScoreboardPreview({ prizes }: { prizes: Prize[] }) {
  if (prizes.length === 0) return null

  return (
    <div className="bg-dark rounded-xl p-4 space-y-2">
      <p className="text-xs text-cream/30 font-bold uppercase tracking-widest mb-3">
        Scoreboard preview
      </p>
      {prizes.map((prize, i) => (
        <div key={prize.id} className="flex items-center gap-3">
          <span className="text-xl w-7 text-center flex-shrink-0">
            {MEDAL[i] ?? '🏅'}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-display text-lg text-cream leading-none truncate block">
              Rank {i + 1} team
            </span>
          </div>
          <span className="text-xs bg-orange/20 text-orange font-bold px-2 py-0.5 rounded flex-shrink-0">
            {prize.description || prize.place}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Prizes() {
  const { activeEvent, dispatch } = useApp()

  if (!activeEvent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <p className="text-5xl">🥇</p>
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
          <strong>{activeEvent.name}</strong> is read-only.
        </p>
      </div>
    )
  }

  const prizes = activeEvent.prizes
  const eventId = activeEvent.id

  function savePrizes(updated: Prize[]) {
    dispatch({ type: 'SET_PRIZES', eventId, prizes: updated })
  }

  function handleSave(updated: Prize) {
    savePrizes(prizes.map((p) => (p.id === updated.id ? updated : p)))
  }

  function handleMove(index: number, dir: 'up' | 'down') {
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= prizes.length) return
    const list = [...prizes]
    ;[list[index], list[swap]] = [list[swap], list[index]]
    savePrizes(list)
  }

  function handleDelete(id: string) {
    savePrizes(prizes.filter((p) => p.id !== id))
  }

  function handleAdd(place: string, description: string) {
    savePrizes([...prizes, { id: generateId(), place, description }])
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-dark">Prizes</h2>
        <p className="text-sm text-dark/50 mt-0.5">{activeEvent.name}</p>
      </div>

      {/* Prize list */}
      <div className="bg-cream-dark rounded-xl border-2 border-olive/20 p-2 space-y-1.5 min-h-[80px]">
        {prizes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Trophy size={28} className="text-dark/20" />
            <p className="text-sm text-dark/40 italic">
              No prizes yet — add one below.
            </p>
          </div>
        ) : (
          prizes.map((prize, i) => (
            <PrizeRow
              key={prize.id}
              prize={prize}
              index={i}
              total={prizes.length}
              onSave={handleSave}
              onMoveUp={() => handleMove(i, 'up')}
              onMoveDown={() => handleMove(i, 'down')}
              onDelete={() => handleDelete(prize.id)}
            />
          ))
        )}
      </div>

      {/* Add form */}
      <AddPrizeForm nextIndex={prizes.length} onAdd={handleAdd} />

      {/* Scoreboard preview */}
      <ScoreboardPreview prizes={prizes} />

      {/* Helper note */}
      <p className="text-xs text-dark/30 text-center pb-2">
        Prize order matches scoreboard rank — first prize goes to rank&nbsp;1, and so on.
        Prizes only apply to prize-eligible teams; brewer teams are excluded.
      </p>
    </div>
  )
}
