import sqlite3
import hashlib
import os
import time
import json
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "opticode.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite Database Tables & Pre-seeds Standard Data"""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        auth_provider TEXT DEFAULT 'local',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Workspaces Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 3. CodeFiles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS code_files (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );
    """)

    # 4. OptimizationLogs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS optimization_logs (
        id TEXT PRIMARY KEY,
        file_id TEXT,
        original_code TEXT NOT NULL,
        optimized_code TEXT NOT NULL,
        language TEXT NOT NULL,
        original_complexity TEXT NOT NULL,
        optimized_complexity TEXT NOT NULL,
        speedup_factor TEXT NOT NULL,
        execution_time_ms REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES code_files(id) ON DELETE SET NULL
    );
    """)

    # 5. OptimizationCache Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS optimization_cache (
        code_hash TEXT PRIMARY KEY,
        optimized_code TEXT NOT NULL,
        original_big_o TEXT NOT NULL,
        optimized_big_o TEXT NOT NULL,
        speedup_factor TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    # Pre-seed initial default user & workspace if empty
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO users (id, email, name, auth_provider)
        VALUES ('usr_101', 'architect@opticode.io', 'Lead Architect', 'github')
        """)

        cursor.execute("""
        INSERT INTO workspaces (id, user_id, name)
        VALUES ('ws_101', 'usr_101', 'OPTICODE-WORKSPACE'),
               ('ws_102', 'usr_101', 'ALGORITHMS-BENCHMARK')
        """)

        cursor.execute("""
        INSERT INTO code_files (id, workspace_id, file_name, language, content)
        VALUES 
        ('f_101', 'ws_101', 'algo.py', 'python', 'def find_duplicates(arr):\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in duplicates:\n                duplicates.append(arr[i])\n    return duplicates'),
        ('f_102', 'ws_101', 'quick_sort.cpp', 'cpp', '#include <vector>\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    for (int i = 0; i < nums.size(); i++) {\n        for (int j = i + 1; j < nums.size(); j++) {\n            if (nums[i] + nums[j] == target) return {i, j};\n        }\n    }\n    return {};\n}'),
        ('f_103', 'ws_102', 'DataGrid.js', 'javascript', 'function processData(items) {\n  const result = [];\n  for (let i = 0; i < items.length; i++) {\n    let exists = false;\n    for (let j = 0; j < result.length; j++) {\n      if (items[i] === result[j]) { exists = true; break; }\n    }\n    if (!exists) result.push(items[i]);\n  }\n  return result;\n}')
        """)
        conn.commit()

    conn.close()

def generate_code_hash(code: str, language: str) -> str:
    normalized = f"{language.strip().lower()}:{code.strip().replace('\r\n', '\n')}"
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def check_cache(code: str, language: str) -> Optional[Dict[str, Any]]:
    code_hash = generate_code_hash(code, language)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM optimization_cache WHERE code_hash = ?", (code_hash,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def store_cache(code: str, language: str, optimized_code: str, original_big_o: str, optimized_big_o: str, speedup_factor: str):
    code_hash = generate_code_hash(code, language)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO optimization_cache (code_hash, optimized_code, original_big_o, optimized_big_o, speedup_factor)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(code_hash) DO UPDATE SET
        optimized_code = excluded.optimized_code,
        original_big_o = excluded.original_big_o,
        optimized_big_o = excluded.optimized_big_o,
        speedup_factor = excluded.speedup_factor;
    """, (code_hash, optimized_code, original_big_o, optimized_big_o, speedup_factor))
    conn.commit()
    conn.close()

def store_log(original_code: str, optimized_code: str, language: str, original_complexity: str, optimized_complexity: str, speedup_factor: str, execution_time_ms: float, file_id: Optional[str] = None):
    log_id = f"log_{int(time.time() * 1000)}"
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO optimization_logs (id, file_id, original_code, optimized_code, language, original_complexity, optimized_complexity, speedup_factor, execution_time_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (log_id, file_id, original_code, optimized_code, language, original_complexity, optimized_complexity, speedup_factor, execution_time_ms))
    conn.commit()
    conn.close()
    return log_id
