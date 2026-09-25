# SELL-AI — Day 1 MVP

Evidence-first product intelligence foundation.

### Working slice
- Product input workspace
- Product DNA input layer
- Profit Reality Engine
- Trend acceleration state
- Mobile buyer-intent model
- Risk flags
- Evidence ledger with timestamps/status
- "Should I Sell This?" action state
- API: `POST /api/analyze`

### Day 2 progress
- Saves the latest eight completed analyses in browser storage
- Restores prior inputs and evidence-backed results from the workspace
- Surfaces API and analysis errors without losing the current form

### Principles
- Gemini is an analyst, not the source of truth.
- External numbers are never fabricated.
- Source, timestamp, freshness and verification status are first-class fields.
- Missing evidence is surfaced instead of guessed.

### Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.
