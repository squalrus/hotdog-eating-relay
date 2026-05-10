import { useState } from 'react'
import { Plus, Pencil, Trash2, Beer, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateId } from '../lib/utils'
import type { Team } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamForm {
  name: string
  m0: string
  m1: string
  m2: string
  isBrewer: boolean
  notes: string
}

function blankForm(): TeamForm {
  return { name: '', m0: '', m1: '', m2: '', isBrewer: false, notes: '' }
}

function teamToForm(t: Team): TeamForm {
  return {
    name: t.name,
    m0: t.members[0].name,
    m1: t.members[1].name,
    m2: t.members[2].name,
    isBrewer: t.isBrewer,
    notes: t.notes ?? '',
  }
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-dark/50 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Team card (display)
// ---------------------------------------------------------------------------

function TeamCard({
  team,
  onEdit,
  onDelete,
}: {
  team: Team
  onEdit: () => void
  onDelete: () => void
}) {
  const hasTime = team.teamTime != null
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (hasTime && !confirming) {
      setConfirming(true)
      return
    }
    onDelete()
  }

  return (
    <div
      className={`rounded-xl border-2 p-4 flex gap-4 items-start ${
        team.isBrewer
          ? 'border-olive/30 bg-olive/5'
          : 'border-cream-dark bg-cream-dark'
      }`}
    >
      {/* Left: names */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-lg text-dark leading-tight">{team.name}</span>
          {team.isBrewer && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-olive/20 text-olive-dark px-2 py-0.5 rounded-full">
              <Beer size={11} /> Brewers
            </span>
          )}
          {!team.isBrewer && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange/10 text-orange px-2 py-0.5 rounded-full">
              <Trophy size={11} /> Eligible
            </span>
          )}
        </div>
        <ol className="mt-2 space-y-0.5">
          {team.members.map((m, i) => (
            <li key={i} className="text-sm text-dark/70 flex gap-2">
              <span className="text-dark/30 w-4 text-right flex-shrink-0">{i + 1}.</span>
              <span className={m.name === 'Member 1' || m.name === 'Member 2' || m.name === 'Member 3' ? 'text-dark/30 italic' : ''}>
                {m.name || <span className="text-dark/30 italic">unnamed</span>}
              </span>
            </li>
          ))}
        </ol>
        {team.notes && (
          <p className="mt-2 text-xs text-dark/50 italic">📝 {team.notes}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-dark/40 hover:text-dark hover:bg-white/60 transition-colors"
          title="Edit team"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={handleDelete}
          className={`p-2 rounded-lg transition-colors ${
            confirming
              ? 'bg-orange text-cream'
              : 'text-dark/40 hover:text-orange hover:bg-orange/10'
          }`}
          title={confirming ? 'Click again to confirm delete' : 'Delete team'}
        >
          <Trash2 size={15} />
        </button>
        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-dark/40 hover:text-dark px-1"
          >
            cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add / Edit form
// ---------------------------------------------------------------------------

function TeamForm({
  initial,
  onSave,
  onCancel,
  isEditing,
}: {
  initial: TeamForm
  onSave: (f: TeamForm) => void
  onCancel: () => void
  isEditing: boolean
}) {
  const [form, setForm] = useState<TeamForm>(initial)

  function set(key: keyof TeamForm, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.m0.trim() || !form.m1.trim() || !form.m2.trim()) return
    onSave(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-cream-dark rounded-xl border-2 border-orange/30 p-5 space-y-4"
    >
      <h3 className="font-display text-xl text-dark">
        {isEditing ? 'Edit Team' : 'Add New Team'}
      </h3>

      <FormField
        label="Team Name"
        value={form.name}
        onChange={(v) => set('name', v)}
        placeholder="Team name"
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField
          label="Member 1"
          value={form.m0}
          onChange={(v) => set('m0', v)}
          placeholder="First up"
          required
        />
        <FormField
          label="Member 2"
          value={form.m1}
          onChange={(v) => set('m1', v)}
          placeholder="Second"
          required
        />
        <FormField
          label="Member 3"
          value={form.m2}
          onChange={(v) => set('m2', v)}
          placeholder="Anchor"
          required
        />
      </div>

      <FormField
        label="Notes (optional)"
        value={form.notes}
        onChange={(v) => set('notes', v)}
        placeholder="e.g. 1 NA beer"
      />

      {/* Brewer toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => set('isBrewer', !form.isBrewer)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
            form.isBrewer ? 'bg-olive' : 'bg-dark/20'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              form.isBrewer ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </div>
        <div>
          <p className="text-sm font-bold text-dark">Brewer team</p>
          <p className="text-xs text-dark/50">
            Competes for time but is not eligible for prizes
          </p>
        </div>
      </label>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="bg-orange text-cream font-bold px-5 py-2 rounded-lg hover:bg-orange-light transition-colors text-sm"
        >
          {isEditing ? 'Save Changes' : 'Add Team'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border-2 border-dark/15 text-dark/60 font-bold hover:border-dark/30 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamManager() {
  const { dispatch, activeEvent } = useApp()
  const [mode, setMode] = useState<'idle' | 'add' | { editId: string }>('idle')

  const teams = activeEvent?.teams ?? []
  const eligible = teams.filter((t) => !t.isBrewer)
  const brewers = teams.filter((t) => t.isBrewer)

  function handleSave(form: TeamForm) {
    if (!activeEvent) return

    const members: Team['members'] = [
      { name: form.m0.trim() },
      { name: form.m1.trim() },
      { name: form.m2.trim() },
    ]

    if (mode === 'add') {
      dispatch({
        type: 'ADD_TEAM',
        eventId: activeEvent.id,
        team: {
          id: generateId(),
          name: form.name.trim(),
          members,
          isBrewer: form.isBrewer,
          notes: form.notes.trim() || undefined,
        },
      })
    } else if (typeof mode === 'object') {
      const existing = teams.find((t) => t.id === mode.editId)
      if (!existing) return
      dispatch({
        type: 'UPDATE_TEAM',
        eventId: activeEvent.id,
        team: {
          ...existing,
          name: form.name.trim(),
          members,
          isBrewer: form.isBrewer,
          notes: form.notes.trim() || undefined,
        },
      })
    }

    setMode('idle')
  }

  function handleDelete(teamId: string) {
    if (!activeEvent) return
    dispatch({ type: 'DELETE_TEAM', eventId: activeEvent.id, teamId })
  }

  function getFormInitial(): TeamForm {
    if (typeof mode === 'object') {
      const t = teams.find((t) => t.id === mode.editId)
      if (t) return teamToForm(t)
    }
    return blankForm()
  }

  // -- No active event guard ------------------------------------------------
  if (!activeEvent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-5xl mb-4">🌭</p>
        <p className="text-dark/50">No active event. Set one up in <strong>Event Setup</strong> first.</p>
      </div>
    )
  }

  // -- Archived event guard -------------------------------------------------
  if (activeEvent.status === 'archived') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-5xl mb-4">📦</p>
        <p className="text-dark/50">
          <strong>{activeEvent.name}</strong> is archived and read-only.
          Set a different event as active to manage teams.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-dark">Teams</h2>
          <p className="text-sm text-dark/50 mt-0.5">{activeEvent.name}</p>
        </div>
        {mode === 'idle' && (
          <button
            onClick={() => setMode('add')}
            className="flex items-center gap-1.5 bg-orange text-cream text-sm font-bold px-4 py-2 rounded-lg hover:bg-orange-light transition-colors"
          >
            <Plus size={15} /> Add Team
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {mode !== 'idle' && (
        <TeamForm
          initial={getFormInitial()}
          onSave={handleSave}
          onCancel={() => setMode('idle')}
          isEditing={typeof mode === 'object'}
        />
      )}

      {/* Empty state */}
      {teams.length === 0 && mode === 'idle' && (
        <div className="text-center py-10 border-2 border-dashed border-olive/20 rounded-xl">
          <p className="text-4xl mb-3">🌭</p>
          <p className="text-dark/40 text-sm">No teams yet — add the first one!</p>
        </div>
      )}

      {/* Eligible teams */}
      {eligible.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={12} /> Prize-Eligible · {eligible.length} team{eligible.length !== 1 ? 's' : ''}
          </h3>
          {eligible.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={() => setMode({ editId: team.id })}
              onDelete={() => handleDelete(team.id)}
            />
          ))}
        </section>
      )}

      {/* Brewer teams */}
      {brewers.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-dark/40 uppercase tracking-widest flex items-center gap-2">
            <Beer size={12} /> Brewers · {brewers.length} team{brewers.length !== 1 ? 's' : ''}
          </h3>
          {brewers.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={() => setMode({ editId: team.id })}
              onDelete={() => handleDelete(team.id)}
            />
          ))}
        </section>
      )}
    </div>
  )
}
