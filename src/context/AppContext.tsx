import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react'
import type {
  AppData,
  HotdogEvent,
  Team,
  Sponsor,
  Prize,
  EventStatus,
} from '../types'
import { loadData, saveData, STORAGE_KEY } from '../lib/storage'

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'SYNC'; data: AppData }
  | { type: 'CREATE_EVENT'; event: HotdogEvent }
  | { type: 'UPDATE_EVENT'; id: string; patch: Partial<Omit<HotdogEvent, 'id' | 'teams' | 'sponsors' | 'prizes' | 'status'>> }
  | { type: 'SET_EVENT_STATUS'; id: string; status: EventStatus }
  | { type: 'SET_ACTIVE_EVENT'; id: string | null }
  | { type: 'ADD_TEAM'; eventId: string; team: Team }
  | { type: 'UPDATE_TEAM'; eventId: string; team: Team }
  | { type: 'DELETE_TEAM'; eventId: string; teamId: string }
  | { type: 'SET_TEAM_TIME'; eventId: string; teamId: string; time: number | undefined }
  | { type: 'SET_MEMBER_TIME'; eventId: string; teamId: string; memberIndex: 0 | 1 | 2; time: number | undefined }
  | { type: 'ADD_SPONSOR'; eventId: string; sponsor: Sponsor }
  | { type: 'REMOVE_SPONSOR'; eventId: string; sponsorId: string }
  | { type: 'REORDER_SPONSORS'; eventId: string; sponsors: Sponsor[] }
  | { type: 'SET_PRIZES'; eventId: string; prizes: Prize[] }
  | { type: 'IMPORT_EVENT'; event: HotdogEvent }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function patchEvent(
  events: HotdogEvent[],
  id: string,
  update: (e: HotdogEvent) => HotdogEvent,
): HotdogEvent[] {
  return events.map((e) => (e.id === id ? update(e) : e))
}

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'SYNC':
      return action.data

    case 'CREATE_EVENT':
      return { ...state, events: [...state.events, action.event] }

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: patchEvent(state.events, action.id, (e) => ({ ...e, ...action.patch })),
      }

    case 'SET_EVENT_STATUS':
      return {
        ...state,
        events: patchEvent(state.events, action.id, (e) => ({ ...e, status: action.status })),
      }

    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEventId: action.id }

    case 'ADD_TEAM':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          teams: [...e.teams, action.team],
        })),
      }

    case 'UPDATE_TEAM':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          teams: e.teams.map((t) => (t.id === action.team.id ? action.team : t)),
        })),
      }

    case 'DELETE_TEAM':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          teams: e.teams.filter((t) => t.id !== action.teamId),
        })),
      }

    case 'SET_TEAM_TIME':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          teams: e.teams.map((t) =>
            t.id === action.teamId ? { ...t, teamTime: action.time } : t,
          ),
        })),
      }

    case 'SET_MEMBER_TIME':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          teams: e.teams.map((t) => {
            if (t.id !== action.teamId) return t
            const members = t.members.map((m, i) =>
              i === action.memberIndex ? { ...m, time: action.time } : m,
            )
            return { ...t, members }
          }),
        })),
      }

    case 'ADD_SPONSOR':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          sponsors: [...e.sponsors, action.sponsor],
        })),
      }

    case 'REMOVE_SPONSOR':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          sponsors: e.sponsors.filter((s) => s.id !== action.sponsorId),
        })),
      }

    case 'REORDER_SPONSORS':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          sponsors: action.sponsors,
        })),
      }

    case 'SET_PRIZES':
      return {
        ...state,
        events: patchEvent(state.events, action.eventId, (e) => ({
          ...e,
          prizes: action.prizes,
        })),
      }

    case 'IMPORT_EVENT': {
      const exists = state.events.some((e) => e.id === action.event.id)
      return {
        ...state,
        events: exists
          ? state.events.map((e) => (e.id === action.event.id ? action.event : e))
          : [...state.events, action.event],
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue {
  data: AppData
  dispatch: Dispatch<Action>
  activeEvent: HotdogEvent | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadData)

  // Tracks whether the current state update came from another window so we
  // don't write it back to localStorage and trigger an echo loop.
  const fromSync = useRef(false)

  useEffect(() => {
    if (fromSync.current) {
      fromSync.current = false
      return
    }
    saveData(data)
  }, [data])

  // Listen for localStorage writes made by other windows/tabs and sync
  // this window's in-memory state to match.
  useEffect(() => {
    function handler(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        fromSync.current = true
        dispatch({ type: 'SYNC', data: JSON.parse(e.newValue) as AppData })
      } catch {
        fromSync.current = false
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const activeEvent = data.events.find((e) => e.id === data.activeEventId) ?? null

  return (
    <AppContext.Provider value={{ data, dispatch, activeEvent }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
