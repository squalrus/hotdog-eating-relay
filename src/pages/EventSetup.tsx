import React, { useState, useRef, type ChangeEvent, type Dispatch } from 'react'
import { Plus, Trash2, Download, Archive, GripVertical, Upload, ImageOff, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { exportEventJSON } from '../lib/exportImport'
import { generateId } from '../lib/utils'
import type { HotdogEvent, EventStatus, Sponsor } from '../types'
import type { Action } from '../context/AppContext'

// ---------------------------------------------------------------------------
// Form state helpers
// ---------------------------------------------------------------------------

interface FormData {
  name: string
  date: string
  venue: string
  context: string
  beerName: string
  beerDescription: string
}

function blankForm(): FormData {
  return {
    name: '',
    date: new Date().toISOString().slice(0, 10),
    venue: '',
    context: '',
    beerName: '',
    beerDescription: '',
  }
}

function eventToForm(e: HotdogEvent): FormData {
  return {
    name: e.name,
    date: e.date,
    venue: e.venue,
    context: e.context,
    beerName: e.featuredBeer.name,
    beerDescription: e.featuredBeer.description,
  }
}

const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: '📅 Upcoming',
  active:   '🟢 Active',
  archived: '📦 Archived',
}

const MAX_IMAGE_BYTES = 500 * 1024

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-dark/60 mb-1 uppercase tracking-wide">
      {children}
    </label>
  )
}

function TextInput({
  name, value, onChange, placeholder, required,
}: {
  name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; required?: boolean
}) {
  return (
    <input
      name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className="w-full px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm"
    />
  )
}

// ---------------------------------------------------------------------------
// Core form fields (shared between create and edit)
// ---------------------------------------------------------------------------

function CoreFields({
  form, onChange,
}: {
  form: FormData
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Event Name</FieldLabel>
        <TextInput name="name" value={form.name} onChange={onChange}
          placeholder="Hot Dog Eating Relay 2027" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Date</FieldLabel>
          <input name="date" type="date" value={form.date} onChange={onChange} required
            className="w-full px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm" />
        </div>
        <div>
          <FieldLabel>Venue</FieldLabel>
          <TextInput name="venue" value={form.venue} onChange={onChange}
            placeholder="e.g. Halcyon Brewing" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Context</FieldLabel>
          <TextInput name="context" value={form.context} onChange={onChange}
            placeholder="e.g. Seattle Beer Week" />
        </div>
      </div>
      <div>
        <FieldLabel>🍺 Featured Beer</FieldLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <TextInput name="beerName" value={form.beerName} onChange={onChange}
            placeholder="e.g. Hot Dog Time Machine" />
          <TextInput name="beerDescription" value={form.beerDescription} onChange={onChange}
            placeholder="e.g. Collab beer release" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sponsor row (drag + image upload)
// ---------------------------------------------------------------------------

function SponsorRow({
  sponsor, index, total, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onUpload, onRemoveImage, onRemove,
}: {
  sponsor: Sponsor; index: number; total: number
  isDragging: boolean; isDragOver: boolean
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void
  onDrop: () => void; onDragEnd: () => void
  onUpload: () => void; onRemoveImage: () => void; onRemove: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart} onDragOver={onDragOver}
      onDrop={onDrop} onDragEnd={onDragEnd}
      className={`flex items-center gap-2 bg-cream rounded-lg px-2 py-2 border-2 transition-all select-none ${
        isDragging ? 'opacity-40 border-olive/30'
          : isDragOver ? 'border-orange bg-orange/5'
          : 'border-transparent'
      }`}
    >
      <div className="text-dark/20 hover:text-dark/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none" title="Drag to reorder">
        <GripVertical size={16} />
      </div>
      <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-dark/5 flex items-center justify-center">
        {sponsor.imageData
          ? <img src={sponsor.imageData} alt={sponsor.name} className="w-full h-full object-contain" />
          : <span className="text-dark/20"><ImageOff size={14} /></span>}
      </div>
      <span className="flex-1 text-sm font-semibold text-dark truncate min-w-0">{sponsor.name}</span>
      <span className="text-xs text-dark/20 tabular-nums flex-shrink-0">{index + 1}/{total}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button type="button" onClick={onUpload} title={sponsor.imageData ? 'Replace logo' : 'Upload logo'}
          className="p-1.5 rounded text-dark/40 hover:text-olive hover:bg-olive/10 transition-colors">
          <Upload size={13} />
        </button>
        {sponsor.imageData && (
          <button type="button" onClick={onRemoveImage} title="Remove logo"
            className="p-1.5 rounded text-dark/30 hover:text-orange hover:bg-orange/10 transition-colors">
            <ImageOff size={13} />
          </button>
        )}
        <button type="button" onClick={onRemove} title="Remove sponsor"
          className="p-1.5 rounded text-dark/30 hover:text-orange hover:bg-orange/10 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit drawer — all form fields + sponsors for an existing event
// ---------------------------------------------------------------------------

function EditDrawer({ event, dispatch }: { event: HotdogEvent; dispatch: Dispatch<Action> }) {
  const [form, setForm] = useState<FormData>(eventToForm(event))
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [newSponsorName, setNewSponsorName] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [uploadForId, setUploadForId] = useState<string | null>(null)
  const [imageWarning, setImageWarning] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSavedAt(null)
  }

  function handleSave(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    dispatch({
      type: 'UPDATE_EVENT', id: event.id,
      patch: {
        name: form.name.trim(), date: form.date,
        venue: form.venue.trim(), context: form.context.trim(),
        featuredBeer: { name: form.beerName.trim(), description: form.beerDescription.trim() },
      },
    })
    setSavedAt(Date.now())
  }

  function updateSponsors(sponsors: Sponsor[]) {
    dispatch({ type: 'REORDER_SPONSORS', eventId: event.id, sponsors })
  }

  function addSponsor() {
    if (!newSponsorName.trim()) return
    dispatch({ type: 'ADD_SPONSOR', eventId: event.id,
      sponsor: { id: generateId(), name: newSponsorName.trim(), imageData: '' } })
    setNewSponsorName('')
  }

  function removeSponsor(sponsorId: string) {
    dispatch({ type: 'REMOVE_SPONSOR', eventId: event.id, sponsorId })
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (dragId !== targetId) setDragOverId(targetId)
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const list = [...event.sponsors]
    const from = list.findIndex((s) => s.id === dragId)
    const to = list.findIndex((s) => s.id === targetId)
    if (from < 0 || to < 0) return
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item)
    updateSponsors(list)
    setDragId(null); setDragOverId(null)
  }

  function openUpload(sponsorId: string) {
    setUploadForId(sponsorId); setImageWarning(null)
    fileInputRef.current?.click()
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uploadForId) return
    if (file.size > MAX_IMAGE_BYTES) {
      setImageWarning(`"${file.name}" is ${(file.size / 1024).toFixed(0)} KB — over 500 KB limit.`)
      setUploadForId(null); return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result
      if (typeof base64 !== 'string') return
      updateSponsors(event.sponsors.map((s) => s.id === uploadForId ? { ...s, imageData: base64 } : s))
      setImageWarning(null); setUploadForId(null)
    }
    reader.readAsDataURL(file)
  }

  function removeImage(sponsorId: string) {
    updateSponsors(event.sponsors.map((s) => s.id === sponsorId ? { ...s, imageData: '' } : s))
  }

  return (
    <form onSubmit={handleSave} className="border-t border-olive/15 bg-cream/50 p-4 space-y-4">
      <input ref={fileInputRef} type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden" onChange={handleFile} />

      <CoreFields form={form} onChange={handleChange} />

      <div className="flex items-center gap-3">
        <button type="submit"
          className="bg-olive text-cream font-bold px-5 py-2 rounded-lg hover:bg-olive-light transition-colors text-sm">
          Save Changes
        </button>
        {savedAt !== null && <span className="text-sm text-olive font-semibold">✓ Saved</span>}
      </div>

      {/* Sponsors */}
      <div className="border-t border-olive/15 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-dark/70 text-sm">Sponsors</h4>
          {event.sponsors.length > 1 && (
            <span className="text-xs text-dark/30">Drag ⠿ to reorder</span>
          )}
        </div>

        {imageWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            ⚠ {imageWarning}
          </div>
        )}

        {event.sponsors.length === 0 && (
          <p className="text-sm text-dark/40 italic">No sponsors yet.</p>
        )}

        <div className="space-y-1.5">
          {event.sponsors.map((s, i) => (
            <SponsorRow key={s.id} sponsor={s} index={i} total={event.sponsors.length}
              isDragging={dragId === s.id} isDragOver={dragOverId === s.id}
              onDragStart={() => setDragId(s.id)}
              onDragOver={(e) => handleDragOver(e, s.id)}
              onDrop={() => handleDrop(s.id)}
              onDragEnd={() => { setDragId(null); setDragOverId(null) }}
              onUpload={() => openUpload(s.id)}
              onRemoveImage={() => removeImage(s.id)}
              onRemove={() => removeSponsor(s.id)} />
          ))}
        </div>

        <div className="flex gap-2">
          <input value={newSponsorName} onChange={(e) => setNewSponsorName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSponsor() } }}
            placeholder="Sponsor name"
            className="flex-1 px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm" />
          <button type="button" onClick={addSponsor} disabled={!newSponsorName.trim()}
            className="flex items-center gap-1 bg-olive/20 text-olive-dark font-bold px-3 py-2 rounded-lg hover:bg-olive/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
        <p className="text-xs text-dark/35">PNG, JPG, WebP or SVG · max 500 KB</p>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Event card — face + status controls + edit drawer
// ---------------------------------------------------------------------------

function EventCard({ event, isShown, dispatch }: {
  event: HotdogEvent
  isShown: boolean
  dispatch: Dispatch<Action>
}) {
  const [editOpen, setEditOpen] = useState(false)

  const year = new Date(event.date).getUTCFullYear()
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  function setStatus(status: EventStatus) {
    dispatch({ type: 'SET_EVENT_STATUS', id: event.id, status })
    if (status === 'active') {
      dispatch({ type: 'SET_ACTIVE_EVENT', id: event.id })
    } else if (isShown) {
      dispatch({ type: 'SET_ACTIVE_EVENT', id: null })
    }
    if (status === 'archived') {
      exportEventJSON({ ...event, status: 'archived' })
    }
  }

  const borderClass =
    event.status === 'active'   ? 'border-green-600/40 bg-green-50/30'
    : event.status === 'upcoming' ? 'border-olive/30 bg-cream-dark'
    : 'border-dark/10 bg-dark/3'

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${borderClass}`}>
      {/* ── Card face ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        {/* Name row */}
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="font-display text-xl text-dark leading-tight flex-1">{event.name}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs bg-dark text-cream px-2 py-0.5 rounded font-bold">{year}</span>
            {isShown && (
              <span className="text-xs bg-olive text-cream px-2 py-0.5 rounded font-bold">Shown</span>
            )}
          </div>
        </div>

        {/* Meta */}
        <p className="text-sm text-dark/50">
          {dateStr}{event.venue ? ` · ${event.venue}` : ''}{event.context ? ` · ${event.context}` : ''}
        </p>

        {/* Status + actions row */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {/* Status switcher */}
          {event.status !== 'archived' ? (
            <div className="flex gap-1">
              <button
                onClick={() => setStatus('upcoming')}
                disabled={event.status === 'upcoming'}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 transition-colors ${
                  event.status === 'upcoming'
                    ? 'border-olive bg-olive/20 text-olive-dark cursor-default'
                    : 'border-olive/30 text-dark/50 hover:border-olive hover:text-dark'
                }`}
              >
                {STATUS_LABEL.upcoming}
              </button>
              <button
                onClick={() => setStatus('active')}
                disabled={event.status === 'active'}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 transition-colors ${
                  event.status === 'active'
                    ? 'border-green-600 bg-green-50 text-green-800 cursor-default'
                    : 'border-green-600/30 text-dark/50 hover:border-green-600 hover:text-dark'
                }`}
              >
                {STATUS_LABEL.active}
              </button>
              <button
                onClick={() => setStatus('archived')}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 border-dark/20 text-dark/40 hover:border-dark/40 hover:text-dark transition-colors flex items-center gap-1"
              >
                <Archive size={11} /> Archive
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dark/40 bg-dark/8 px-2.5 py-1.5 rounded-lg">
                {STATUS_LABEL.archived}
              </span>
              <button
                onClick={() => exportEventJSON(event)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 border-olive/40 text-olive hover:border-olive transition-colors flex items-center gap-1"
              >
                <Download size={11} /> Download JSON
              </button>
            </div>
          )}

          {/* Edit toggle */}
          <button
            onClick={() => setEditOpen((v) => !v)}
            className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-colors flex items-center gap-1 ${
              editOpen
                ? 'border-orange bg-orange/10 text-orange'
                : 'border-dark/20 text-dark/50 hover:border-dark/40 hover:text-dark'
            }`}
          >
            {editOpen ? <><ChevronUp size={12} /> Close</> : <><ChevronDown size={12} /> Edit</>}
          </button>
        </div>
      </div>

      {/* ── Edit drawer ────────────────────────────────────────────────── */}
      {editOpen && <EditDrawer event={event} dispatch={dispatch} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create new event card
// ---------------------------------------------------------------------------

function CreateCard({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormData>(blankForm())

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    dispatch({
      type: 'CREATE_EVENT',
      event: {
        id: generateId(),
        name: form.name.trim(),
        date: form.date,
        venue: form.venue.trim(),
        context: form.context.trim(),
        featuredBeer: { name: form.beerName.trim(), description: form.beerDescription.trim() },
        sponsors: [], teams: [], prizes: [],
        status: 'upcoming',
      },
    })
    setForm(blankForm())
    setOpen(false)
  }

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
      open ? 'border-orange/40 bg-orange/5' : 'border-dashed border-olive/30 bg-cream-dark'
    }`}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-olive/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-olive/20 flex items-center justify-center flex-shrink-0">
            <Plus size={16} className="text-olive-dark" />
          </div>
          <span className="font-semibold text-dark/60">New Event</span>
        </button>
      ) : (
        <form onSubmit={handleCreate} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-dark">Create New Event</h3>
            <button type="button" onClick={() => { setOpen(false); setForm(blankForm()) }}
              className="text-xs text-dark/40 hover:text-dark transition-colors">
              Cancel
            </button>
          </div>

          <CoreFields form={form} onChange={handleChange} />

          <button type="submit" disabled={!form.name.trim()}
            className="bg-orange text-cream font-bold px-5 py-2 rounded-lg hover:bg-orange-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">
            Create Event
          </button>
        </form>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EventSetup() {
  const { data, dispatch } = useApp()

  const events = data.events
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <h2 className="font-display text-3xl text-dark">Event Setup</h2>

      <CreateCard dispatch={dispatch} />

      {events.length === 0 && (
        <p className="text-center text-dark/40 text-sm py-4">
          No events yet — create one above.
        </p>
      )}

      {events.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          isShown={data.activeEventId === ev.id}
          dispatch={dispatch}
        />
      ))}
    </div>
  )
}
