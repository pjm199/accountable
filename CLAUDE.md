# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read @AGENTS.md first. It points to the project docs and says to update `docs/STATUS.md` when you finish a piece of work.

## What this repo is

Accountable is the course project for Ed Donner's "AI SDLC" course: a sales CRM that grows into a Business OS with ERP. The student builds it with a coding agent over two weeks. If the student asks for help with the course, read `course/for_agents/` (start with `AGENT_COURSE_GUIDE.md`, then the week guide and `AGENT_GIT_GUIDE.md` for git and PR steps).

As of now there is no application code. `docs/STATUS.md` says "The project has not yet started". `main` holds only docs, course material and community contributions. Ed's finished builds for each day are on branches such as `week1day3-end` (see the table in `README.md`).

## Source of truth

- `docs/intent.md`: what to build (the MVP CRM: organizations, contacts, deals, activities, a pipeline board, a dashboard, sample data, and success criteria).
- `docs/TECH_STACK.md`: the stack and the commands. Follow it exactly.
- The `brand` skill (`.claude/skills/brand/`): fonts, colors, surfaces and tone for any UI work. It takes priority over general design guidance.
- `docs/STATUS.md`: current state and how to run the app. Keep it up to date.
- `course/instructions/<day>.md`: the prompts for each build day. `course/cheap_llm_instructions/` holds simpler versions for cheap or free models.

Leave `README.md` as it is. It is the course's own guide, not the app's.

## Planned architecture (from TECH_STACK.md)

- `frontend/`: React + TypeScript + Vite on Node 24+, an npm workspace of the root `package.json`. It gets all its data from the backend's JSON API.
- `backend/`: Python 3.12 FastAPI app managed with uv. `pyproject.toml` and `uv.lock` sit at the repo root, not in `backend/`.
- Persistence: a local SQLite file accessed through SQLAlchemy Core, with no raw SQL. The backend seeds sample data when the database is new.
- `e2e/`: Playwright Test using the installed Google Chrome. The tests start the app themselves.
- Tests use their own database, so they never touch the dev data.
- Prefer mature libraries (data tables, charts, drag-and-drop) over hand-rolled code.
- Later: Supabase for auth and the database, and deployment to Render.

## Commands (planned, from the root package.json once it exists)

- `npm run dev`: start the backend and frontend together
- `npm test`: run all the tests (Vitest, pytest, Playwright) and fail if any fails
- `npm run seed`: reset the database to the sample data

All commands must work on Mac, Linux and Windows, so put them in npm scripts, not shell-specific scripts. Before you rely on any other commands, check `package.json` and `docs/STATUS.md`. Later days add things such as `npm run check` and its hooks.

## Community contributions

`community_contributions/<name>/` holds one folder per student, added by PR. Keep them small: docs and a README that links to the student's fork. Keep code and screenshots in the fork.
