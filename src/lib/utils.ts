import type { Team } from '../types'

export interface RankedTeams {
  eligible: Team[]   // prize-eligible, sorted by time (DNS at bottom)
  brewers: Team[]    // brewer teams, sorted by time (DNS at bottom)
}

export function rankTeams(teams: Team[]): RankedTeams {
  const sort = (group: Team[]) => {
    const withTime = group.filter((t) => t.teamTime != null)
    const dns = group.filter((t) => t.teamTime == null)
    withTime.sort((a, b) => (a.teamTime ?? 0) - (b.teamTime ?? 0))
    return [...withTime, ...dns]
  }

  return {
    eligible: sort(teams.filter((t) => !t.isBrewer)),
    brewers: sort(teams.filter((t) => t.isBrewer)),
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Accepts "MM:SS" or raw seconds as a string. Returns seconds or null if invalid.
export function parseTime(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const colonMatch = trimmed.match(/^(\d+):(\d{2})$/)
  if (colonMatch) {
    const minutes = parseInt(colonMatch[1], 10)
    const secs = parseInt(colonMatch[2], 10)
    if (secs >= 60) return null
    return minutes * 60 + secs
  }

  const raw = Number(trimmed)
  if (!isNaN(raw) && raw >= 0) return Math.round(raw)

  return null
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
