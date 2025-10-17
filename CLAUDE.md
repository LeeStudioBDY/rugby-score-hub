# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rugby Score Hub is a lightweight, mobile-first web app for tracking live scores of grassroots or youth rugby games. It enables one person (coach/parent) to record live scoring events via a Scorekeeper interface, while others can view live scores and timeline via a separate Viewer interface using shareable links.

**Key characteristics:**
- No authentication required - uses tokenized URLs (capability URLs)
- Real-time updates via Supabase subscriptions
- Mobile-first design optimized for outdoor/sideline use
- Supports 3 game structures: no halves, 2 halves, 4 quarters

## Tech Stack

- **Frontend:** Vite + React + TypeScript
- **UI:** shadcn/ui components + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Realtime subscriptions)
- **State:** React Query (@tanstack/react-query)
- **Routing:** React Router DOM

## Development Commands

```bash
# Install dependencies
npm i

# Start dev server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm lint

# Preview production build
npm preview
```

## Architecture

### Database Schema (Supabase)

**Tables:**
- `games` - Core game data (teams, scores, tokens, status, structure)
- `events` - Individual scoring events (tries, conversions, penalties, drop goals, game control events)

**Key columns:**
- `games.scorekeeper_token` - Access token for scorekeeper interface
- `games.viewer_token` - Access token for viewer interface
- `games.game_status` - `not_started` | `in_progress` | `half_time` | `quarter_break` | `finished`
- `games.game_structure` - `1_period` | `2_halves` | `4_quarters`
- `events.team` - `team_a` | `team_b` | `game_control`
- `events.event_type` - Has CHECK constraint for allowed values. When adding new event types, must update the constraint in database migrations (see `supabase/migrations/`)

**Important:** The `events.event_type` column has a database CHECK constraint that must be updated when adding new event types. Check existing migrations to see allowed values.

### Application Structure

**Pages:**
- `Home.tsx` - Landing page (start/join game)
- `GameSetup.tsx` - Create new game with team names, colors, structure
- `Scorekeeper.tsx` - Scorekeeper interface with scoring buttons and game controls
- `Viewer.tsx` - Read-only view with live scores and timeline
- `JoinGame.tsx` - Join an existing game as viewer
- `About.tsx` - App info and donation links

**Key Components:**
- `GameTimeline.tsx` - Displays chronological event timeline with team-sided layout

**Integrations:**
- `src/integrations/supabase/client.ts` - Supabase client setup
- `src/integrations/supabase/types.ts` - Auto-generated TypeScript types from Supabase schema

### Real-time Architecture

**Scorekeeper flow:**
1. User creates game → generates unique scorekeeper + viewer tokens
2. Game ID + scorekeeper token stored in localStorage (`myGames`)
3. Scorekeeper page subscribes to `games` and `events` table changes
4. Recording events updates both `events` table and `games` score totals
5. Game state transitions (kick-off, half-time, etc.) update `game_status` and `current_period`

**Viewer flow:**
1. User accesses game via viewer token
2. Viewer page subscribes to `games` and `events` table changes
3. Auto-refreshes every 10 seconds as backup to realtime subscriptions
4. Displays live score and full event timeline

### Game State Machine

The `Scorekeeper` component manages complex game state transitions based on `game_structure`:

**2 Halves:**
- not_started → Kick Off → in_progress (period 1)
- in_progress (period 1) → End First Half → half_time
- half_time → Start Second Half → in_progress (period 2)
- in_progress (period 2) → End Game → finished

**4 Quarters:**
- Similar flow but with Q1-Q4 and quarter_break states between quarters
- half_time occurs after Q2

**1 Period:**
- not_started → Kick Off → in_progress (period 1) → End Game → finished

### Scoring Logic

**Try handling:**
- Recording a try (5 points) sets `awaitingConversion` state
- UI forces user to record conversion result (made +2 or missed +0) before allowing next action
- Both try and conversion are recorded as separate events

**Event recording:**
- Events are inserted into `events` table with game_id, team, event_type, points, period
- Score totals are updated in `games` table (`team_a_score` or `team_b_score`)
- All updates trigger real-time subscriptions to update connected clients

### Styling Conventions

- Uses shadcn/ui components with custom Tailwind configuration
- Team colors are stored in DB and applied dynamically via inline styles
- Gradient backgrounds: `bg-gradient-to-br from-primary/5 via-background to-accent/5`
- Color overlays use 5% opacity for subtle team branding
- Mobile-first with large touch targets (h-14, h-16 buttons)

### Path Alias

The `@` alias points to `src/` directory (configured in vite.config.ts and tsconfig.json):
```typescript
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
```

## Important Implementation Details

### Token Security
- Tokens are generated client-side using `Math.random()` (not cryptographically secure but sufficient for non-sensitive use case)
- Scorekeeper token allows write access
- Viewer token allows read-only access
- Both tokens are required in URL query params alongside game ID

### Local Storage
- `myGames` array stores recently created games for quick access
- Structure: `{ id, token, teamAName, teamBName, createdAt }`

### Event Timeline Time Calculation
- Time labels show minutes elapsed from start of each period
- Calculated by comparing event timestamp to first event in that period
- Format varies by structure: `12'`, `HT+5'`, `Q3 8'`

### Game Control Events
- Special events with `team: "game_control"` and `points: 0`
- Rendered as full-width timeline entries (not team-sided)
- Examples: kick_off, end_first_half, start_second_half, end_game

## Testing Notes

When testing game flow:
1. Always test the full state machine for each game structure
2. Verify real-time updates work in both scorekeeper and viewer
3. Test try + conversion flow (should block other actions until conversion recorded)
4. Check timeline displays correct time labels and team-sided layout
5. Verify QR code generation for viewer sharing
