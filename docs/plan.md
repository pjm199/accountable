# Plan: building the Accountable MVP

This plan builds what `docs/spec.md` describes, for the intent in `docs/intent.md`. Requirement numbers (R1 to R43) and concern numbers point to the spec. Success criteria (SC1 to SC8) point to the intent.

## Files that change

Nothing in the app exists yet, so almost every file is new. `README.md`, `course/` and `community_contributions/` don't change.

**Root**

| File | What it is |
|---|---|
| `package.json` | npm workspace (`frontend`), scripts `dev`, `test`, `seed`, and dev tools such as `concurrently` and `@playwright/test` |
| `package-lock.json` | npm lock file |
| `pyproject.toml`, `uv.lock`, `.python-version` | Python 3.12 project: FastAPI, uvicorn, SQLAlchemy, Pydantic; pytest and httpx for tests |
| `scripts/test.mjs` | runs the three suites one after another and fails if any fails |
| `.gitignore` | add `data/` (it already ignores `*.db`) |

**Backend, `backend/`**

| File | What it is |
|---|---|
| `__init__.py`, `main.py` | FastAPI app, `/api` router, error replies, database created and seeded on first start (R2) |
| `config.py` | database path from `ACCOUNTABLE_DB`, default `data/accountable.db` |
| `db.py` | engine, foreign keys switched on, the five tables in SQLAlchemy Core |
| `rules.py` | stages, usual probabilities, open or closed, late, expected revenue (R6 to R10) |
| `schemas.py` | Pydantic models for every request and reply |
| `repo/organizations.py`, `repo/contacts.py`, `repo/deals.py`, `repo/activities.py` | queries and writes, including deletes (R19), stage changes (R8) and moves (R29) |
| `repo/dashboard.py` | dashboard figures, monthly series, funnel, follow-ups, recent activity (R32 to R40) |
| `routes/*.py` | one router per resource, plus `dashboard.py` and `delete_impact.py` |
| `seed.py` | sample data relative to a given day (R41 to R43); `python -m backend.seed` resets the database (R3) |
| `tests/` | pytest suites (see Proof) and `conftest.py` with a temporary database per test |

**Frontend, `frontend/`**

| File | What it is |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` | Vite and React setup, `/api` forwarded to `127.0.0.1:8000`, Vitest set up with jsdom |
| `src/main.tsx`, `src/App.tsx`, `src/routes.tsx` | entry, query client, router, "Page not found" |
| `src/styles/tokens.css`, `src/styles/global.css` | colour tokens, fonts from `@fontsource`, base styles (Design: Look) |
| `src/lib/api.ts` | fetch wrapper that turns `{"detail"}` replies into messages |
| `src/lib/format.ts` | money (`US$12,500`, `US$12.5K`), percentages, dates |
| `src/lib/rules.ts` | stages, colours, usual probabilities, late and overdue checks, column totals |
| `src/lib/move.ts` | applies a card move to the cached board, for the instant update (R29) |
| `src/hooks/*.ts` | TanStack Query hooks per resource |
| `src/components/TopBar.tsx` | wordmark and pill navigation |
| `src/components/DataTable.tsx` | shared table with search, sorting, row actions, empty state (R11 to R15) |
| `src/components/Dialog.tsx`, `ConfirmDelete.tsx` | dialogs, delete confirmation with counts (R19) |
| `src/components/forms/*.tsx` | organization, contact, deal and activity forms with Zod schemas (R18, R25) |
| `src/components/Timeline.tsx`, `StageBadge.tsx`, `LateBadge.tsx`, `Money.tsx` | shared pieces |
| `src/pages/Dashboard.tsx` and `src/pages/dashboard/*.tsx` | summary panel, follow-ups, line, bar, donut, funnel, recent activity |
| `src/pages/Pipeline.tsx` and `src/pages/pipeline/*.tsx` | summary, stacked bar, columns, cards, dnd-kit setup |
| `src/pages/Organizations.tsx`, `Contacts.tsx`, `Deals.tsx` | the three tables |
| `src/pages/OrganizationPage.tsx`, `ContactPage.tsx`, `DealPage.tsx` | the record pages |
| `src/**/*.test.ts(x)` | Vitest tests beside the code |

**End to end, `e2e/`**

| File | What it is |
|---|---|
| `playwright.config.ts` | installed Chrome (`channel: "chrome"`), starts both servers on their own ports with a fresh test database |
| `fixtures.ts` | fails any test that logs a console error or requests anything outside `localhost` (R5), resets the test database before each spec file |
| `*.spec.ts` | the specs listed in Proof |

**Docs:** `docs/STATUS.md` after every phase, and from phase 1 it says how to run the app.

## Order of work

Eight phases. Each one ends with `npm test` passing, `docs/STATUS.md` updated and a commit "Build: phase N". Each phase is small enough for one fresh session.

### Phase 1: skeleton

1. Root `package.json` with the workspace and the three scripts; `pyproject.toml` with Python 3.12; `frontend/` from the Vite React TypeScript template.
2. `npm run dev` runs uvicorn on `127.0.0.1:8000` and Vite on `5173` together through `concurrently`, with no shell-only syntax, so it works on Windows. Vite opens the browser on the dashboard, except when the tests start it (R1, concern 12).
3. FastAPI with `GET /api/health`. Vite forwards `/api`.
4. Fonts and colour tokens; the top bar and empty pages for every route, so the navigation works.
5. Test runners wired up: one pytest test, one Vitest test and one Playwright smoke spec. `scripts/test.mjs` runs all three.
6. `STATUS.md` says, in plain words for someone non-technical, what to install once (Node, uv, then `npm install`) and that `npm run dev` starts the app (concern 12).

### Phase 2: database, rules and sample data

1. The five tables, foreign keys on, cascades and set-null as in the spec.
2. `rules.py`: stages, probabilities, open, late, expected revenue.
3. Writes in `repo/`: add, edit and delete for every record; a "Created in" stage change for every new deal (R37); stage changes with probability, timeline entry and close date (R8); new deals and form stage changes go to the top of the column (R30); moves that renumber positions (R29).
4. `seed.py` takes "today" as an argument and builds the sample data with each deal's stage history (R41 to R43, concerns 1 to 3). The database is created and seeded on first start (R2); `npm run seed` resets it (R3).

### Phase 3: API

1. Every route in the spec's API table, with Pydantic checks, 404 and 422 replies in plain words.
2. `GET /dashboard` with every figure, the 12-month series, the funnel from stage history, follow-ups and recent activity.
3. `GET /delete-impact/{kind}/{id}`.

### Phase 4: tables and forms

1. API client, query hooks, formatting helpers.
2. `DataTable` with search, sorting, row actions and empty state.
3. Dialog, the four forms with Zod, searchable pickers, delete confirmation with counts. In the deal form, picking a stage fills in its probability, and today's date for Won or Lost (concern 6).
4. Organizations, Contacts (with the status filter, R16) and Deals (with Late badge and tint, R17) pages.
5. The top bar's "Add deal" button (concern 13).

### Phase 5: record pages and activities

1. Organization, contact and deal pages (R21 to R23).
2. Timeline with activities and stage changes, newest first; a contact's timeline includes its deals' activities (R24, concern 4).
3. Log, edit and delete activities; follow-up date (R25).

### Phase 6: pipeline

1. Board summary and stacked bar (R27), six columns with totals (R26), cards (R28).
2. dnd-kit drag between and within columns, keyboard moves (R31). The cache updates first and rolls back with a message if the server refuses (R29).
3. "Add deal" in each column (R30).

### Phase 7: dashboard

1. Greeting and date line, the Sea Green summary panel with the figures and the first five follow-ups, "Done", and "Show all" (R32, R33, R38).
2. Line, bar and donut charts in Recharts, the funnel and recent activity (R34 to R37, R39), in Mockup 2's grid (spec, Layout).

### Phase 8: finish and check

1. Fill gaps in the end-to-end specs until every success criterion has one.
2. Compare each screen with Mockup 2 and the brand using Playwright screenshots, and fix what differs.
3. Walk through the app by hand as a salesperson would (SC8), with the console open, and fix what turns up.
4. `STATUS.md` lists what was checked and anything left over.

## Risks

| Risk | What we do about it |
|---|---|
| **Drag and drop is the hardest part.** Moving within and between columns, keeping the drop position and updating totals instantly are easy to get subtly wrong. | One server call, `POST /deals/{id}/move {stage, index}`, does stage and place together in one transaction. `move.ts` applies the same move to the cache and has its own unit tests. End-to-end tests drag with the mouse and check positions after a refresh. |
| **Dates that move with the calendar** (concern 3) make tests unpredictable. | `seed.py` and the dashboard take "today" as an argument. Unit tests pass a fixed day. End-to-end tests read figures from the API rather than hard-coding them. |
| **The charts could disagree with the data**, as the mockups did. | Every figure comes from one backend module, tested against a small hand-built data set where the answers are worked out by hand. |
| **Windows.** Shell syntax in npm scripts breaks there. | Scripts call `concurrently`, `uv run` and Node scripts only; paths are built with `pathlib` and `path`. |
| **Tests touching real data.** | `ACCOUNTABLE_DB` points the tests at their own file; end-to-end tests use their own ports (`8100`, `5273`), so they also run while `npm run dev` is up. |
| **End-to-end tests share one database**, so tests running side by side would trip over each other. | Run them with one worker. Speeding them up with a database per worker is a later, optional step. |
| **Long Won and Lost columns.** Every closed deal stays on the board for good, so those columns grow. | Accepted for the MVP; columns scroll on their own. Worth a note in `STATUS.md` as an idea for later. |
| **The app quietly reaching the internet** (a font or script from a CDN) would break offline use (R5). | The end-to-end fixture fails any test whose page requests anything outside `localhost`. |
| **SQLite ignores foreign keys by default**, so deletes would leave broken links. | Switch them on for every connection, and test every delete rule. |
| **Money rounding.** | Store cents as integers; only format at the edge. |
| **Recharts and dnd-kit in jsdom** need browser features jsdom lacks. | Unit tests cover the logic in `lib/`; the components are tested end to end in Chrome. |
| **Size of the build and usage limits.** The intent is larger than the course's Day 3 MVP. | One phase per fresh session, a commit after each, so a limit never loses work. |
| **First install needs the internet** (npm packages, uv packages). | Expected. After install the app runs offline (R5); STATUS.md says so. |

## Proof

`npm test` runs everything below and fails if any test fails. Phase 8 adds the walk-through by hand, which tests can't replace (SC8).

### Backend unit tests, pytest (`backend/tests/`)

| File | Checks |
|---|---|
| `test_rules.py` | usual probabilities; open and closed stages; late only when open and the close date is before today, never with no date; expected revenue (R7, R9, R10) |
| `test_stage_change.py` | probability resets on a move; a new deal gets a "Created in" entry; a "Moved from X to Y" entry is recorded; Won or Lost sets the close date to today on a move; moving back keeps it; a form save keeps the probability and date it sends (R8, concern 6) |
| `test_move.py` | move within a column, between columns, to the top and bottom; positions stay unique and in order; moving to the same place changes nothing; new deals and form stage changes land at the top (R29, R30) |
| `test_delete.py` | organization delete keeps contacts and deals with no organization; contact delete keeps deals with no main contact and removes its activities; deal delete removes its activities and stage changes; delete-impact counts match (R19) |
| `test_dashboard.py` | on a hand-built data set: the greeting's counts; summary figures with 12-month won revenue; months by close date, with zeros; funnel with a deal created at Proposal, one lost from Negotiation and one only ever Lost; follow-ups overdue first then the rest, including one months ahead, done ones left out; the 10 newest entries (R32 to R40) |
| `test_timeline.py` | newest first; a contact's timeline includes activities on deals where it is the main contact, and they follow a change of main contact (R24, concern 4) |
| `test_seed.py` | counts and coverage: every industry, status and stage, late deals, overdue and upcoming follow-ups, a win in most months, a stage history for every deal; dates relative to the given day; the reset empties old data (R3, R41 to R43) |
| `test_persistence.py` | data written through one app instance is there in a new instance on the same file (R4, SC2) |
| `test_api_*.py` | every route: list, get, add, edit, delete; required fields give 422; unknown ids give 404; the contact status filter (R16) |

### Frontend unit tests, Vitest (`frontend/src/`)

| File | Checks |
|---|---|
| `lib/format.test.ts` | `US$12,500`, `US$12.5K`, `US$1.2M`, zero and cents; percentages; dates |
| `lib/rules.test.ts` | late and overdue checks; column totals and expected revenue; open totals leave out Won and Lost (R26, R27) |
| `lib/move.test.ts` | moves within and between columns give the same order as the server; totals change with them (R29) |
| `components/forms/schemas.test.ts` | required fields, value zero or more, probability 0 to 100, follow-up optional (R6, R18) |
| `components/forms/DealForm.test.tsx` | picking a stage fills in its probability, and today's date for Won or Lost; both can be overwritten (concern 6) |
| `components/DataTable.test.tsx` | search ignores case across columns; heading clicks sort and reverse; empty cells show "—"; empty state shows (R11, R12, R15) |
| `components/ConfirmDelete.test.tsx` | the message names the record and the counts (R19) |

### End-to-end tests, Playwright Test in Chrome (`e2e/`)

Every spec fails on a browser console error.

| File | Checks | Criterion |
|---|---|---|
| `smoke.spec.ts` | the app opens on the dashboard with sample data; every nav link opens its screen with data | SC1 |
| `organizations.spec.ts` | add, search, sort, edit, delete with confirmation; contacts and deals keep "—" after the delete; the change survives a refresh | SC2 |
| `contacts.spec.ts` | the same for contacts, adding a lead, a qualified contact and a customer; the status filter | SC2, SC3 |
| `deals.spec.ts` | the same for deals; late deals show the badge; changing the stage in the form changes the probability | SC2, SC4 |
| `record-pages.spec.ts` | each page shows its linked records and links work both ways | SC3 |
| `activities.spec.ts` | log a note, call and email on a contact and a deal; newest first; a deal's activity shows on its contact; edit, tick "Done", delete with confirmation; a stage change appears by itself | SC5 |
| `pipeline.spec.ts` | drag to another column changes stage and probability, also in the deals table; drag within a column, to a middle spot, survives a refresh; totals change straight away; Won and Lost leave the open totals; add a deal in a column and from the top bar; late cards stand out | SC4 |
| `dashboard.spec.ts` | figures match the API; marking a deal won raises the won figures; a new follow-up appears, even one months ahead under "Show all", and "Done" removes it; charts, donut and funnel are drawn | SC5, SC6, SC7 |
| `reset.spec.ts` | after changes, running the seed brings the sample data back | SC2 |

### Checks by eye

- Screenshots of every screen against Mockup 2 and the brand (phase 8, SC7).
- A full walk-through in Chrome as a salesperson, every section and action, console open, with the results written in `docs/STATUS.md` (SC8).
