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

// Computes dead-heat positions for a pre-sorted array of nullable times.
// Tied centisecond values share the same rank; positions are skipped after a tie.
// e.g. [200, 220, 220, 250] → [1, 2, 2, 4]
export function computeRanks(times: (number | undefined | null)[]): number[] {
  const ranks: number[] = []
  for (let i = 0; i < times.length; i++) {
    if (i === 0) { ranks.push(1); continue }
    const prev = times[i - 1]
    const curr = times[i]
    const tied =
      prev != null &&
      curr != null &&
      Math.round(prev * 100) === Math.round(curr * 100)
    ranks.push(tied ? ranks[i - 1] : i + 1)
  }
  return ranks
}
