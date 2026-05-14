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

// Attach the filename (without .json) as the event slug for shareable URLs.
// If the JSON already has a slug field, it takes precedence.
const BUNDLED_EVENTS: HotdogEvent[] = Object.entries(eventGlob).map(([path, e]) => {
  const filenameSlug = path.split('/').pop()?.replace('.json', '')
  return {
    ...e,
    status: 'archived' as const,
    slug: e.slug ?? filenameSlug,
  }
})

const BUNDLED_BY_ID = new Map(BUNDLED_EVENTS.map((e) => [e.id, e]))

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

  // If a localStorage event corresponds to a bundled file, copy the slug so
  // the shareable URL works even when the event lives in localStorage.
  const storedWithSlugs = stored.events.map((e) => {
    const bundled = BUNDLED_BY_ID.get(e.id)
    if (bundled?.slug && !e.slug) return { ...e, slug: bundled.slug }
    return e
  })

  // Merge bundled events that aren't already tracked in localStorage.
  // localStorage wins when the same id exists — user edits take precedence.
  const knownIds = new Set(storedWithSlugs.map((e) => e.id))
  const merged = [
    ...storedWithSlugs,
    ...BUNDLED_EVENTS.filter((e) => !knownIds.has(e.id)),
  ]

  return { ...stored, events: merged }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
