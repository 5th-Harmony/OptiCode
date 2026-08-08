# OptiCode Beta — AI-Powered Big-O Code Optimizer & IDE

OptiCode is a full-stack, industry-standard code analysis and optimization platform. It features an interactive web IDE, a 5-stage AST parsing and refactoring pipeline, multi-language support (Python, C++, Java, JavaScript), IP-based rate limiting, database caching (SHA-256 hash lookup), and semantic execution verification.

---

## ✨ Features

- **5-Stage Optimization Pipeline**:
  1. **Ingestion & Security Validation**: Sanitizes inputs and checks payload limits.
  2. **Baseline Execution Sandbox**: Measures baseline runtime in isolated process/Docker sandboxes.
  3. **AST Parsing & Complexity Detection**: Parses AST structures to identify nested loops and algorithmic bottlenecks ($O(n^2)$, $O(n^3)$, $O(2^n)$).
  4. **Pattern-Based Refactoring Engine**: Transforms brute-force algorithms into optimal data structures ($O(n \log n)$, $O(n)$, $O(\sqrt{n})$).
  5. **Semantic Verification & Timing**: Verifies output equality and measures speedup factor.
- **SHA-256 Code Hash Cache**: Instant response for previously analyzed code patterns ($O(1)$ lookup).
- **IP-Based Sliding Window Rate Limiting**:
  - `POST /api/v1/auth/login`: 5 attempts / 15 min per IP with automatic 15-min lockout.
  - `POST /api/v1/optimize`: 30 requests / min per IP.
- **Modern IDE Frontend**:
  - Interactive code editor with sample problem presets.
  - Real-time Big-O analysis badge, time/space complexity cards, and speedup metrics.
  - Industry-standard Auth Modal with password strength meter, lockout countdown timer, and prominent Terms & Privacy consent controls.
- **Multi-Language Support**: Full AST parsing and execution for Python, C++, Java, and client fallback for JavaScript.

---

## 🛠️ Architecture Overview

```
OptiCode/
├── app/                        # FastAPI Backend Service
│   ├── api/                    # API Endpoints (routes.py, schemas.py)
│   ├── services/               # Core Logic
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
│   ├── components/             # React Components (AuthModal, Editor, Header, etc.)
│   ├── utils/                  # Frontend Utilities (optimizerEngine.js)
│   ├── App.jsx                 # Main Application Layout
│   └── app-custom.css          # Design System & Component Styles
├── Dockerfile                  # Production API Docker Container
├── Dockerfile.sandbox          # Isolated Sandbox Execution Image
├── docker-compose.yml          # Multi-container Deployment Setup
├── package.json                # Frontend Dependencies & Scripts
├── requirements.txt            # Python Backend Dependencies
├── test_pipeline.py            # End-to-End Pipeline Audit Script
└── vite.config.js              # Vite Build & Development Server Config
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ & `npm`
- **Python**: v3.10+
- **C++ Compiler (g++)** & **Java JDK (17+)** (Optional, for full C++/Java baseline execution)

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 3. Run Development Servers

**Backend (FastAPI on Port 8000)**:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

**Frontend (Vite on Port 3000)**:
```bash
npm run dev
```
- Open App: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing & Verification

Run the end-to-end QA audit script to test all 5 pipeline stages:

```bash
python test_pipeline.py
```

To run the comprehensive multi-language test suite:
```bash
python scratch/test_all_languages.py
```

---

## 🐳 Docker Deployment

To build and run the entire stack using Docker Compose:

```bash
docker-compose up --build -d
```

---

## 🛡️ Security & Rate Limiting Specifications

- **Rate Limit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
- **Lockout Policy**: Exceeding 5 failed login attempts within 15 minutes triggers a 900-second IP lockout.
- **CORS Configuration**: Restricted to trusted frontend origins (`localhost:3000`, `127.0.0.1:3000`).

---

## 📜 License & Compliance

Distributed under the MIT License. Terms of Use and Privacy Policy guidelines embedded within client onboarding interfaces.
