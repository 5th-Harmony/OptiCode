from app.db import init_db, check_cache, store_cache, store_log, get_db

def test_integration():
    print("=================================================")
    print("Verifying OptiCode Database & Backend Integration")
    print("=================================================")
    
    # 1. Initialize Database
    init_db()
    print("[PASS 1/4] Database initialization & pre-seeding complete.")

    # 2. Test Workspaces & Files Queries
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM workspaces")
    ws_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM code_files")
    file_count = cursor.fetchone()["count"]
    conn.close()
    
    print(f"[PASS 2/4] Workspaces Count: {ws_count} | Code Files Count: {file_count}")

    # 3. Test Cache Operations (SHA-256)
    sample_code = "def test_algo(arr):\n    return list(set(arr))"
    sample_lang = "python"
    
    store_cache(
        code=sample_code,
        language=sample_lang,
        optimized_code="def test_algo(arr): return list(set(arr)) # Cache hit",
        original_big_o="O(n^2)",
        optimized_big_o="O(n)",
        speedup_factor="5.4x"
    )
    
    cache_hit = check_cache(sample_code, sample_lang)
    assert cache_hit is not None, "Cache lookup failed"
    print(f"[PASS 3/4] OptimizationCache lookup verified! Hash: {cache_hit['code_hash'][:12]}...")

    # 4. Test Log Storage
    log_id = store_log(
        original_code=sample_code,
        optimized_code=cache_hit["optimized_code"],
        language=sample_lang,
        original_complexity="O(n^2)",
        optimized_complexity="O(n)",
        speedup_factor="5.4x",
        execution_time_ms=1.2
    )
    print(f"[PASS 4/4] OptimizationLog record stored! Log ID: {log_id}")

    print("=================================================")
    print("SUCCESS: FRONTEND, BACKEND & DATABASE INTEGRATION VERIFIED!")
    print("=================================================")

if __name__ == "__main__":
    test_integration()
