───────────────────────────────────────────────

# AI Dashboard Platform

> Upload a CSV. Get an interactive dashboard with charts, KPIs, and 
> AI-generated insights — automatically.

![Dashboard Preview](docs/preview.png)

## Features

- **Auth** — Register, login, and protected routes via NextAuth.js
- **Prompt-to-dashboard** — Describe a dashboard in plain English; 
  AI generates the spec (falls back to rule-based if no OpenAI key)
- **CSV upload** — Upload any CSV; columns are auto-classified and 
  charts are recommended automatically
- **Smart column classifier** — Detects id, categorical, continuous, 
  datetime, text, and boolean roles from name patterns + value analysis
- **Chart recommender** — Produces scored, deduplicated chart specs: 
  area (trends), bar (comparisons), donut (distributions), histogram (spread)
- **AI insights engine** — Generates human-readable trend, top-value, 
  distribution, and outlier insights using real statistics (no LLM required)
- **Per-widget chart type toggle** — Switch any widget between bar, 
  area, donut, and histogram inline without saving
- **KPI cards** — Compact-formatted metric cards with trend indicators
- **Drag-and-resize layout** — Widgets are repositionable via 
  react-grid-layout
- **Filter panel** — Date range, category, region, and status filters 
  applied across all widgets
- **Entity CRUD table** — Inline create/edit for any entity from the spec
- **Dark mode** — Full dark theme via Tailwind CSS

## Tech Stack

| Layer        | Technology              | Purpose                        |
|--------------|-------------------------|--------------------------------|
| Framework    | Next.js 16 (App Router) | Full-stack React                |
| Language     | TypeScript (strict)     | End-to-end type safety         |
| Database     | SQLite + Prisma         | Local data persistence         |
| Auth         | NextAuth.js             | Session and route protection   |
| Charts       | Recharts                | Bar, area, donut, histogram    |
| Validation   | Zod                     | DashboardSpec schema           |
| Styling      | Tailwind CSS            | Design system + dark mode      |
| Testing      | Vitest                  | 24 unit tests across 5 suites  |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
git clone <repo-url>
cd <project-folder>
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and set the following:

| Variable           | Required    | Description                                      |
|--------------------|-------------|--------------------------------------------------|
| `DATABASE_URL`     | ✅ Yes      | SQLite path, e.g. `file:./dev.db`               |
| `NEXTAUTH_SECRET`  | ✅ Yes      | Random string for session signing               |
| `NEXTAUTH_URL`     | ✅ Yes      | Base URL, e.g. `http://localhost:3000`          |
| `OPENAI_API_KEY`   | ⚠️ Optional | Enables LLM-backed spec generation from prompts |

If `OPENAI_API_KEY` is omitted, the prompt-based create flow uses a 
rule-based fallback. CSV upload analysis never requires the API key.

### Run

```bash
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

CSV text is passed to `parseCsvText()` which splits rows and handles 
quoted commas. The rows feed into `classifyAllColumns()` which assigns 
each column a semantic role (id, categorical, continuous, datetime, text, 
boolean) using header name patterns and value distribution analysis. 
`recommendCharts()` then pairs datetime+continuous columns into area 
charts, categorical+continuous into bar charts, low-cardinality 
categoricals into donuts, and continuous columns into histograms — 
scoring and deduplicating to a maximum of 6 charts. `generateInsights()` 
computes mean, median, frequency distributions, outlier thresholds, and 
month-over-month deltas, producing up to 6 human-readable insight cards 
while skipping all id and text columns. The assembled `DashboardSpec` is 
validated through Zod, stored in Prisma, and rendered by `WidgetRenderer` 
which routes each widget to the correct Recharts component based on 
`widget.type` and the user's per-widget toggle selection.

## Project Structure

```
app/
  api/                      18 API routes (auth, projects, upload, metrics, 
                             insights, layout, entities, spec, dashboard)
  dashboard/[projectId]/    Per-project dashboard view
  create/                   Prompt-based dashboard creation
  upload/                   CSV upload flow

components/
  dashboard/
    widgets/                BarChartWidget, AreaChartWidget, DonutChartWidget,
                            HistogramWidget, ChartTypeToggle, EmptyChartState
    DashboardWorkspace.tsx  Top-level dashboard shell + chart switch helper
    WidgetRenderer.tsx      Routes widget.type to the correct component
    InsightsPanel.tsx       Fetches and renders insight cards
  widgets/                  KpiWidget, ChartWidget, TableWidget (generic)

lib/
  ai/
    columnClassifier.ts     Column role detection (6 roles)
    chartRecommender.ts     Scored chart spec generation
    insightsEngine.ts       Statistical insight computation
    dataUnderstanding.ts    CSV → DashboardSpec pipeline
    specGenerator.ts        Prompt → DashboardSpec (LLM or rule-based)
    llmClient.ts            OpenAI wrapper with rule-based fallback
  utils/
    formatters.ts           formatNumber, formatCompact, formatCurrency,
                            formatPercent, formatDate, formatDuration
  validators/
    specValidator.ts        Zod schema + cross-entity validation

prisma/
  schema.prisma             User, Project, DashboardData models

types/
  spec.ts                   DashboardSpec, WidgetDef, MetricDef, FieldDef
  dashboard.ts              DashboardWidgetModel, DashboardFilters
  insights.ts               Insight, InsightType

tests/                      24 tests across:
                            columnClassifier, insightsEngine, specValidator,
                            metricEngine, entityValidator
```

## Known Limitations

- `dashboardAdvisor.ts` and `dashboardModifier.ts` are rule-based; 
  they do not call an LLM
- Without `OPENAI_API_KEY`, the prompt-based create flow generates 
  a heuristic spec rather than an AI-tailored one
- CSV upload accepts `.csv` files only — Excel/XLSX is not supported 
  despite being mentioned in the upload UI label
- User settings (theme, preferences) are stored in `localStorage` 
  and are not persisted to the database
- No multi-tenant data isolation beyond per-user `userId` filtering 
  on all Prisma queries

## Running Tests

```bash
npm test
```

Expected output: 5 test files, 24 tests, all passing.

## License

MIT

───────────────────────────────────────────────
