---
name: opticode-cache-optimizer
description: Custom skill for performing fast SHA-256 code hashing, checking OptimizationCache database tables, and bypassing heavy AST/Docker sandbox pipeline executions on duplicate code snippets.
---

# OptiCode Cache Optimizer Skill

## Overview
This skill provides automated SHA-256 hashing and instant database cache lookup logic for OptiCode. When a user submits code for optimization, this skill checks the `OptimizationCache` table before executing heavy sandbox analysis.

## Key Functions

### 1. Hash Generation
Generates a canonical SHA-256 hash using the normalized code content and target programming language:
```python
def generate_code_hash(code: str, language: str) -> str:
    normalized = f"{language.strip().lower()}:{code.strip().replace('\r\n', '\n')}"
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()
```

### 2. Cache Lookup ($O(1)$)
Queries `OptimizationCache` by `code_hash`. If a match is found, returns the cached optimization response immediately ($< 2\text{ms}$ latency).

### 3. Cache Upsert & Audit Logging
Stores newly generated optimizations into `OptimizationCache` and appends audit logs to `OptimizationLogs`.
