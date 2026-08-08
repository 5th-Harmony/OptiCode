# OptiCode Agent Constitution & Rules

> This document governs agent behavior, coding standards, security requirements,
> and execution constraints for the **OptiCode** project.
> Every AI coding agent working in this repository MUST follow these rules.

---

## 1. Project Overview (Read This First)

**OptiCode** is an AI-powered multi-language Code Optimization IDE.

- **Frontend:** React 18 + Vite + Vanilla CSS (NO TailwindCSS, NO Redux)
- **Backend:** FastAPI + Uvicorn + Pydantic v2 (Python 3.11+)
- **Database:** SQLite via Python `sqlite3` stdlib (NOT PostgreSQL, NOT Prisma)
- **Agent Engine:** `src/utils/optiCodeAgent.js` — 6-step optimization pipeline
- **Supported Languages:** JavaScript, Python, C++, Java, Rust

---

## 2. Architecture Rules

1. **Never** introduce new state management libraries (Redux, Zustand, MobX). All state lives in `App.jsx` using React `useState`.
2. **Never** add TailwindCSS classes. All styling is in `src/app-custom.css` using CSS custom properties (design tokens).
3. **Never** switch the database from SQLite to PostgreSQL without explicit user approval. The production database is `app/opticode.db`.
4. **Never** use Prisma ORM. The project uses raw parameterized `sqlite3` queries in `app/db.py`.
5. **Always** add new API routes to `app/api/routes.py` and add corresponding Pydantic models to `app/api/schemas.py`.
6. **Always** update `app/db.py` `init_db()` if adding new database tables or columns. Never use raw `ALTER TABLE` without schema migration logic.
7. **Per-file optimization isolation**: `fileOptimizations[fileId]` — never store optimization results by filename, always by file ID.

## 3. Coding Conventions

### Python (Backend)
- Type-annotate all function signatures: `def foo(code: str, lang: SupportedLanguage) -> OptimizationResult:`
- Use Pydantic v2 models for all request/response shapes in `schemas.py`
- Never catch bare `Exception` and silently swallow it — always log with `logger.error()`
- Use `cursor.execute(sql, (param1, param2))` — never f-string SQL
- Add docstrings to all service-layer functions

### JavaScript / JSX (Frontend)
- Use `const`/`let` — never `var`
- Use strict equality `===` — never `==`
- Use `.jsx` extension for all React components
- Components receive props, never read from global singletons
- Side effects only in `useEffect`; no direct DOM mutations outside `useEffect`
- All new utilities go in `src/utils/` — no business logic inside components

### CSS
- Use CSS custom properties from the design system (defined in `src/app-custom.css`)
- Never add inline styles except for dynamic values (e.g. `fontSize: 'var(--editor-font-size)'`)
- Class names follow BEM-style convention: `component-name`, `component-name__element`, `component-name--modifier`

## 4. Directory Structure Rules

- New frontend components → `src/components/`
- New frontend utility functions → `src/utils/`
- New backend service modules → `app/services/`
- New backend API routes → `app/api/routes.py`
- New Pydantic schemas → `app/api/schemas.py`
- Database helpers → `app/db.py`
- New tests → `tests/` (Python) or root-level `.js` test files (Node)
- Documentation → `docs/` or root-level `.md` files
- Never create files inside `dist/`, `node_modules/`, `.venv/`, or `__pycache__/`

## 5. Dependency Management

- **Frontend:** Add dependencies to `package.json` only. Use `npm install <pkg>`. Do not edit `package-lock.json` manually.
- **Backend:** Add dependencies to `requirements.txt`. Prefer pinning major versions: `fastapi>=0.100.0`.
- **Never** add unnecessary heavyweight dependencies. Prefer stdlib where possible.
- Before adding any new package, confirm it does not conflict with existing dependencies.

## 6. Security Rules

1. **Never** commit real secrets, passwords, API keys, or tokens to git.
2. **Never** put credentials in source code. Use `app/config.py` which reads from environment variables.
3. **Never** use f-string SQL queries — always parameterized `cursor.execute(sql, params)`.
4. **Never** call `eval()`, `exec()`, or `Function()` in frontend code.
5. **Always** enforce input length validation: max 20,000 characters for code submissions.
6. **Always** run the sandbox with `network_mode="none"` and memory limits ≤ 128MB.
7. Rate limiting middleware must remain active on all auth endpoints.

## 7. Environment Variables & Secrets

- All secrets live in `.env` (gitignored).
- `.env.example` must exist and stay up-to-date with placeholder values only.
- If you add a new required environment variable:
  1. Add it to `app/config.py` with a safe default
  2. Add the variable to `.env.example` with a placeholder value and a comment explaining it
  3. Document it in `ARCHITECTURE.md` under the Deployment section

## 8. Database Change Rules

- **Never** run `DROP TABLE`, `TRUNCATE`, or `DELETE FROM` without a `WHERE` clause without explicit user approval.
- **Always** use parameterized queries: `cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))`
- Schema changes go in `app/db.py` `init_db()` using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- Test all schema changes with `test_db_integration.py`.

## 9. API Conventions

- All API routes are prefixed with `/api/v1` (configured via `settings.API_PREFIX`).
- Use proper HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `429 Too Many Requests`, `500 Internal Server Error`.
- Return consistent JSON shapes: `{"success": true, "data": {...}}` for success, `{"success": false, "error_message": "..."}` for errors.
- Rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) must be included on auth endpoints.
- Never expose stack traces or internal Python exceptions to API responses.

## 10. Optimization Agent Rules

- The OptiCode Agent (`src/utils/optiCodeAgent.js`) must always:
  1. Try the FastAPI backend first
  2. Validate that `optimizedCode !== sourceCode` before accepting backend result
  3. Fall back to client-side transformation if backend is unreachable or returns unchanged code
  4. Return `{ alreadyOptimal: true }` when no issues are detected
- **Never** show placeholder or template code in the optimization pane — only code derived from the user's actual source
- Per-file isolation: always key optimization results by `fileId`, never by filename

## 11. UI/UX Rules

- The "Max Optimization Achieved" toast must only appear when `alreadyOptimal === true`
- Switching files in the explorer must instantly reset the optimization pane to the selected file's result (or blank)
- Settings changes (font size, tab size) must apply in real-time without page reload
- Never block the UI thread — all optimization calls are `async`
- Legal modals (Terms of Use, Privacy Policy) must render at `z-index: 20000` (above login modal)

## 12. Testing Requirements

- **All Python tests must pass** before committing: `python -m pytest` (currently 16 tests)
- **Agent logic tests must pass:** `node test_agent_logic.js` (currently 6 tests)
- **Multi-language tests must pass:** `python test_multi_language_programs.py` (currently 17 tests)
- **Frontend build must succeed:** `npm run build` with zero errors
- Never comment out a failing test to make the suite pass
- New API routes must have corresponding tests in `tests/test_api.py`

## 13. Build & Lint Requirements

- `npm run build` must complete with zero errors before any commit
- `npm run lint` runs the Vite build — treat any Vite/React errors as lint failures
- `python -m pytest` must pass with zero failures
- No `console.error` or unhandled Promise rejections in production

## 14. Git & Commit Rules

- Commit messages must be descriptive: `feat: add @lru_cache injection for Python recursive functions`
- Never commit: `node_modules/`, `.venv/`, `dist/`, `__pycache__/`, `*.db`, `.env`
- Never commit temporary test files, scratch scripts, or local debug artifacts
- Each commit should be focused on a single concern
- Never force-push to `main` without explicit user approval

## 15. Documentation Rules

- `ARCHITECTURE.md` must accurately describe the **current** implementation — update it when the stack changes
- `README.md` must have working setup instructions — test them before updating
- `AGENTS_AND_SKILLS.md` must reflect real agent and skill files that exist in `.agents/`
- Never write documentation that describes imaginary future features as if they are implemented

## 16. Before Marking a Task Complete

1. ✅ `npm run build` — zero errors
2. ✅ `python -m pytest` — all tests pass
3. ✅ `node test_agent_logic.js` — all tests pass
4. ✅ No secrets committed
5. ✅ No unrelated files modified
6. ✅ Documentation updated if architecture changed
7. ✅ `.env.example` updated if new env vars added
