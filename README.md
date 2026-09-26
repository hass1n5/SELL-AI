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

## SerpApi search intelligence

- Modular SerpApi client, adapter, normalizer, cache, and usage tracker under `lib/sources/serpapi`
- Google Search and configured Google Shopping research with region/location support
- Raw result metadata is normalized through the existing Evidence and Verification engines
- Search presence, positions, recurring products/brands/categories, Shopping presence, and observed price ranges are indicators only; they are never labeled as sales or demand proof
- Repeated query/region/engine requests reuse short-lived cached evidence and display its age
- Missing credentials keep demo mode working and show `SERPAPI: NOT CONNECTED`

## Day 3 Gemini analyst

- Provider abstraction under `lib/ai/gemini`
- Structured report and analyst chat routes
- Gemini receives Product DNA, intelligence, verification results, research gaps, and evidence IDs
- Every model claim is normalized against supplied evidence IDs; unsupported claims become `UNKNOWN` or `INSUFFICIENT EVIDENCE`
- Gemini status, usage foundation, model, last analysis time, evidence analyzed, and excluded evidence are shown without exposing secrets
- The application keeps working when the key is absent and shows `Gemini Not Connected`

## Google Ads SEO intelligence

- Isolated OAuth Google Ads provider under `lib/sources/google-ads` with refresh-token exchange, bounded retries, timeout handling, and safe error states
- Keyword Planner ideas are normalized into SEO keyword records and evidence records before verification; missing volume, competition, CPC, or historical metrics remain unavailable
- Search intent is a transparent informational, commercial, transactional, navigational, or unknown classification based on the keyword text
- Opportunity states show evidence quality, buyer/commercial intent, competition, rising historical values when returned, and insufficient evidence without a black-box score
- Optional SerpApi evidence is combined through the existing Evidence Engine; conflicts remain visible and SERP presence is never treated as sales or demand proof
- Product/service, region, and language are retained on every SEO research result

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
- `POST /api/research` — create a queued request or execute the configured Apify job with `execute: true`
- `GET /api/research` and `GET /api/research/:id` — inspect in-memory research job status
- `GET /api/providers/apify/health` — verify server-side Apify authentication and provider health
- `POST /api/research/run` — run a SerpApi Google or Google Shopping research request
- `GET /api/providers/serpapi/health` — verify SerpApi authentication and usage health
- `POST /api/google-ads/keyword-ideas` — request validated Google Ads Keyword Planner ideas
- `GET /api/google-ads/status` — report Google Ads connection, latency, usage, and safe error status
- `POST /api/seo/research` — combine Google Ads keyword evidence with optional SerpApi evidence and produce a transparent SEO report
- `GET /api/seo/keywords` — return the latest in-memory SEO research result
- `POST /api/ai/analyze` — generate an evidence-bound Gemini analysis
- `POST /api/ai/report` — generate the structured AI report
- `POST /api/ai/chat` — ask an evidence-bound analyst question
- `GET /api/ai/status` — report Gemini connectivity and usage status
- `GET /api/product/demo` — return the demo Product DNA and Opportunity Radar

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

The demo works without credentials. Apify research requires deployment secrets listed in `.env.example`:

- `APIFY_API_TOKEN` — project secret, read only on the server
- `APIFY_ACTOR_ID` — the configured Apify Actor or Task-compatible Actor ID
- `APIFY_TIMEOUT_MS`, `APIFY_MAX_RETRIES`, `APIFY_POLL_INTERVAL_MS`, `APIFY_MAX_POLLS` — bounded job controls
- `SERPAPI_KEY` — server-only SerpApi project secret
- `SERPAPI_TIMEOUT_MS`, `SERPAPI_MAX_RETRIES` — bounded search request controls
- `GEMINI_API_KEY` — server-only Gemini project secret
- `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, `GEMINI_MAX_RETRIES` — model and bounded request controls
- Optional `GEMINI_INPUT_COST_PER_MILLION` and `GEMINI_OUTPUT_COST_PER_MILLION` enable cost estimates only when reliable pricing is supplied
- `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN` — server-only OAuth credentials
- `GOOGLE_ADS_CUSTOMER_ID` — accessible customer account, default `1629155768`
- `GOOGLE_CLOUD_PROJECT_ID` — Google Cloud project identifier
- `GOOGLE_ADS_DEVELOPER_TOKEN` — required by Google Ads API access level; never rendered or logged
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_TIMEOUT_MS`, `GOOGLE_ADS_MAX_RETRIES` — optional manager account and bounded request controls

Provider secrets are never returned by an API, rendered in the UI, logged, or committed. Google Ads needs an approved developer token and Keyword Planner permission; an OAuth token alone does not guarantee access. Missing or restricted access keeps the demo functional and reports `NOT CONNECTED`, `AUTH ERROR`, or `UNAVAILABLE` without fabricated metrics. Apify health is available at `/api/providers/apify/health`; Gemini health is available at `/api/ai/status`.

## Checks

```bash
pnpm exec next build
```

## Future provider integrations

The next recommended task is to persist SEO research, EvidenceItem records, usage history, and Product DNA in a database, then add Google Ads manager-account and location constant discovery after access is approved.
