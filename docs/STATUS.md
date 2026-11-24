# Status

No application code has been written yet, so there is nothing to run. Once the skeleton exists, this file will say how to start the app.

## Done

- **Intent agreed**: `docs/intent.md` covers scope, users, constraints and success criteria, including delete rules, stage probabilities, required fields and the six-column pipeline board.
- **Design direction chosen**: three mockups of the dashboard and pipeline are in `docs/mockups/`, each with screenshots. **Mockup 2 (top navigation)** is the chosen direction: `docs/mockups/mockup-2-topnav.html`, with `mockup-2-topnav-dashboard.png` and `mockup-2-topnav-pipeline.png`. Mockups 1 and 3 are kept for reference only.
- **Tech stack updated**: `docs/TECH_STACK.md` now points to the brand skill and Mockup 2 as the design reference, and requires the fonts to be bundled so the app works offline.
- **Spec finalized**: `docs/spec.md` has the requirements (R1 to R43), the design, the API, the libraries and the test plan. The 11 concerns at the top are settled, each with an accepted decision.

## Design notes from Mockup 2

- Top navigation bar with pill links; the active section is filled Midnight.
- Dashboard: a greeting headline in Instrument Serif, a Sea Green summary panel (expected revenue, key figures and follow-ups), a line chart of revenue won, a bar chart of deals won, a donut of open pipeline by stage, a sales funnel and a recent activity feed.
- Pipeline: summary figures and a stacked bar of open value by stage above the board. Cards show the deal, organization, contact initials, a probability bar, value and close date. Late cards have a Raspberry tint and a "Late" date.
- Stage colours: New Sea Green, Qualified Marigold, Proposal Coral, Negotiation Cerulean, Won Midnight, Lost Raspberry.

## Next

- Write `docs/plan.md` in phases, in a fresh session (the start of the Build phase).
- Set up the project skeleton from `docs/TECH_STACK.md` and `docs/spec.md`: the root `package.json` with the `dev`, `test` and `seed` scripts, the React and Vite frontend, the FastAPI backend, the SQLite database and the test setup. Waiting for the go-ahead.
