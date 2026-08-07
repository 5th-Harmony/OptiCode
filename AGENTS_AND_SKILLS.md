# OptiCode Custom Agents and Skills Documentation

This repository incorporates custom AI agents and skills designed for high-performance database architecture, AST code optimization, and SHA-256 cache management.

---

## 🤖 Custom Agents

### 1. Database Architect Agent (`.agents/agents/database-architect-agent.json`)
- **Role**: Lead Database Architect & Full-Stack Developer
- **Description**: Specialized agent designed to architect PostgreSQL schemas, Prisma ORM mappings, SHA-256 cache optimization layers, and database migration scripts.
- **Key Capabilities**:
  - PostgreSQL & SQLite Schema Design
  - Prisma ORM Model Generation & Migration Scripts
  - SHA-256 High-Performance Cache Lookup Architecture
  - Database Audit Logging & Index Optimization
  - RESTful Database API Route Handlers

---

## ⚡ Custom Skills

### 1. OptiCode Cache Optimizer Skill (`.agents/skills/opticode-cache-optimizer/SKILL.md`)
- **Name**: `opticode-cache-optimizer`
- **Description**: Performs SHA-256 code hashing, checks `OptimizationCache` database tables, and bypasses heavy AST/Docker sandbox pipeline executions on duplicate code snippets.
- **Key Features**:
  - Canonical SHA-256 code + language payload hashing.
  - $O(1)$ indexed database cache lookup returning sub-2ms responses.
  - Automatic cache upsert and historical audit logging in `OptimizationLogs`.
