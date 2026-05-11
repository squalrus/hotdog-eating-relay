export interface Member {
  name: string
  time?: number // seconds
}

export interface Team {
  id: string
  name: string
  // Either empty (individuals not tracked) or exactly 3 entries.
  // The UI enforces: fill all 3 or leave all blank.
  members: Member[]
  teamTime?: number  // float seconds, supports centiseconds (e.g. 221.66)
  isBrewer: boolean  // brewer teams compete but are ineligible for prizes
  notes?: string     // scorekeeper annotations (e.g. rule clarifications)
}

export interface Sponsor {
  id: string
  name: string
  imageData: string // base64; empty string = text-only display
}

export interface Prize {
  id: string
  place: string // "1st", "2nd", "3rd", or custom label
  description: string
}

export interface FeaturedBeer {
  name: string
  description: string
}

export type EventStatus = 'upcoming' | 'active' | 'archived'

export interface HotdogEvent {
  id: string
  name: string
  date: string // ISO date string
  venue: string
  context: string // e.g. "Seattle Beer Week"
  featuredBeer: FeaturedBeer
  sponsors: Sponsor[]
  teams: Team[]
  prizes: Prize[]
  status: EventStatus
}

export interface AppData {
  events: HotdogEvent[]
  activeEventId: string | null
}
