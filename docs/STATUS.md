# Status

## How to run Accountable

**Once, the first time** (this needs an internet connection):

1. Install **Node.js** (version 24 or later) from https://nodejs.org.
2. Install **uv**, the Python tool, from https://docs.astral.sh/uv/getting-started/installation/.
3. Open a terminal in this folder and type `npm install`, then press Enter.

**Every time after that:** open a terminal in this folder and type `npm run dev`. Your browser opens on the dashboard at http://localhost:5173. To stop the app, go back to the terminal and press Ctrl+C. No internet connection is needed once the first install is done.

Other commands:

- `npm test` runs all the tests (backend, frontend and end to end in Google Chrome). They use a database of their own, so they never touch your data.
- `npm run seed` wipes your data and loads the sample data again.

## Done

- **Intent agreed**: `docs/intent.md` covers scope, users, constraints and success criteria, including delete rules, stage probabilities, required fields and the six-column pipeline board.
- **Design direction chosen**: three mockups of the dashboard and pipeline are in `docs/mockups/`, each with screenshots. **Mockup 2 (top navigation)** is the chosen direction: `docs/mockups/mockup-2-topnav.html`, with `mockup-2-topnav-dashboard.png` and `mockup-2-topnav-pipeline.png`. Mockups 1 and 3 are kept for reference only.
- **Tech stack updated**: `docs/TECH_STACK.md` now points to the brand skill and Mockup 2 as the design reference, and requires the fonts to be bundled so the app works offline.
- **Spec finalized**: `docs/spec.md` has the requirements (R1 to R43), the design, the API, the libraries and the test plan. The concerns at the top are settled, each with an accepted decision; a second review added concerns 12 to 15 and fixed the dashboard layout and follow-ups rule.
- **Plan written**: `docs/plan.md` has the files that change, eight build phases, the risks and the proof (unit, end-to-end and by-eye checks). Reviewed once against the spec and the intent; not committed yet.

## Design notes from Mockup 2

- Top navigation bar with pill links; the active section is filled Midnight.
- Dashboard: a greeting headline in Instrument Serif, a Sea Green summary panel (expected revenue, key figures and follow-ups), a line chart of revenue won, a bar chart of deals won, a donut of open pipeline by stage, a sales funnel and a recent activity feed.
- Pipeline: summary figures and a stacked bar of open value by stage above the board. Cards show the deal, organization, contact initials, a probability bar, value and close date. Late cards have a Raspberry tint and a "Late" date.
- Stage colours: New Sea Green, Qualified Marigold, Proposal Coral, Negotiation Cerulean, Won Midnight, Lost Raspberry.

## Build progress

- **Phase 1, skeleton: done.** Root npm workspace with `dev`, `test` and `seed`; Python 3.12 project with FastAPI; React and Vite frontend with the brand fonts bundled through `@fontsource` and colour tokens in `frontend/src/styles/tokens.css`; top bar with pill navigation and an empty page for every route, plus "Page not found". `GET /api/health` answers through Vite's `/api` forwarding. `npm test` runs pytest, Vitest and Playwright (in Chrome, on ports 8100 and 5273 with its own database) one after another.
- **Phase 2, database, rules and sample data: done.** Five tables in SQLAlchemy Core with foreign keys on for every connection, set-null and cascade deletes as in the spec (`backend/db.py`). Stage rules, late and expected revenue in `backend/rules.py`. Writes in `backend/repo/`: every add, edit and delete; a "Created in" entry for every new deal; stage changes by form or by move with probability, timeline entry and close date; new deals and form stage changes go to the top of the column; moves renumber both columns. `backend/seed.py` builds 12 organizations, 30 contacts, 40 deals with full stage history and 60 activities, all dated relative to the day it runs. A new database is created and seeded on first start; `npm run seed` resets it.
- **Phase 3, API: done.** Every route in the spec's API table under `/api`, one router per resource in `backend/routes/`, one database transaction per request. Errors reply `{"detail": "..."}` in plain words ("Name is required.", "That contact doesn't exist."), 404 for a missing record and 422 for a bad field or link. `GET /api/dashboard` returns every figure, the 12-month series, open value by stage, the funnel from stage history, follow-ups and the 10 newest entries, all from `backend/repo/dashboard.py`. `GET /api/delete-impact/{kind}/{id}` gives the delete dialog's counts.
- **Phase 4, tables and forms: done.** API client that shows the server's plain-words errors, TanStack Query hooks that refresh every screen after a save, formatting helpers (`US$12,500`, `US$12.5K`, dates). A shared `DataTable` on TanStack Table 9 with search across text columns, sorting with empty cells last, row actions and empty states. Dialogs on Radix; organization, contact, deal and activity forms on React Hook Form and Zod, with searchable organization and contact pickers (Radix Popover and cmdk). Picking a stage in the deal form fills in its probability, and today's date for Won or Lost. Delete asks first and gives the counts. Organizations, Contacts (with the status filter) and Deals (with Late badge and tinted row) pages; "Add deal" in the top bar opens the same deal form.
- **Phase 5, record pages and activities: done.** Organization, contact and deal pages with a header panel (key facts, Edit and Delete), linked records on the left and the timeline on the right. The timeline shows activities and stage changes newest first; a contact's timeline includes activities on deals where it is the main contact, marked with the deal's name. Activities can be logged, edited (with a "Done" box), and deleted after a confirmation; stage changes can't be edited. Deleting from a record page goes back to its list without asking the server for the deleted record again.
- **Phase 6, pipeline: done.** Summary strip (open deals, open value, expected revenue, stacked bar of open value by stage) and six columns with count, total and expected revenue, cards with initials, probability bar, value and close date; late cards tinted with a "Late" date. Drag and drop with dnd-kit between and within columns; the board updates in the same frame as the drop and goes back with a message if the server refuses. Keyboard moves: Space to pick up, arrows to move (Left and Right between columns, Up and Down within one), Space to drop, Enter opens the deal. "Add deal" in every column opens the form at that stage. The sample data lists the Won and Lost columns newest first.
- **Phase 7, dashboard: done.** Greeting for the time of day with the deals that need attention this week, and the date line with follow-ups overdue or due today. The Sea Green summary panel has expected revenue, open pipeline, won in the last 12 months, open deals, running late and the first five follow-ups, each with a "Done" button and a link to its contact or deal; "Show all" opens the full list. Recharts line (area) chart of revenue won and bar chart of deals won by month, a donut of open value by stage, the funnel over all deals, and the 10 newest entries in two columns, laid out in Mockup 2's grid.
- **Phase 8, finish and check: done, apart from the walk-through by a person (below).** Added an end-to-end test for a refused card move (the card goes back and a message says so). Every success criterion now has an end-to-end spec. `npm test` passes: 84 backend tests, 43 frontend tests and 35 end-to-end tests in Chrome. The frontend production build works.

## What was checked

- **Tests** (`npm test`): pytest, Vitest and Playwright, as listed in the Proof section of `docs/plan.md`. Every end-to-end test fails on a browser console error or a request that leaves the computer, so they also check R5 (works offline).
- **Screens against Mockup 2**, from screenshots at 1440 px: dashboard, pipeline, the three tables, the three record pages, the deal form and the delete dialog. The dashboard and pipeline follow the mockup's layout, colours and type. Fixed along the way: the summary panel showed white instead of Sea Green (stylesheet order), and the Won and Lost columns listed the oldest deals first.
- **Restart**: changes made through one backend instance are there in a new one on the same file (`backend/tests/test_persistence.py`).

## Left over

- **Walk-through by a person (success criterion 8).** The intent asks for someone to use the app end to end in a real browser, as a salesperson would, with the console open, before it's called done. I scripted visits to every screen and action, but that doesn't replace a person using it. To do: `npm run dev`, then try every section and action, and note anything that feels wrong here.
- **Selects are native, not Radix.** The spec lists Radix for selects; the stage, status and type fields use the browser's own select, which is accessible and simpler. The organization and contact pickers are searchable lists (Radix Popover with cmdk).
- **Ideas for later:** the Won and Lost columns grow forever (they scroll on their own for now); the frontend bundle is about 1.1 MB and could be split by page; the test client prints a deprecation notice about `httpx`, which is silenced in `pyproject.toml`.

## Next

- The walk-through by a person, then commit.
