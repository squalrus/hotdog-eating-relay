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
    // No active event on first load — 2026 is archived, user creates 2027 when ready
    activeEventId: null,
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
          { id: 's4', name: "Ladd & Lass", imageData: '' },
          { id: 's5', name: '3 Magnets', imageData: '' },
          { id: 's6', name: 'Well 80', imageData: '' },
        ],
        prizes: [],
        status: 'archived',
        teams: [
          // --- Prize-eligible teams ---
          {
            id: 't1',
            name: 'Cornwoggles',
            isBrewer: false,
            notes: '1 NA beer',
            // 3:41.66 = 221.66s
            teamTime: 221.66,
            members: [
              { name: 'Member 1' },
              { name: 'Member 2' },
              { name: 'Member 3' },
            ],
          },
          {
            id: 't2',
            name: 'BYU Wiener Soakers',
            isBrewer: false,
            // 4:05.49 = 245.49s
            teamTime: 245.49,
            members: [
              { name: 'Member 1' },
              { name: 'Member 2' },
              { name: 'Member 3' },
            ],
          },
          {
            id: 't3',
            name: 'Glizzy Guzzlers',
            isBrewer: false,
            // 4:25.38 = 265.38s
            teamTime: 265.38,
            members: [
              { name: 'Member 1' },
              { name: 'Member 2' },
              { name: 'Member 3' },
            ],
          },
          {
            id: 't4',
            name: 'Jessie & The Pussycats',
            isBrewer: false,
            // 6:00.58 = 360.58s
            teamTime: 360.58,
            members: [
              { name: 'Member 1' },
              { name: 'Member 2' },
              { name: 'Member 3' },
            ],
          },
          // --- Brewer teams (not prize-eligible) ---
          {
            id: 't5',
            name: 'Seattle (Uh-OH Hotdog)',
            isBrewer: true,
            // 3:07.36 = 187.36s — fastest overall time
            teamTime: 187.36,
            members: [
              { name: 'Member 1' },
              { name: 'Member 2' },
              { name: 'Member 3' },
            ],
          },
          {
            id: 't6',
            name: 'Oly (Wiener Wrestling Federation)',
            isBrewer: true,
            // 4:20.62 = 260.62s
            teamTime: 260.62,
            members: [
              { name: 'Member 1' },
              { name: 'Member 2' },
              { name: 'Member 3' },
            ],
          },
        ],
      },
    ],
  }
}
