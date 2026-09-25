# SELL-AI — Day 2 Evidence Intelligence Foundation

SELL-AI is an evidence-first product intelligence workspace. It turns user inputs and connected source evidence into auditable unit economics, trend, buyer-intent, risk, and opportunity signals.

## Day 1 features

- Product input workspace
- Profit Reality Engine
- Trend acceleration state
- Buyer-intent model
- Risk flags
- Evidence ledger with timestamps and status
- `POST /api/analyze`

## Day 2 features

- Reusable evidence model with source metadata, freshness, confidence, and verification status
- Configurable freshness engine: fresh, aging, stale, expired
- Duplicate, conflict, anomaly, missing-claim, and cross-source verification utilities
- Pluggable source registry and adapter interfaces for search, social, marketplace, ads, reviews, and pricing
- Raw data → normalization → evidence → verification ingestion pipeline
- Product DNA model with evidence references
- Transparent Opportunity Radar signals
- Research Request and provider-cost optimizer foundation
- Real Data Status dashboard and responsive Evidence Ledger table
- Analyst interface that accepts verified evidence without inventing source data
- Local browser history for the latest eight analyses

## Architecture

```text
REAL DATA
  ↓
RAW SOURCE (lib/sources)
  ↓
NORMALIZATION (lib/normalization)
  ↓
EVIDENCE (lib/evidence)
  ↓
VERIFICATION (lib/evidence/verification)
  ↓
INTELLIGENCE (lib/intelligence)
  ↓
GEMINI ANALYST (prepared interface; not connected)
  ↓
OPPORTUNITY RADAR
```

The source registry only exposes adapters that are explicitly connected. Providers are not called without credentials, and paid research is never triggered automatically.

## Evidence philosophy

Every claim carries a source, source type, URL, source ID, collection time, region, original and normalized values, freshness, verification status, confidence, and metadata. Conflicts remain visible instead of being silently resolved. Missing external evidence is labeled as unavailable.

## Demo mode

The current UI uses transparent user inputs and clearly labeled `DEMO / SIMULATED` signals so the workspace can be tested without external APIs. Demo values are not presented as real market statistics, reviews, prices, or trends.

## API foundation

- `POST /api/analyze` — calculate the transparent Day 1/Day 2 workspace result
- `GET /api/evidence` — return the current demo evidence ledger and status
- `POST /api/evidence/verify` — verify an evidence array for duplicates, stale records, conflicts, anomalies, and missing claims
- `POST /api/research` — create a queued research request without calling a provider
- `GET /api/product/demo` — return the demo Product DNA and Opportunity Radar

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

No environment variables are required for the demo foundation. Future provider integrations should add credentials through deployment secrets and implement a `SourceAdapter` under `lib/sources`.

## Checks

```bash
pnpm exec next build
```

## Future provider integrations

Day 3 can connect public search, marketplace, social, pricing, and review adapters; persist evidence and Product DNA in a database; add authentication; and connect Gemini only as an analyst over verified `EvidenceItem[]`.
