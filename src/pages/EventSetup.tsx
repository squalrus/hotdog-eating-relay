import React, { useState, useRef, type ChangeEvent } from 'react'
import { Plus, Trash2, Download, Archive, GripVertical, Upload, ImageOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { exportEventJSON } from '../lib/exportImport'
import { generateId } from '../lib/utils'
import type { HotdogEvent, EventStatus, Sponsor } from '../types'

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

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: '📅 Upcoming',
  active: '🟢 Active',
  archived: '📦 Archived',
}

const STATUS_PILL: Record<EventStatus, string> = {
  upcoming: 'bg-olive/20 text-olive-dark',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-dark/10 text-dark/50',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-dark/60 mb-1">{children}</label>
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
  required,
}: {
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm"
    />
  )
}

// ---------------------------------------------------------------------------
// Sponsor row (drag-and-drop + image upload)
// ---------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 500 * 1024 // 500 KB

function SponsorRow({
  sponsor,
  index,
  total,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onUpload,
  onRemoveImage,
  onRemove,
}: {
  sponsor: Sponsor
  index: number
  total: number
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onUpload: () => void
  onRemoveImage: () => void
  onRemove: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 bg-cream rounded-lg px-2 py-2 border-2 transition-all select-none ${
        isDragging
          ? 'opacity-40 border-olive/30'
          : isDragOver
            ? 'border-orange bg-orange/5'
            : 'border-transparent'
      }`}
    >
      {/* Drag handle */}
      <div
        className="text-dark/20 hover:text-dark/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      {/* Thumbnail */}
      <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-dark/5 flex items-center justify-center">
        {sponsor.imageData ? (
          <img
            src={sponsor.imageData}
            alt={sponsor.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-dark/20">
            <ImageOff size={14} />
          </span>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-sm font-semibold text-dark truncate min-w-0">
        {sponsor.name}
      </span>

      {/* Position indicator (screen-reader + small screens) */}
      <span className="text-xs text-dark/20 tabular-nums flex-shrink-0">
        {index + 1}/{total}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onUpload}
          title={sponsor.imageData ? 'Replace logo image' : 'Upload logo image'}
          className="p-1.5 rounded text-dark/40 hover:text-olive hover:bg-olive/10 transition-colors"
        >
          <Upload size={13} />
        </button>

        {sponsor.imageData && (
          <button
            type="button"
            onClick={onRemoveImage}
            title="Remove logo image"
            className="p-1.5 rounded text-dark/30 hover:text-orange hover:bg-orange/10 transition-colors"
          >
            <ImageOff size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          title="Remove sponsor"
          className="p-1.5 rounded text-dark/30 hover:text-orange hover:bg-orange/10 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EventSetup() {
  const { data, dispatch } = useApp()

  const initialId =
    data.activeEventId ?? (data.events.length > 0 ? data.events[0].id : null)

  const [editingId, setEditingId] = useState<string | 'new' | null>(initialId)
  const [form, setForm] = useState<FormData>(() => {
    const ev = data.events.find((e) => e.id === initialId)
    return ev ? eventToForm(ev) : blankForm()
  })
  const [newSponsorName, setNewSponsorName] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Image upload state
  const [uploadForId, setUploadForId] = useState<string | null>(null)
  const [imageWarning, setImageWarning] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editingEvent =
    editingId && editingId !== 'new'
      ? (data.events.find((e) => e.id === editingId) ?? null)
      : null

  // -- Navigation -----------------------------------------------------------

  function selectEvent(id: string) {
    const ev = data.events.find((e) => e.id === id)
    if (!ev) return
    setEditingId(id)
    setForm(eventToForm(ev))
    setSavedAt(null)
    setImageWarning(null)
  }

  function startNew() {
    setEditingId('new')
    setForm(blankForm())
    setSavedAt(null)
    setImageWarning(null)
  }

  // -- Form -----------------------------------------------------------------

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setSavedAt(null)
  }

  function handleSave(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    const beerPayload = {
      name: form.beerName.trim(),
      description: form.beerDescription.trim(),
    }

    if (editingId === 'new') {
      const id = generateId()
      dispatch({
        type: 'CREATE_EVENT',
        event: {
          id,
          name: form.name.trim(),
          date: form.date,
          venue: form.venue.trim(),
          context: form.context.trim(),
          featuredBeer: beerPayload,
          sponsors: [],
          teams: [],
          prizes: [],
          status: 'upcoming',
        },
      })
      setEditingId(id)
    } else if (editingId) {
      dispatch({
        type: 'UPDATE_EVENT',
        id: editingId,
        patch: {
          name: form.name.trim(),
          date: form.date,
          venue: form.venue.trim(),
          context: form.context.trim(),
          featuredBeer: beerPayload,
        },
      })
    }

    setSavedAt(Date.now())
  }

  // -- Status ---------------------------------------------------------------

  function setStatus(status: EventStatus) {
    if (!editingId || editingId === 'new' || !editingEvent) return
    dispatch({ type: 'SET_EVENT_STATUS', id: editingId, status })
    if (status === 'active') {
      dispatch({ type: 'SET_ACTIVE_EVENT', id: editingId })
    } else if (data.activeEventId === editingId) {
      dispatch({ type: 'SET_ACTIVE_EVENT', id: null })
    }
    if (status === 'archived') {
      exportEventJSON({ ...editingEvent, status: 'archived' })
    }
  }

  // -- Sponsors: basic ------------------------------------------------------

  function addSponsor() {
    if (!editingId || editingId === 'new' || !newSponsorName.trim()) return
    dispatch({
      type: 'ADD_SPONSOR',
      eventId: editingId,
      sponsor: { id: generateId(), name: newSponsorName.trim(), imageData: '' },
    })
    setNewSponsorName('')
  }

  function removeSponsor(sponsorId: string) {
    if (!editingId || editingId === 'new') return
    dispatch({ type: 'REMOVE_SPONSOR', eventId: editingId, sponsorId })
  }

  function updateSponsors(sponsors: Sponsor[]) {
    if (!editingId || editingId === 'new') return
    dispatch({ type: 'REORDER_SPONSORS', eventId: editingId, sponsors })
  }

  // -- Sponsors: drag-to-reorder --------------------------------------------

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (dragId !== targetId) setDragOverId(targetId)
  }

  function handleDrop(targetId: string) {
    if (!editingEvent || !dragId || dragId === targetId) {
      setDragId(null)
      setDragOverId(null)
      return
    }
    const list = [...editingEvent.sponsors]
    const from = list.findIndex((s) => s.id === dragId)
    const to = list.findIndex((s) => s.id === targetId)
    if (from < 0 || to < 0) return
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item)
    updateSponsors(list)
    setDragId(null)
    setDragOverId(null)
  }

  // -- Sponsors: image upload -----------------------------------------------

  function openUpload(sponsorId: string) {
    setUploadForId(sponsorId)
    setImageWarning(null)
    fileInputRef.current?.click()
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // reset so same file can be re-selected
    if (!file || !uploadForId || !editingEvent) return

    if (file.size > MAX_IMAGE_BYTES) {
      setImageWarning(
        `"${file.name}" is ${(file.size / 1024).toFixed(0)} KB — over the 500 KB limit. ` +
          `Compress or resize the image before uploading.`,
      )
      setUploadForId(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result
      if (typeof base64 !== 'string' || !editingEvent) return
      updateSponsors(
        editingEvent.sponsors.map((s) =>
          s.id === uploadForId ? { ...s, imageData: base64 } : s,
        ),
      )
      setImageWarning(null)
      setUploadForId(null)
    }
    reader.readAsDataURL(file)
  }

  function removeImage(sponsorId: string) {
    if (!editingEvent) return
    updateSponsors(
      editingEvent.sponsors.map((s) =>
        s.id === sponsorId ? { ...s, imageData: '' } : s,
      ),
    )
  }

  // -------------------------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl text-dark">Event Setup</h2>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 bg-orange text-cream text-sm font-bold px-4 py-2 rounded-lg hover:bg-orange-light transition-colors"
        >
          <Plus size={15} /> New Event
        </button>
      </div>

      {/* Event list */}
      {data.events.length === 0 && (
        <p className="text-dark/50 text-sm text-center py-4">
          No events yet — click <strong>New Event</strong> to get started.
        </p>
      )}
      <div className="grid gap-2">
        {data.events
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((ev) => (
            <button
              key={ev.id}
              onClick={() => selectEvent(ev.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                editingId === ev.id
                  ? 'border-orange bg-orange/5'
                  : 'border-cream-dark bg-cream-dark hover:border-olive/40'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dark text-sm truncate">{ev.name}</p>
                <p className="text-xs text-dark/40 mt-0.5">
                  {ev.date} · {ev.venue}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {data.activeEventId === ev.id && (
                  <span className="text-xs bg-olive text-cream px-2 py-0.5 rounded font-bold">
                    Shown
                  </span>
                )}
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_PILL[ev.status]}`}>
                  {STATUS_LABEL[ev.status]}
                </span>
              </div>
            </button>
          ))}
      </div>

      {/* Edit / Create form */}
      {editingId !== null && (
        <form
          onSubmit={handleSave}
          className="bg-cream-dark rounded-xl border-2 border-olive/20 divide-y divide-olive/15"
        >
          {/* Section: core fields */}
          <div className="p-5 space-y-4">
            <h3 className="font-display text-xl text-dark">
              {editingId === 'new' ? 'Create New Event' : 'Event Details'}
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel>Event Name</FieldLabel>
                <TextInput
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Hot Dog Eating Relay 2027"
                  required
                />
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm"
                />
              </div>
              <div>
                <FieldLabel>Venue</FieldLabel>
                <TextInput
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="e.g. Halcyon Brewing"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Context</FieldLabel>
                <TextInput
                  name="context"
                  value={form.context}
                  onChange={handleChange}
                  placeholder="e.g. Seattle Beer Week"
                />
              </div>
            </div>

          </div>

          {/* Section: featured beer */}
          <div className="p-5 space-y-3">
            <h4 className="font-bold text-dark/70 text-sm">🍺 Featured Beer</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Beer Name</FieldLabel>
                <TextInput
                  name="beerName"
                  value={form.beerName}
                  onChange={handleChange}
                  placeholder="e.g. Hot Dog Time Machine"
                />
              </div>
              <div>
                <FieldLabel>Description / Notes</FieldLabel>
                <TextInput
                  name="beerDescription"
                  value={form.beerDescription}
                  onChange={handleChange}
                  placeholder="e.g. Collab beer release"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="bg-olive text-cream font-bold px-5 py-2 rounded-lg hover:bg-olive-light transition-colors text-sm"
              >
                {editingId === 'new' ? 'Create Event' : 'Save Changes'}
              </button>
              {savedAt !== null && (
                <span className="text-sm text-olive font-semibold">✓ Saved</span>
              )}
            </div>
          </div>

          {/* Section: status */}
          {editingId !== 'new' && editingEvent && (
            <div className="p-5 space-y-3">
              <h4 className="font-bold text-dark/70 text-sm">Event Status</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={editingEvent.status === 'upcoming'}
                  onClick={() => setStatus('upcoming')}
                  className="text-sm font-bold px-4 py-2 rounded-lg border-2 border-olive/30 hover:border-olive disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  📅 Upcoming
                </button>
                <button
                  type="button"
                  disabled={editingEvent.status === 'active'}
                  onClick={() => setStatus('active')}
                  className="text-sm font-bold px-4 py-2 rounded-lg border-2 border-green-600/30 text-green-800 hover:border-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  🟢 Set Active
                </button>
                <button
                  type="button"
                  disabled={editingEvent.status === 'archived'}
                  onClick={() => setStatus('archived')}
                  className="text-sm font-bold px-4 py-2 rounded-lg border-2 border-dark/20 text-dark/60 hover:border-dark/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Archive size={13} /> Archive + Export
                </button>
                {editingEvent.status === 'archived' && (
                  <button
                    type="button"
                    onClick={() => exportEventJSON(editingEvent)}
                    className="text-sm font-bold px-4 py-2 rounded-lg border-2 border-olive/40 text-olive hover:border-olive transition-colors flex items-center gap-1.5"
                  >
                    <Download size={13} /> Re-download JSON
                  </button>
                )}
              </div>
              <p className="text-xs text-dark/40 leading-relaxed">
                <strong>Upcoming</strong> — roster visible, no times.{' '}
                <strong>Active</strong> — scoreboard live, times can be entered.{' '}
                <strong>Archive</strong> — read-only, downloads JSON backup.
              </p>
            </div>
          )}

          {/* Section: sponsors */}
          {editingId !== 'new' && editingEvent && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-dark/70 text-sm">Sponsors</h4>
                {editingEvent.sponsors.length > 1 && (
                  <span className="text-xs text-dark/30">Drag ⠿ to reorder</span>
                )}
              </div>

              {/* Image size warning */}
              {imageWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  ⚠ {imageWarning}
                </div>
              )}

              {editingEvent.sponsors.length === 0 && (
                <p className="text-sm text-dark/40 italic">No sponsors yet.</p>
              )}

              <div className="space-y-1.5">
                {editingEvent.sponsors.map((s, i) => (
                  <SponsorRow
                    key={s.id}
                    sponsor={s}
                    index={i}
                    total={editingEvent.sponsors.length}
                    isDragging={dragId === s.id}
                    isDragOver={dragOverId === s.id}
                    onDragStart={() => setDragId(s.id)}
                    onDragOver={(e) => handleDragOver(e, s.id)}
                    onDrop={() => handleDrop(s.id)}
                    onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                    onUpload={() => openUpload(s.id)}
                    onRemoveImage={() => removeImage(s.id)}
                    onRemove={() => removeSponsor(s.id)}
                  />
                ))}
              </div>

              {/* Add sponsor */}
              <div className="flex gap-2 pt-1">
                <input
                  value={newSponsorName}
                  onChange={(e) => setNewSponsorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSponsor()
                    }
                  }}
                  placeholder="Sponsor name"
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-olive/20 bg-cream focus:border-olive focus:outline-none text-dark text-sm"
                />
                <button
                  type="button"
                  onClick={addSponsor}
                  disabled={!newSponsorName.trim()}
                  className="flex items-center gap-1 bg-olive/20 text-olive-dark font-bold px-3 py-2 rounded-lg hover:bg-olive/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <p className="text-xs text-dark/35">
                PNG, JPG, WebP or SVG · max 500 KB per image · shown on scoreboard &amp; roster
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
