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

// Formats float seconds as MM:SS.cc (centiseconds always shown for precision).
export function formatTime(seconds: number): string {
  const totalCs = Math.round(seconds * 100)
  const cs = totalCs % 100
  const totalSec = Math.floor(totalCs / 100)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

// Accepts "MM:SS", "MM:SS.c", or "MM:SS.cc". Returns float seconds or null.
export function parseTime(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d+):(\d{2})(?:\.(\d{1,2}))?$/)
  if (match) {
    const minutes = parseInt(match[1], 10)
    const secs = parseInt(match[2], 10)
    if (secs >= 60) return null
    const cs = match[3] ? parseInt(match[3].padEnd(2, '0'), 10) : 0
    return minutes * 60 + secs + cs / 100
  }

  const raw = Number(trimmed)
  if (!isNaN(raw) && raw >= 0) return raw

  return null
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
