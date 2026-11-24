# Spec: the Accountable MVP

This spec turns `docs/intent.md` into requirements and a design. The stack is in `docs/TECH_STACK.md`, the look follows the `brand` skill, and the chosen mockup is `docs/mockups/mockup-2-topnav.html`. Where this spec and the intent disagree, the intent wins and this spec gets fixed.

## Concerns

These are the points where the intent left room for doubt, each with the decision taken. The decisions were accepted when this spec was finalized, and the build follows them.

1. **The funnel needs stage history.** "How much value reaches each stage" can't be worked out from a deal's current stage alone: a lost deal may have reached Negotiation first. The app keeps a record of every change of stage (it needs one anyway for the timeline), and the funnel is built from it. The sample data has to include that history, with each deal moved through the stages it passed.
2. **The sample data must add up.** In the mockups, the funnel's Won bar (US$29.8K) didn't match "won this year" (US$574K), because the monthly history wasn't backed by real deals. In the app, every chart is worked out from the deals in the database, and the sample data includes enough won and lost deals spread over the past 12 months to fill the charts.
3. **Sample dates move with the calendar.** If the sample data had fixed dates, it would look dead after a few weeks: nothing late, no follow-ups due. The seed writes dates relative to the day it runs, so a reset always gives late deals, overdue follow-ups and recent wins.
4. **An activity belongs to a contact or a deal, never both.** An activity logged on a deal shows in the timeline of the deal's *current* main contact. If the deal's main contact changes, its activities move to the new contact's timeline. This is simpler than copying, and it matches "an activity logged on a deal also shows in the timeline of the deal's main contact".
5. **Winning a deal doesn't change the contact's status.** The intent doesn't ask for it, so a contact stays a lead until someone edits it.
6. **Stage changes from the deal form count too.** Changing the stage in the edit form has the same effects as dragging the card: new probability, timeline entry and close date. In the form, picking a new stage fills in its usual probability (and today's date for Won or Lost) straight away, and you can overwrite either before saving. The server saves what the form sends.
7. **"Today" is the computer's local date.** Late deals, overdue follow-ups and the close date set on Won or Lost all use it.
8. **The brand says Google Fonts, but the app must work offline.** As `docs/TECH_STACK.md` says, the fonts are bundled with the frontend through the `@fontsource` packages.
9. **"Visually stunning" is a judgement.** The bar is Mockup 2's dashboard, built with real chart components, and success criterion 8 (checked by eye in a real browser) is where it's tested.
10. **The data is unprotected.** There's no sign-in, so the backend listens only on `127.0.0.1` and isn't reachable from other computers.
11. **Cerulean and Raspberry are hard to read as small text.** The brand only warns about Sea Green and Marigold, but Cerulean on white has a contrast of 3.96:1 and Raspberry 3.62:1, below the 4.5:1 that small text needs. White text on them is just as weak. The spec adds darker text shades of all four colours, keeps the brand colours for fills, and uses white text on Cerulean or Raspberry only in bold or large type.
12. **"One command" needs a one-time install first.** Node and uv must be installed, and `npm install` must run once, before `npm run dev` works. After that, `npm run dev` is the one command: `uv run` installs the Python packages by itself, and the browser opens on the dashboard. `docs/STATUS.md` gives these steps in plain words for someone non-technical.
13. **Mockup 2 shows a few things the intent doesn't ask for, and leaves out a few it does.** The app doesn't build the top bar's global search or the avatar (there are no users). It keeps the top bar's "Add deal" button. Unlike the mockup, the Won and Lost columns also get "Add deal" and show their expected revenue, because the intent asks for both in every column.
14. **"Won this year" becomes "Won in the last 12 months".** A calendar year would show almost nothing in January, while the charts beside it cover 12 months. The summary uses the same 12 months as the charts.
15. **The funnel covers every deal, of any age.** Its Won bar is the value of all won deals, so it won't equal the 12-month figure, and its label says "All deals" to make that clear.

## Requirements

Numbers such as R4 are used by the plan and the tests. Each one traces back to the intent.

### Running the app

- **R1** `npm run dev` starts the backend and the frontend together on Mac, Linux and Windows. It opens the browser at `http://localhost:5173` on the dashboard (concern 12).
- **R2** The data lives in one SQLite file, `data/accountable.db`, which git ignores. When the file doesn't exist, the backend creates it and fills it with the sample data.
- **R3** `npm run seed` deletes everything and loads the sample data again. It works whether or not the app is running.
- **R4** Every change is saved straight away by the backend, so it's still there after a refresh and after a restart.
- **R5** The app needs no internet connection: no fonts, scripts or images are loaded from outside.

### Records

| Record | Fields (required in bold) | Links |
|---|---|---|
| Organization | **name**, website, industry, notes | has many contacts and deals |
| Contact | **name**, **status** (lead, qualified, customer), email, phone, job title | belongs to one organization or none |
| Deal | **name**, **stage**, **value** (US$), probability, close date, position on the board | one organization or none, one main contact or none |
| Activity | **type** (note, call, email), **description**, **when it happened**, **the contact or the deal**, follow-up date, done | belongs to exactly one contact or one deal |
| Stage change | deal, from stage (empty when the deal is created), to stage, when | belongs to one deal; made by the app, never typed |

- **R6** Values are whole or fractional US dollars of zero or more, stored as integer cents. Probability is a whole number from 0 to 100. A new contact's status defaults to lead.
- **R7** Each stage has a usual probability: New 10%, Qualified 25%, Proposal 50%, Negotiation 75%, Won 100%, Lost 0%. A new deal starts with its stage's probability unless one is typed.
- **R8** When a deal's stage changes, by drag or by the form:
  - its probability becomes the new stage's usual probability (see concern 6);
  - a stage change "Moved from Proposal to Negotiation" is recorded (the entry made when a deal is created reads "Created in Proposal");
  - moving to Won or Lost sets the close date to today; moving back to an open stage keeps the date.
- **R9** A deal is **open** in New, Qualified, Proposal and Negotiation, and **closed** in Won and Lost. An open deal whose close date is before today is **late**. A deal with no close date is never late.
- **R10** **Expected revenue** is the sum of value × probability over open deals.

### Tables

There's a table for organizations, contacts and deals. Each one:

- **R11** has a search box that matches any text column as you type, ignoring case;
- **R12** sorts by any column when you click its heading, and click again to reverse; numbers and dates sort as numbers and dates, and empty cells go last;
- **R13** has an "Add" button that opens a form, and edit and delete on every row;
- **R14** opens the record's page when you click its name;
- **R15** shows "—" for an empty link or field.

Table columns:

- **Organizations:** name, industry, website, number of contacts, number of open deals, open value.
- **Contacts:** name, status, organization, job title, email, phone. Above the table, a status filter: All, Leads, Qualified, Customers (**R16**).
- **Deals:** name, organization, main contact, stage, value, probability, close date. Late deals show a Raspberry "Late" badge beside the date and a light Raspberry row tint (**R17**).

### Forms and deleting

- **R18** Add and edit use the same form in a dialog. Required fields are marked, and the form won't save until they're filled. Organization and contact are picked from searchable lists.
- **R19** Delete asks first, in a dialog that names the record and says what happens to linked records, with the counts:
  - organization: "Its 4 contacts and 3 deals will be kept, with no organization."
  - contact: "Its 2 deals will be kept, with no main contact. Its 5 activities will be deleted."
  - deal: "Its 3 activities and its stage history will be deleted."
- **R20** After a save or delete, every screen shows the change without a refresh.

### Record pages

- **R21 Organization page:** its details, its contacts, and its deals with stage, value and close date.
- **R22 Contact page:** its details, a link to its organization, its deals, and its timeline.
- **R23 Deal page:** its details (with the Late badge if late), links to its organization and main contact, and its timeline.
- **R24** A **timeline** lists activities and stage changes, newest first. A contact's timeline includes the activities on deals where it is the main contact, marked with the deal's name. A deal's timeline includes its stage changes.
- **R25** From a contact or deal page you can log an activity: type, description, when (defaults to now) and an optional follow-up date. "When" is a date and time. The edit form also has a "Done" box for the follow-up. Activities can be edited and deleted from the timeline, and deleting asks first. Stage changes can't be edited or deleted.

### Pipeline

- **R26** Six columns, New to Lost, each with its stage name, number of deals, total value and expected revenue.
- **R27** Above the board: total open value, expected revenue and number of open deals. Won and Lost are left out.
- **R28** Cards show the deal name, organization, main contact's initials, a probability bar in the stage colour with its percentage, value and close date. Late cards have a Raspberry tint and a "Late" date. Clicking a card opens the deal page.
- **R29** Drag a card to another column to change its stage (R8), or within a column to change its place. The card stays where it was dropped, also after a refresh. The totals change as soon as the card moves, before the server replies. If the server refuses, the card goes back and a message says so.
- **R30** Each column has an "Add deal" button that opens the deal form with that stage set. A new deal, from a column, the top bar or the deals table, goes to the top of its stage's column, and so does a deal whose stage is changed in the form.
- **R31** Cards can also be moved with the keyboard, as the drag-and-drop library allows.

### Dashboard

- **R32** A greeting for the time of day ("Good morning.") and how many deals need attention this week: late, or due to close in the next 7 days. Under it, today's date and how many follow-ups are overdue or due today.
- **R33** A Sea Green summary panel: expected revenue in large type, then open value, revenue won in the last 12 months (concern 14), open deals and deals running late, then the follow-ups (R38).
- **R34** A line chart of revenue won per month, for the last 12 months including this one. A won deal counts in the month of its close date. Months with nothing won show zero.
- **R35** A bar chart of deals won per month, same 12 months.
- **R36** A donut of open value by stage.
- **R37** A funnel over all deals (concern 15): for each stage New to Won, the total value of the deals that reached it or a later stage. A deal's furthest stage is the latest in the order New to Won among its current stage and every stage in its history, with Lost not counted. So a deal created at Proposal counts at New, Qualified and Proposal, and a deal lost from Negotiation counts up to Negotiation. A deal that was only ever Lost doesn't count. Every deal's first stage is recorded as a stage change from nothing when it is created.
- **R38** Follow-ups: every activity with a follow-up date that isn't done, however far ahead, overdue first (with a Raspberry "Overdue" badge), then the rest soonest first with their date. The panel shows the first five and a "Show all" link that opens the full list in a dialog. Each one links to its contact or deal and has a "Done" button. Marking it done removes it from the list.
- **R39** Recent activity: the 10 newest activities and stage changes, each linked to its contact or deal.
- **R40** Every figure is worked out from the database each time the dashboard loads, so it reflects a deal marked won or a new follow-up straight away.

### Sample data

- **R41** About 12 organizations across at least six industries; about 30 contacts at every status; about 40 deals at every stage, including:
  - won and lost deals spread over the past 12 months, with at least one win in most months;
  - open deals with close dates over the next three months;
  - three or four late deals;
  - a full stage history for every deal.
- **R42** About 60 activities of every type, including some follow-ups overdue, some due in the next two weeks and some done.
- **R43** All sample dates are relative to the day the seed runs (concern 3). Names are made up and plausible.

## Design

### Look

The look is Mockup 2 (`docs/mockups/mockup-2-topnav.html` and its two screenshots), built with real components. Light mode only, for screens 1280 px wide or more.

**Colours**, as CSS variables in one file:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F0F4F5` | page background |
| `--panel` | `#FFFFFF` | panels, cards, dialogs |
| `--ink` | Midnight `#073B4C` | text, active nav pill, Won |
| `--ink-soft` | Midnight at 65% | secondary text |
| `--mist` | Sea Mist `#CDD8DB` | dividers inside panels, empty bars |
| `--green` | Sea Green `#06D6A0` | primary buttons, summary panel, New |
| `--green-text` | `#05795B` | Sea Green text on light backgrounds |
| `--marigold` | `#FFC145` | Qualified |
| `--marigold-text` | `#8A5F00` | Marigold text on light backgrounds |
| `--coral` | `#F78C6B` | Proposal |
| `--cerulean` | `#118AB2` | information, Negotiation |
| `--cerulean-text` | `#0B6A8A` | links and Cerulean text on light backgrounds |
| `--raspberry` | `#EF476F` | late, overdue, delete, Lost |
| `--raspberry-text` | `#C4234F` | "Late" and "Overdue" text on light backgrounds |

Text on Sea Green, Marigold and Coral is Midnight; on Cerulean and Raspberry it's white, in bold or large type only (concern 11). Each `-text` colour has a contrast of at least 4.5:1 on white and on the page background. Stage colours are always shown with the stage name, never colour alone.

**Fonts:** Instrument Sans for headings and body; Instrument Serif for the dashboard greeting only; JetBrains Mono for money, percentages, dates and counts, with tabular figures so columns line up.

**Shapes:** panels and cards have rounded corners (16 px panels, 12 px cards, 999 px pills) and no outline. They stand off the background by colour and a very soft shadow. No single-edge borders, no line along the top of the page, and gradients only where a chart needs one.

**Money** always shows its currency: `US$12,500` in tables and forms, `US$12.5K` and `US$1.2M` in charts, cards and summary figures.

**Tone:** short plain labels ("Add deal", "Delete contact?", "Overdue"), no exclamation marks.

### Layout

- **Top bar** on every screen: the Accountable wordmark on the left; pill links for Dashboard, Organizations, Contacts, Deals and Pipeline, the current one filled Midnight with Sea Mist text; an "Add deal" button on the right (concern 13).
- **Dashboard:** the greeting in Instrument Serif, with the date line under it (R32). Then a grid: the Sea Green summary panel on the left, two rows tall, holding the figures and the follow-ups; the line chart and the bar chart to its right; the donut and the funnel in the next row; recent activity across the full width at the bottom, in two columns.
- **Pipeline:** the heading "Pipeline" with a one-line hint, then a strip of panels: open deals, open value, expected revenue, and a stacked bar of open value by stage. Then six equal columns that fit 1280 px without sideways scrolling. Each column heading has a stage-coloured dot, the stage name and the count, with the total and expected revenue under it, and "Add deal" at the foot of the column.
- **Tables:** title and "Add" button on one line, then search (and the status filter for contacts), then the table in a white panel. Row actions are icon buttons with labels for screen readers.
- **Record pages:** a header panel with the name, key facts and Edit and Delete buttons; linked records on the left; the timeline on the right with a "Log activity" button.
- **Empty states:** a short line and the matching "Add" button, for example "No deals in this stage yet."

### Frontend

React and TypeScript, built with Vite, in `frontend/`. Libraries:

| Need | Library |
|---|---|
| Routing | React Router |
| Server data and caching | TanStack Query |
| Tables, search and sorting | TanStack Table |
| Charts | Recharts |
| Drag and drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Dialogs, menus, selects | Radix UI primitives |
| Forms | React Hook Form with Zod |
| Dates | date-fns |
| Fonts | `@fontsource/instrument-sans`, `@fontsource/instrument-serif`, `@fontsource/jetbrains-mono` |

Routes: `/` (dashboard), `/pipeline`, `/deals`, `/deals/:id`, `/contacts`, `/contacts/:id`, `/organizations`, `/organizations/:id`. An unknown route shows a "Page not found" panel with a link to the dashboard.

Tables load the full list once and search and sort in the browser. One salesperson's data is a few thousand rows at most, so there's no paging. Saves go through TanStack Query mutations that refresh the affected lists, which gives R20. The pipeline move updates the cache first and rolls back on error, which gives R29.

### Backend

FastAPI in `backend/`, run by uvicorn on `127.0.0.1:8000`. Vite forwards `/api` to it, so the browser sees one address. Data access uses SQLAlchemy Core (no ORM, no raw SQL), and requests and replies are checked with Pydantic. Foreign keys are switched on in SQLite.

**Tables:** `organizations`, `contacts`, `deals`, `activities`, `stage_changes`. Deleting follows R19:

- `contacts.organization_id` and `deals.organization_id` are set to null when the organization goes;
- `deals.contact_id` is set to null when the contact goes;
- activities on a contact or deal, and a deal's stage changes, are deleted with it.

All of this happens in one transaction. `deals.position` orders cards within a stage; a move renumbers the cards in the columns it touches.

**API** (JSON, under `/api`):

| Method and path | Does |
|---|---|
| `GET, POST /organizations` | list (with counts and open value), add |
| `GET, PUT, DELETE /organizations/{id}` | one with its contacts and deals, edit, delete |
| `GET, POST /contacts` | list (optional `?status=`), add |
| `GET, PUT, DELETE /contacts/{id}` | one with its organization, deals and timeline; edit; delete |
| `GET, POST /deals` | list (with `is_late`), add |
| `GET, PUT, DELETE /deals/{id}` | one with its links and timeline; edit; delete |
| `POST /deals/{id}/move` | body `{stage, index}`: change stage and place in one go (R8, R29) |
| `POST /activities`, `PUT, DELETE /activities/{id}` | log, edit, delete an activity |
| `POST /activities/{id}/done` | mark a follow-up done |
| `GET /dashboard` | every dashboard figure, list and chart series in one reply |
| `GET /delete-impact/{kind}/{id}` | the counts the delete dialog shows (R19) |

Errors reply with a status code and `{"detail": "..."}` in plain words, and the frontend shows the message. A missing record is a 404, a bad field a 422.

`npm run seed` runs `uv run python -m backend.seed`, which empties the tables and loads the sample data in one transaction (R3, R41 to R43).

### Repository layout

```
package.json         root scripts: dev, test, seed; frontend/ as a workspace
pyproject.toml, uv.lock
backend/             FastAPI app, database, seed, tests/
frontend/            React app, src/, unit tests beside the code
e2e/                 Playwright Test specs and config
data/                accountable.db (git-ignored)
docs/
```

### Testing

`npm test` runs all three suites and fails if any test fails. The tests use their own database file, set through the `ACCOUNTABLE_DB` environment variable, so they never touch `data/accountable.db`.

- **Backend, pytest:** stage rules (R7 to R9), expected revenue, delete rules (R19), move and position (R29), funnel and monthly figures (R34 to R37), follow-up grouping (R38), the seed (R41 to R43), and every API route's happy path and main errors.
- **Frontend, Vitest:** money and date formatting, late and overdue logic, form validation, and the table's search and sort.
- **End to end, Playwright Test with Google Chrome:** it starts both servers on a fresh seeded test database, then covers each success criterion in `docs/intent.md`: add, search, sort, edit and delete on each table with refresh checks; the contact status filter; record pages and timelines; dragging between and within columns with a refresh check; adding a deal in a column; logging a follow-up and seeing it on the dashboard; marking a deal won and seeing the dashboard change. Each test fails if the browser console shows an error.

Passing tests isn't the finish line: success criterion 8 needs someone to use the app end to end in a real browser and check each screen by eye against Mockup 2 and the brand.
