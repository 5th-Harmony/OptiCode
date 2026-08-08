# OptiCode Beta — AI-Powered Big-O Code Optimizer & IDE

OptiCode is a full-stack, industry-standard code analysis and optimization platform. It features an interactive web IDE, a real-time pattern analyzer engine, a 5-stage FastAPI AST parsing and refactoring pipeline, multi-language support (Python, C++, Java, JavaScript, Rust), IP-based rate limiting, database caching (SHA-256 hash lookup), and semantic execution verification.

---

## ✨ Features & Capabilities

- **Real-Time Code Analyzer Engine**:
  - Inspects the actual source code of **any user-created or uploaded file** in real time.
  - Detects loop nesting depth ($O(n^2)$, $O(n^3)$), unguarded recursion ($O(2^n)$), list searches inside loops (`.includes()`, `in list`), string concatenation in loops, and manual swap sorts.
  - Outputs targeted refactoring strategies for your open source code.
- **"Maximum Optimization Reached" Alert**:
  - Automatically detects when code is already optimally written ($O(n)$ or $O(1)$) and displays a sleek glassmorphic notification banner:  
    `OPTIMAL | Maximum Optimization Reached | This code is already written using optimal data structures and minimal complexity.`
- **12-Program Benchmark Suite**:
  - 12 distinct multi-function programs across 5 languages (JavaScript, Python, C++, Java, Rust).
  - Each file features isolated per-file optimization state mapping (`fileOptimizations`).
- **Fixed Glowing Red "OPTIMIZE CODE" Button**:
  - Positioned beside the `SOURCE CODE` label in the editor pane header.
  - Uniform fixed dimensions (`height: 26px`), glowing crimson red styling, **zero emojis**, and excluded from the Dashboard view.
- **Synchronized Scroll & 60px Bottom Clearance**:
  - Pixel-perfect line height alignment (`--line-h: 21px`).
  - `--editor-pad-bottom: 60px` ensures scrolling down fully leaves comfortable clearance above the terminal drawer, keeping the last lines of code 100% visible.
- **Redesigned Settings Modal**:
  - Glassmorphic card design (`backdrop-filter: blur(20px)`), AI model selection dropdown, font size range slider with live badge (`14px`), indentation tab pills (`2` / `4` Spaces), and emerald toggle switches.
- **IP-Based Sliding Window Rate Limiting**:
  - `POST /api/v1/auth/login`: 5 attempts / 15 min per IP with automatic 15-minute lockout timer.
  - `POST /api/v1/optimize`: 30 requests / min per IP.
- **SHA-256 Code Hash Cache**: Instant response for previously analyzed code patterns ($O(1)$ lookup).

---

## 🌐 Localhost & Network Access Setup

The frontend dev server is configured with `host: true` (`0.0.0.0`), granting full local network access to viewers across devices.

| Interface | URL | Description |
|-----------|-----|-------------|
| **Frontend IDE** | [http://localhost:3000](http://localhost:3000) | Vite Web Application |
| **Network IDE** | `http://<your-local-ip>:3000` | Local Network Access for Viewers |
| **FastAPI Backend** | [http://localhost:8000](http://localhost:8000) | REST API Service |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI Documentation |
| **Health Endpoint** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | API Status Check |

---

## 🛠️ Architecture Overview

```
OptiCode/
├── app/                        # FastAPI Backend Service
│   ├── api/                    # API Endpoints (routes.py, schemas.py)
│   ├── services/               # Core Logic Services
│   │   ├── ast_parser.py       # AST Syntax Analyzer
│   │   ├── optimizer.py        # Pattern Refactoring Engine
│   │   ├── sandbox.py          # Isolated Code Execution Sandbox
│   │   └── verifier.py         # Semantic Equality & Timing Verifier
│   ├── utils/                  # Helper Utilities
│   │   ├── logger.py           # Structured Logging
│   │   └── rate_limiter.py     # IP Sliding Window Rate Limiter
│   ├── db.py                   # SQLite Cache & Log Persistence
│   ├── config.py               # Application Settings
│   └── main.py                 # FastAPI Application Entry Point
├── src/                        # React + Vite Frontend App
│   ├── components/             # React Components (CodeEditor, Navbar, SettingsModal, UserDashboard, AuthModal)
│   ├── utils/                  # Frontend Intelligence Engine (optimizerEngine.js)
│   ├── data/                   # Default Benchmark Suite (defaultFiles.js)
│   ├── App.jsx                 # Main Application Layout & State Map
│   └── app-custom.css          # Design System & Component Styles
├── Dockerfile                  # Production API Docker Container
├── Dockerfile.sandbox          # Isolated Sandbox Execution Image
├── docker-compose.yml          # Multi-container Deployment Setup
├── package.json                # Frontend Dependencies & Scripts
├── requirements.txt            # Python Backend Dependencies
├── test_pipeline.py            # End-to-End Pipeline Audit Script
└── vite.config.js              # Vite Build & Network Host Config
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ & `npm`
- **Python**: v3.10+

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 3. Start Development Servers

**Start FastAPI Backend (Port 8000)**:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Vite Frontend (Port 3000, Network Host Enabled)**:
```bash
npm run dev
```

---

## 🧪 Testing & Quality Assurance

Run the production build check:
```bash
npm run build
```

Run the backend test suite:
```bash
python -m pytest
```

---

## 🛡️ Security & Compliance Specifications

- **Rate Limit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
- **Lockout Policy**: Exceeding 5 failed login attempts within 15 minutes triggers a 900-second IP lockout.
- **CORS Configuration**: Restricted to trusted frontend origins (`localhost:3000`, `127.0.0.1:3000`).

---

## 📜 License

Distributed under the MIT License. Terms of Use and Privacy Policy guidelines embedded within client onboarding interfaces.
