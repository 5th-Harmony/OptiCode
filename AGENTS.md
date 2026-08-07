# OptiCode Agent Constitution & Rules

This document governs agent behavior, coding standards, database integrity rules, and execution constraints across the OptiCode workspace.

---

## 1. Core Principles & Guidelines

1. **Database Safety & Data Loss Prevention**:
   - Never run destructive raw SQL queries (`DROP TABLE`, `TRUNCATE`, `DELETE FROM` without `WHERE`) without explicit user consent.
   - Always use parameterized queries or Prisma ORM methods to prevent SQL injection vulnerabilities.

2. **Code Quality & Maintainability**:
   - Maintain strict type safety in TypeScript and Python Pydantic models.
   - Do not comment out broken tests or introduce silent fallback exceptions that swallow underlying runtime bugs.

3. **Performance & Caching First**:
   - Check `OptimizationCache` (SHA-256 code hash lookup) before executing heavy Docker/AST sandbox pipelines.

4. **Security & Sandbox Isolation**:
   - Ensure execution containers run with `network_mode="none"` and memory limits capped at 128MB.
   - Enforce max input code length validation (20,000 chars).

5. **CI/CD Verification**:
   - Ensure every pull request passes automated tests (`npm run test:db` and Python test suite).
