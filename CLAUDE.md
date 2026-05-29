@AGENTS.md

# Agent Fleet Dashboard — Codebase Guide

## Stack at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.5 (App Router) |
| Language | TypeScript 5 (strict) |
| Runtime UI | React 19 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Component library | shadcn/ui (base-nova variant) + @base-ui/react |
| Icons | lucide-react |
| Database | SQLite via better-sqlite3 (synchronous, no ORM) |
| PWA | Service worker + manifest |

> **Next.js 16 has breaking changes.** Before touching any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. APIs, file conventions, and middleware behaviour differ from what was common before 2025.

---

## Directory structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout — renders <AppNav>
│   ├── page.tsx                # Home — detects mobile, routes to Dashboard or MobileLayout
│   ├── globals.css             # Tailwind v4 + all CSS custom properties
│   ├── api/                    # Route Handlers (RESTful JSON)
│   │   ├── dashboard/          # GET — summary stats
│   │   ├── agents/             # GET, POST
│   │   │   └── [id]/           # GET, PUT, DELETE
│   │   ├── projects/           # GET, POST  +  [id]/
│   │   ├── tasks/              # GET, POST  +  [id]/
│   │   ├── runs/               # GET, POST  +  [id]/
│   │   │   └── [id]/output/    # Streaming run output
│   │   ├── activities/         # GET
│   │   ├── templates/          # GET, POST  +  [id]/
│   │   ├── dag/                # GET, POST  +  [id]/
│   │   └── dag-executions/     # GET, POST  +  [id]/
│   │       └── [id]/stream/    # SSE streaming
│   ├── agents/[id]/page.tsx    # Agent detail page
│   ├── projects/[id]/page.tsx  # Project detail page
│   ├── tasks/[id]/page.tsx     # Task detail page
│   ├── runs/[id]/page.tsx      # Run detail / log viewer
│   ├── templates/              # Template list + detail
│   ├── workflows/              # DAG workflow list + canvas
│   └── activity/               # Activity feed page
│
├── components/
│   ├── Dashboard.tsx           # Main desktop dashboard (~16 KB)
│   ├── DagCanvas.tsx           # DAG workflow visualiser (~15 KB)
│   ├── AgentBattle.tsx         # Battle-mode agent comparison (~13 KB)
│   ├── AgentKanban.tsx         # Kanban board view (~9 KB)
│   ├── AgentBoard.tsx          # Agent management board (~7 KB)
│   ├── FleetDispatcher.tsx     # Task dispatch interface (~10 KB)
│   ├── CreateTaskModal.tsx     # Task creation modal (~9 KB)
│   ├── MobileLayout.tsx        # Full mobile layout (~12 KB)
│   ├── MobileAgentCard.tsx     # Mobile agent card
│   ├── MobileProjectCard.tsx   # Mobile project card
│   ├── MobileTaskCard.tsx      # Mobile task card
│   ├── TaskList.tsx            # Task list
│   ├── ProjectCard.tsx         # Project card
│   ├── ActivityFeed.tsx        # Activity timeline
│   ├── RunMonitor.tsx          # Live run monitoring
│   ├── AppNav.tsx              # Top navigation bar
│   ├── DagWorkflowSelector.tsx # Workflow picker
│   └── ui/button.tsx           # shadcn Button primitive
│
├── lib/
│   ├── db.ts                   # DB init, schema, seed data
│   ├── migrate.ts              # Additive schema migrations
│   ├── utils.ts                # cn() and shared helpers
│   └── agent-cwd.ts            # Agent working-directory utilities
│
└── hooks/
    └── useMobileDetect.ts      # SSR-safe mobile detection

public/
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker
└── icons/                      # PWA icons (72 → 512 px)

scripts/                        # One-off data/DB utilities (Node.js)
```

---

## Development workflow

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript rules)
```

There is **no test runner** configured. Validate changes by running the dev server and exercising the relevant UI flows.

---

## Database

The app uses **SQLite via better-sqlite3** — all queries are synchronous. There is no ORM.

### Connection

```ts
import { getDb } from '@/lib/db';
const db = getDb();   // returns a singleton Database instance
```

`getDb()` is safe to call in any API route handler. The singleton is module-level; the database runs in WAL mode.

### DB path resolution (priority order)

1. `DASHBOARD_DB_PATH` environment variable (absolute or relative path)
2. `<cwd>/.data/dashboard.db` (default)

### Schema overview

| Table | Purpose |
|---|---|
| `projects` | Projects grouping tasks and agents |
| `agents` | Agent definitions including CLI config and cost tracking |
| `tasks` | Tasks assigned to projects and agents |
| `activities` | Event log (agent actions) |
| `agent_runs` | Execution records (PID, exit code, stdout/stderr) |
| `agent_outputs` | Streaming log lines per run (FK → agent_runs, CASCADE DELETE) |
| `task_templates` | Reusable task prompt templates |
| `dag_workflows` | DAG graph definitions (stored as JSON) |
| `dag_executions` | Execution state for a DAG workflow run |

### Migrations

Additive column additions live in `patchAgentWorktreeSchema()` inside `src/lib/db.ts` — they use `ALTER TABLE … ADD COLUMN` wrapped in try/catch (idempotent). Larger migrations go in `src/lib/migrate.ts`.

---

## API conventions

All API routes live under `src/app/api/` and follow Next.js App Router Route Handler conventions.

- **Return type:** always `NextResponse.json(data)` or `NextResponse.json(data, { status: NNN })`
- **Error responses:** `NextResponse.json({ error: 'message' }, { status: 4xx/5xx })`
- **SQL style:** use `db.prepare('…').all()` for lists, `.get()` for single rows, `.run()` for mutations
- **JSON fields in DB:** `skills`, `cli_args`, `dag_json`, `canvas_data`, and `worktree_paths` are stored as JSON strings; parse/stringify at the API boundary
- **No auth:** the API is unauthenticated and intended for local/private deployment

---

## Styling conventions

- **Tailwind CSS 4** — imported via `@import "tailwindcss"` in `globals.css`; PostCSS plugin is `@tailwindcss/postcss`
- **No `tailwind.config.js`** — Tailwind 4 reads configuration from CSS directly
- **CSS custom properties** — all theme tokens (colors, radius, spacing) are defined as `--variable-name` in `globals.css` under `:root` and `.dark`
- **Class merging** — always use `cn()` from `@/lib/utils` when combining conditional classes
- **Component variants** — use `class-variance-authority` (CVA) for multi-variant components
- **Animation** — `tw-animate-css` is available for Tailwind animation utilities

---

## Component conventions

- All interactive/stateful components are **Client Components** — add `'use client'` at the top
- Server Components are the default for page files and layouts that only fetch data
- Data fetching in client components uses `fetch()` inside `useEffect` with `useState`; there is no global state manager (no Redux, Zustand, etc.)
- The `useMobileDetect` hook (`src/hooks/useMobileDetect.ts`) handles SSR-safe mobile breakpoint detection
- Import path alias: `@/*` resolves to `src/*`

---

## Key component responsibilities

| Component | What it owns |
|---|---|
| `Dashboard.tsx` | Desktop multi-panel layout; orchestrates all sub-views |
| `MobileLayout.tsx` | Full mobile shell with bottom nav and page switching |
| `DagCanvas.tsx` | Interactive DAG graph (nodes, edges, drag, zoom) |
| `AgentBattle.tsx` | Side-by-side agent task comparison with live run output |
| `AgentKanban.tsx` | Kanban columns keyed by agent status |
| `FleetDispatcher.tsx` | UI for assigning tasks to agents and triggering runs |
| `AppNav.tsx` | Top nav with route links — rendered once in root layout |
| `RunMonitor.tsx` | Polls/streams a single agent run's stdout/stderr |

---

## PWA

The app is installable as a PWA. The service worker (`public/sw.js`) and manifest (`public/manifest.json`) are static. Icons live in `public/icons/` at sizes 72, 96, 128, 144, 152, 192, 384, and 512 px.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DASHBOARD_DB_PATH` | `.data/dashboard.db` | Override SQLite file location |

No `.env` file is required for local development.

---

## Important caveats for AI assistants

1. **Read Next.js 16 docs first.** `node_modules/next/dist/docs/` contains the authoritative guide. Do not assume Next.js 13/14/15 behaviour applies.
2. **No ORM.** Write raw SQL with parameterised prepared statements (`db.prepare('…').run/get/all(...params)`). Never interpolate user input into SQL strings.
3. **Synchronous DB.** `better-sqlite3` is synchronous — do not `await` DB calls.
4. **JSON columns.** `cli_args`, `skills`, `worktree_paths`, `dag_json`, and `canvas_data` must be `JSON.stringify`-d before insertion and `JSON.parse`-d after retrieval.
5. **No global state.** Each component manages its own state; share data via props or re-fetch on navigation.
6. **Tailwind 4 syntax.** Utility classes and config follow v4 conventions, not v3. Check `globals.css` for defined tokens before adding new ones.
