# OptiCode — AI-Powered Code Optimization IDE

> High-performance multi-language code analysis, algorithmic bottleneck detection ($O(n^2)$, $O(n^3)$, $O(2^n)$), and automated Big-O complexity refactoring.

[![CI/CD Pipeline](https://github.com/opticode/opticode/actions/workflows/ci.yml/badge.svg)](https://github.com/opticode/opticode/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)](https://fastapi.tiangolo.com/)

---

## 🌐 Overview

**OptiCode** is an interactive dual-pane web IDE that analyzes source code across **JavaScript, Python, C++, Java, and Rust**. When you select a file and click **OPTIMIZE CODE**, the 6-step OptiCode Agent reads your source code, identifies efficiency bottlenecks, and produces a fully rewritten, language-idiomatic optimized version in the right pane.

### ✨ Key Features
- **Dual-Pane Synchronized Editor**: Left pane shows source code; right pane shows refactored code with complexity gain badges.
- **6-Step Optimization Agent**: Read $\to$ Analyze $\to$ Classify $\to$ Plan $\to$ Transform $\to$ Measure pipeline.
- **Max Optimization Detection**: Displays an alert toast when submitted code is already optimal ($O(n)$ or $O(1)$).
- **Per-File State Isolation**: Switching files instantly updates the optimization pane for that specific file.
- **12 Built-In Benchmark Programs**: Covering sorting, graph BFS, prime sieves, and matrix algorithms across 5 languages.
- **Analytics Dashboard**: Real-time bottleneck telemetry, execution history, and JSON audit logging.
- **Fast SQLite Caching**: Sub-2ms SHA-256 cache lookups for previously optimized snippets.

---

## Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Python**: `3.11+`
- **npm**: `10.x+` (or `pnpm` / `yarn`)

### 1. Clone the Repository
```bash
git clone https://github.com/opticode/opticode.git
cd opticode
```

### 2. Frontend Dependencies
```bash
npm install
```

### 3. Backend Dependencies
```bash
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (CMD):
.\.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

---

## Environment Variables

Copy the template configuration file:
```bash
cp .env.example .env
```

Key environment variables in `.env`:

| Variable | Default Value | Description |
|---|---|---|
| `PROJECT_NAME` | `"Big-O Optimization Checker Backend"` | FastAPI application title |
| `VERSION` | `"1.0.0"` | API version |
| `API_PREFIX` | `"/api/v1"` | Base route prefix for all endpoints |
| `SANDBOX_TIMEOUT_SECONDS` | `5.0` | Execution timeout cap for sandbox containers |
| `SANDBOX_MEMORY_LIMIT` | `"128m"` | Memory limit for Docker execution sandbox |
| `MAX_CODE_LENGTH` | `20000` | Maximum character length for code submissions |
| `ALLOW_LOCAL_FALLBACK` | `true` | Fall back to process sandbox if Docker unavailable |

> **Security Note:** Never commit `.env` or real API keys to version control. The `.gitignore` excludes all `.env` files.

---

## Development

Run the frontend and backend servers concurrently:

### Terminal 1: Backend API (FastAPI)
```bash
# From workspace root with .venv active:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Terminal 2: Frontend IDE (Vite)
```bash
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000) (or [http://localhost:5173](http://localhost:5173))

---

## Build

To build the production frontend bundle:

```bash
npm run build
```

Production output will be generated in `dist/`.

---

## Test

OptiCode includes comprehensive test suites across backend APIs, SQLite database integration, multi-language optimization transformations, and agent pattern detection:

```bash
# 1. Run all Python backend & API tests (16 tests)
python -m pytest

# 2. Run agent pattern detection tests (6 tests)
node test_agent_logic.js

# 3. Run multi-language optimization engine tests (17 tests)
python test_multi_language_programs.py

# 4. Run SQLite database schema & CRUD tests
python test_db_integration.py

# 5. Run end-to-end pipeline QA audit
python test_pipeline.py
```

---

## Deployment / Demo

### Docker Deployment
OptiCode includes a production Docker setup for containerized execution:

```bash
# Build and start all services via Docker Compose
docker compose up --build
```

Services:
- **`app`**: FastAPI backend service on port `8000`
- **`sandbox`**: Isolated execution sandbox container (`Dockerfile.sandbox`)

### Demo Walkthrough
1. Navigate to [http://localhost:3000](http://localhost:3000).
2. Select any file in the File Explorer (e.g. `searchengine.js` or `algo.py`).
3. View the source code in the left pane.
4. Click the red **OPTIMIZE CODE** button in the editor header.
5. Watch the OptiCode Agent analyze the code in real-time.
6. The refactored code appears in the right pane with runtime and Big-O complexity improvements.
7. Switch to another file to verify per-file isolation.

---

## 📜 Architecture & Agent Documentation

- **Architecture Details**: [`ARCHITECTURE.md`](file:///c:/Users/KIIT/Desktop/CODING/Projects/project_gdg/ARCHITECTURE.md)
- **Agent Rules & Constitution**: [`AGENTS.md`](file:///c:/Users/KIIT/Desktop/CODING/Projects/project_gdg/AGENTS.md)
- **Custom Agents & Skills**: [`AGENTS_AND_SKILLS.md`](file:///c:/Users/KIIT/Desktop/CODING/Projects/project_gdg/AGENTS_AND_SKILLS.md)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
