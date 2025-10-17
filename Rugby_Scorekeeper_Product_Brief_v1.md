# 🏉 Rugby Scorekeeper — Product Brief (v1)

## 1. Overview
A lightweight, mobile-first web app for tracking and viewing live scores of grassroots or youth rugby games. Optimized for sideline use in outdoor conditions (cold, wet, limited network). Enables one person (coach/parent) to record live scoring events, while others can view a live timeline or final results via a separate shareable link.

---

## 2. Target Users
**Primary:** Parent or coach on the sideline keeping score.  
**Secondary:** Parents/spectators viewing live or final scores.

---

## 3. Core Use Cases
- Start and configure a new game (team names, colours, halves/quarters).  
- Record scoring events (tries, conversions, penalties, drop goals).  
- View live timeline and total scores.  
- Edit or delete events.  
- Export final score/timeline as image.  
- Share viewer link or QR code.  
- Include optional donation links to charities.

---

## 4. Key Features

### A. Game Setup
- Input team names + colours.
- Select game structure (no halves / 2 halves / 4 quarters).
- Generate unique Game ID + two links (Scorekeeper + Viewer).
- Display QR codes for both links.

### B. Scorekeeper UI
- Large buttons: Try, Conversion (Made/Missed), Penalty, Drop Goal.
- Force conversion result after try before next event.
- Game controls: Kick-off, Half-time, Start 2nd half, Full-time.
- Edit/delete events and timestamps.
- Undo last event.
- Offline cache and auto-sync.
- Quick QR access to viewer link.

### C. Viewer UI
- Big, readable scores.
- Timeline of all events (chronological, grouped by period).
- Auto-refresh every 10s + pull-to-refresh.
- Export final timeline as image (after Full-time).
- Share QR for same viewer link.

### D. About & Donate
- App overview and privacy note.
- Up to three charity cards (logo + link).
- Optional “Suggest a charity” link.

---

## 5. Authentication
- **No login required**.  
- Uses secure, tokenised URLs for edit (Scorekeeper) and view (Viewer).  
- “Lock Game” option after full-time prevents edits.

---

## 6. UI Flows

### Home
- Buttons: Start New Game | Join/View Game | About & Donate

### Start New Game
- Inputs for teams, colours, structure.
- Generate Game + QR codes for Scorekeeper & Viewer.

### Scorekeeper (Live)
- Score buttons per team.
- Game period controls.
- Timeline of events (editable).
- Share viewer QR.

### Viewer
- Live scores + timeline.
- Auto-refresh/pull-to-refresh.
- Export final timeline as PNG.

### End Game
- Final summary card.
- Export as image.
- Share or start new game.

---

## 7. Data Model
**Game:** id, structure, status, teams, colours, timestamps, tokens.  
**Events:** id, ts, type, team, period, editable flag.  
**Settings:** local cache, last game, colours.

---

## 8. Technical Requirements
- Responsive PWA (mobile-first).  
- Backend: lightweight DB (Firebase/Supabase).  
- Offline mode + sync queue.  
- No personal data collection.  
- Capability URLs (unguessable tokens).

---

## 9. Non-Functional
- <1s load time after first visit.  
- Works offline.  
- Accessible: high contrast, 60px+ buttons.  
- Minimal external calls.  
- Readable in rain/wet conditions.

---

## 10. Success Criteria
- No-auth setup to scoring in <20s.  
- Viewer auto-refresh ≤10s latency.  
- PNG export readable in WhatsApp.  
- Concurrent games supported.  
- ≥95% task completion in outdoor tests.

---

## 11. Future Ideas
- Team history (season tracking).  
- Notifications on new scores.  
- PDF export.  
- Club login & admin dashboard.
