# Hot Dog Eating Relay — Build Plan

## Overview

A React + Vite single-page application for running and scoring the **Hot Dog Eating Relay**
at Halcyon Brewing during Seattle Beer Week. Teams of three eat a hotdog and drink a beer
in sequence; the combined time is the team score. Times are entered manually.

**Primary use:** Managing future annual events and building pre-event excitement.
The 2026 event (May 9, 2026) just occurred — it will be entered as the first historical
record. The app is designed and built for 2027 and beyond.

**Data persistence:** `localStorage` as the live working store + JSON export/import for
long-term archival. Download a `.json` file to save an event permanently; re-import to
view historical events. No backend required — deployable as a static site.

---

## Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast dev loop, easy static deploy |
| Styling | Tailwind CSS | Utility-first, great for scoreboard grids |
| Routing | React Router v6 | Client-side nav, no server needed |
| State / Persistence | React Context + `localStorage` | Zero backend, works offline |
| Icons | Lucide React | Lightweight, consistent icon set |
| Fonts | Google Fonts — `Boogaloo` (display) + `Nunito` (body) | Retro-groovy feel matching the poster |

---

## Branding & Theme

Derived from the 2026 event poster:

| Token | Value | Usage |
|---|---|---|
| `olive` | `#6B7A2A` | Borders, checkerboard, nav accents |
| `orange` | `#C85A1E` | Headings, highlights, CTAs |
| `cream` | `#F5F0E4` | Page/card backgrounds |
| `dark` | `#2A2416` | Text, scoreboard background |
| Checkerboard | Repeating olive squares | Top/bottom borders on header & footer |
| Mascot | 🌭 emoji (placeholder) | Favicon, loading states, empty states |
| App title | "Hot Dog Eating Relay" | Fixed — the annual event name |
| Context line | "@ Halcyon Brewing · Seattle Beer Week" | Shown in header |

> **Featured beer and sponsors are per-event, not global.** Each year's event has its own
> beer and sponsor list configured in Event Setup. Nothing is hardcoded.

---

## Data Model

```
AppData {
  events: Event[]
  activeEventId: string | null
}

Event {
  id: string
  name: string           // e.g. "Hot Dog Eating Relay 2027"
  date: string           // ISO date string
  venue: string          // e.g. "Halcyon Brewing"
  context: string        // e.g. "Seattle Beer Week"
  featuredBeer: {
    name: string         // e.g. "Hot Dog Time Machine"
    description: string  // optional tasting notes / collab info
  }
  sponsors: Sponsor[]    // ordered list; changes year to year
  teams: Team[]
  prizes: Prize[]
  status: "upcoming" | "active" | "archived"
}

Team {
  id: string
  name: string
  members: [Member, Member, Member]
  teamTime?: number      // seconds; null if not yet entered
  isBrewer: boolean      // true = brewery staff team; competes but ineligible for prizes
}

Member {
  name: string
  time?: number          // seconds; null if not individually tracked
}

Sponsor {
  id: string
  name: string
  imageData: string      // base64 encoded image (empty string = text-only)
}

Prize {
  id: string
  place: string          // "1st", "2nd", "3rd", or custom label
  description: string
}
```

### Event Status Flow
```
"upcoming"  →  teams registered, roster published, no times yet
    ↓
"active"    →  event is live, times being entered
    ↓
"archived"  →  read-only historical record, exportable as JSON
```

---

## Application Views

| Route | View | Purpose |
|---|---|---|
| `/` | Scoreboard | Live scoreboard for the active event |
| `/roster` | Team Roster | Pre-event public view — registered teams, builds hype |
| `/event` | Event Setup | Create/configure events; beer, sponsors, status |
| `/teams` | Team Manager | Add, edit, delete teams and their three members |
| `/results` | Results Entry | Enter team and/or individual times |
| `/prizes` | Prizes | Manage prize listings |
| `/history` | Event History | Browse and re-import archived past events |

---

## Build Steps

### Step 1 — Project Scaffold
- Initialize Vite + React in the current `hotdog-eating-relay/` directory
- Install: `tailwindcss`, `react-router-dom`, `lucide-react`
- Configure Tailwind with the custom color tokens above
- Add Google Fonts (`Boogaloo`, `Nunito`) via `index.html`
- Add 🌭 favicon via `public/favicon.svg`
- Base layout shell with olive checkerboard header/footer stripe component

### Step 2 — Data Layer
- `src/lib/storage.ts` — typed `localStorage` read/write helpers
- `src/lib/exportImport.ts`:
  - `exportEventJSON(event)` — triggers `.json` file download
  - `importEventJSON(file)` — parses, validates, and merges an uploaded file
- `src/context/AppContext.tsx` — global state provider + reducer
  - Actions: `CREATE_EVENT`, `UPDATE_EVENT`, `SET_EVENT_STATUS`, `ADD_TEAM`,
    `UPDATE_TEAM`, `DELETE_TEAM`, `SET_TIME`, `ADD_SPONSOR`, `REMOVE_SPONSOR`,
    `REORDER_SPONSORS`, `SET_PRIZES`
- Pure utility functions:
  - `rankTeams(teams[])` — sort by time ascending, DNS teams at bottom; brewer teams always sort after eligible teams regardless of time
  - `formatTime(seconds)` → `"MM:SS"` display string
  - `parseTime(string)` → seconds (handles `MM:SS` input)
- `src/lib/rules.ts` — `CONTEST_RULES` string array (static, not per-event)

### Step 3 — App Shell & Navigation
- Sticky top bar: checkerboard stripe + "Hot Dog Eating Relay" + active event year badge
- Sidebar or bottom tab nav with all routes
- Admin vs Display distinction: nav shows admin links; scoreboard and roster are
  designed to be shown on a projector or shared publicly
- Responsive: scoreboard fills full screen on desktop, stacked on mobile

### Step 4 — Event Setup (`/event`)
- **Per-event fields** (all configurable, none hardcoded):
  - Event name, date, venue, context line (e.g. "Seattle Beer Week")
  - Featured beer: name + optional description
  - Sponsors: ordered list with image upload per sponsor (see Step 9)
  - Prizes (delegated to `/prizes` page)
- Status controls:
  - "Set as Upcoming" — roster visible, no times
  - "Set as Active" — scoreboard live, times can be entered
  - "Archive Event" — read-only, triggers JSON export prompt
- Only one event can be "active" at a time; others are upcoming or archived

### Step 5 — Team Manager (`/teams`)
- Card grid of all teams in the active/upcoming event
- "Add Team" form: team name + 3 member name fields + "Brewer team" toggle
- Brewer teams are brewery staff competing for fun — they appear on the roster and scoreboard but are **not eligible for prizes**; shown with a "🍺 Brewers" badge
- Inline edit and delete per team
- Validation: all 4 name fields required
- Warning before delete if team has times recorded
- Teams added here are immediately visible on the Roster page

### Step 6 — Team Roster (`/roster`) — Pre-Event Hype View
- Public-facing, designed to be projected or shared as a link
- Shows: event name, date, venue, featured beer badge, team list
- Each team card: team name + 3 member names, styled like a tournament bracket card; brewer teams show a "🍺 Brewers" badge
- Contest rules displayed prominently (sourced from `CONTEST_RULES` in `src/lib/rules.ts`):
  - Finish both the hotdog AND the beer before the next person starts
  - Show an empty mouth to judges before tagging your teammate
  - Hands off beer and hotdog until it is your turn
  - No pre-soaking hotdogs before your turn
- Sponsor logos in the footer (same strip as scoreboard)
- No times shown — this is the "who's competing" view
- Retro poster aesthetic: large type, checkerboard accents, star decorations
- Visible for events with status `"upcoming"` or `"active"`

### Step 7 — Results Entry (`/results`)
- One row per team, expandable to show individual member rows
- Brewer teams visually distinguished with a badge; can still have times entered
- Team time: single `MM:SS` input
- Individual times: three `MM:SS` inputs (optional — leave blank if not tracking)
- Soft warning if individual times sum differs from team time by > 5 seconds
- Contest rules shown in a collapsible sidebar or info panel as a judge reference
- Auto-save to localStorage on blur; visual "Saved ✓" confirmation

### Step 8 — Scoreboard (`/`)
- Dark background (`#2A2416`), large retro type (`Boogaloo` font)
- Ranked table: **Place | Team Name | Members | Team Time | Individual Splits**
- Prize-eligible teams ranked first by time; brewer teams ranked separately below with a "🍺 Brewers" section divider — they get their own ranking but no prize callouts
- Medal row highlights: gold / silver / bronze apply only to prize-eligible teams
- Prize badge next to winning eligible rows
- "🍺 Brewers" badge on brewer team rows
- DNS badge for teams with no time entered
- Featured beer banner below the event header: "🍺 Tonight's Beer: [name]" + description
- Sponsor logo strip in footer
- Checkerboard olive stripe top and bottom
- Smooth row reorder animation on time updates
- Fullscreen button for event-day display mode

### Step 9 — Sponsor Images
- File input on Event Setup (PNG, JPG, WebP; warn if > 500 KB)
- Stored as base64 per event in `localStorage`
- Sponsors are per-event — each year's list is independent
- Drag-to-reorder sponsor display order
- Text-only fallback if no image uploaded (shows sponsor name styled)
- Same sponsor strip renders on both Scoreboard and Roster views

### Step 10 — Featured Beer Display
- Configured per event in Event Setup (not global)
- Name field + optional description/tasting notes field
- Renders as a styled badge on both Scoreboard and Roster:
  "🍺 Tonight's Beer: Hot Dog Time Machine"
- If description is present, shown as a small subline

### Step 11 — Prize Manager (`/prizes`)
- Add / edit / delete prize entries (per active event)
- Fields: place label + description
- Prizes render inline on the scoreboard next to their rank

### Step 12 — Event History (`/history`)
- List of all archived events, sorted newest first
- Each entry: event name, date, venue, team count, winner
- "View Scoreboard" → read-only scoreboard for that event
- "View Roster" → read-only roster for that event
- "Export JSON" → re-download the archive
- "Import Event" → file picker to load a `.json` back in
- No editing on archived events

### Step 13 — Polish & Theming
- Retro star SVG decorators at key layout points (matching poster aesthetic)
- Checkerboard stripe component reused across all views
- Print stylesheet for scoreboard (`@media print`)
- Empty states: 🌭 emoji + retro-styled placeholder copy
- Transitions: row reorder animation on scoreboard, card fade-in on roster

---

## Persistence Strategy

```
Write path:  User action → reducer → AppContext state → localStorage
Read path:   App load → localStorage → AppContext state → components

Archive:     Active event → [Archive] → status: "archived" + JSON export prompt
Restore:     History page → [Import JSON] → file parsed → event added to localStorage
```

Historical `.json` files live on the user's machine and are fully portable.

---

## First-Use Seed Data (2026 event — just occurred)

On first load (empty localStorage), pre-populate with the 2026 event marked `archived`
so the user can fill in results and it's immediately available in history:

```json
{
  "activeEventId": null,
  "events": [{
    "id": "event-2026",
    "name": "Hot Dog Eating Relay 2026",
    "date": "2026-05-09",
    "venue": "Halcyon Brewing",
    "context": "Seattle Beer Week",
    "featuredBeer": {
      "name": "Hot Dog Time Machine",
      "description": "Collab beer release"
    },
    "sponsors": [
      { "id": "s1", "name": "Halcyon", "imageData": "" },
      { "id": "s2", "name": "ilk", "imageData": "" },
      { "id": "s3", "name": "Big Time", "imageData": "" },
      { "id": "s4", "name": "Ladd & Lass", "imageData": "" },
      { "id": "s5", "name": "3 Magnets", "imageData": "" },
      { "id": "s6", "name": "Well 80", "imageData": "" }
    ],
    "teams": [],
    "prizes": [],
    "status": "archived"
  }]
}
```

The user then:
1. Enters 2026 teams and results manually into this archived event
2. Creates a new "Hot Dog Eating Relay 2027" event when ready

---

## Deployment Options (when ready)

| Platform | Steps |
|---|---|
| Vercel | `npm run build` → `vercel deploy` (auto-detects Vite) |
| Netlify | Drag `dist/` folder into Netlify UI |
| GitHub Pages | Set `base` in `vite.config.ts` → push `dist/` to `gh-pages` branch |
| Local only | `npm run build` → open `dist/index.html` in any browser |

---

## Future Enhancements (out of scope for v1)

- Live stopwatch / timer mode (click Start/Stop per participant)
- Cloud sync (Supabase / Firebase) for multi-device scoreboard display
- Public shareable URL for the roster (QR code at the venue)
- Export results to CSV or printable bracket PDF
- Photo gallery per event
- Team registration form (public-facing link for sign-ups)
