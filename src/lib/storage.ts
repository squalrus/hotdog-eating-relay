import type { AppData, HotdogEvent } from '../types'

export const STORAGE_KEY = 'hotdog-relay-data'

// ---------------------------------------------------------------------------
// Bundled event files
//
// Any JSON file added to src/data/events/ is automatically included in the
// build and surfaces in the History page — no code changes needed.
// Workflow: export an event from the app → move the .json file here → commit.
// ---------------------------------------------------------------------------

const eventGlob = import.meta.glob<HotdogEvent>('../data/events/*.json', {
  eager: true,
  import: 'default',
})

const BUNDLED_EVENTS: HotdogEvent[] = Object.values(eventGlob).map((e) => ({
  ...e,
  status: 'archived' as const, // file-based events are always read-only
}))

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

export function loadData(): AppData {
  let stored: AppData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    stored = raw ? (JSON.parse(raw) as AppData) : { activeEventId: null, events: [] }
  } catch {
    stored = { activeEventId: null, events: [] }
  }

  // Merge bundled events that aren't already tracked in localStorage.
  // localStorage wins when the same id exists — user edits take precedence
  // over the committed file (e.g. if they added member names after the fact).
  const knownIds = new Set(stored.events.map((e) => e.id))
  const merged = [
    ...stored.events,
    ...BUNDLED_EVENTS.filter((e) => !knownIds.has(e.id)),
  ]

  return { ...stored, events: merged }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
