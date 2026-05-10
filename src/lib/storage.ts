import type { AppData } from '../types'

const STORAGE_KEY = 'hotdog-relay-data'

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getInitialData()
    return JSON.parse(raw) as AppData
  } catch {
    return getInitialData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getInitialData(): AppData {
  return {
    activeEventId: 'event-2026',
    events: [
      {
        id: 'event-2026',
        name: 'Hot Dog Eating Relay 2026',
        date: '2026-05-09',
        venue: 'Halcyon Brewing',
        context: 'Seattle Beer Week',
        featuredBeer: {
          name: 'Hot Dog Time Machine',
          description: 'Collab beer release',
        },
        sponsors: [
          { id: 's1', name: 'Halcyon', imageData: '' },
          { id: 's2', name: 'ilk', imageData: '' },
          { id: 's3', name: 'Big Time', imageData: '' },
          { id: 's4', name: 'Ladd & Lass', imageData: '' },
          { id: 's5', name: '3 Magnets', imageData: '' },
          { id: 's6', name: 'Well 80', imageData: '' },
        ],
        teams: [],
        prizes: [],
        status: 'active',
      },
    ],
  }
}
