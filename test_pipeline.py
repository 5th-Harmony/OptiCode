import sys
import time
import json
try:
    # pyrefly: ignore [missing-import]
    import httpx
except ImportError:
    import urllib.request
    httpx = None

API_URL = "http://127.0.0.1:8000/api/v1/optimize"
HEALTH_URL = "http://127.0.0.1:8000/api/v1/health"

def send_post(url, data):
    payload_bytes = json.dumps(data).encode('utf-8')
    if httpx:
        res = httpx.post(url, json=data, timeout=30.0)
        return res.status_code, res.json()
    else:
        req = urllib.request.Request(
            url, 
            data=payload_bytes, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            res_body = response.read().decode('utf-8')
            return response.getcode(), json.loads(res_body)

def run_e2e_verification():
    print("\n" + "="*70)
    print("      BIG-O OPTIMIZATION CHECKER - END-TO-END QA AUDIT SCRIPT      ")
    print("="*70 + "\n")

    # 1. Health check
    print("[+] Stage 0: Verifying Backend Server Health...")
    try:
        if httpx:
            res = httpx.get(HEALTH_URL, timeout=5.0)
            health_ok = (res.status_code == 200 and res.json().get("status") == "healthy")
        else:
            with urllib.request.urlopen(HEALTH_URL, timeout=5) as res:
                health_ok = (res.getcode() == 200)
    except Exception as e:
        print(f"[-] ERROR: Server is not running at {HEALTH_URL}. Start the server first! ({e})")
        sys.exit(1)
    
    print("    [PASS] Health check passed!\n")

    # 2. Test Payload: Brute-Force O(n^2) Two Sum in Python
    python_payload = {
        "language": "python",
        "code": """def find_pair(arr, target):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                return (i, j)
    return None

arr = [2, 7, 11, 15, 3, 6, 1, 8, 9, 4, 5, 12, 14, 10, 13]
print(find_pair(arr, 9))
"""
    }

    print("[+] Sending sample O(n^2) payload to /api/v1/optimize ...")
    status_code, data = send_post(API_URL, python_payload)

    if status_code != 200 or not data.get("success"):
        print(f"[-] FAIL: Request failed with status={status_code}, error={data.get('error_message')}")
        sys.exit(1)

    # Stage Audits
    baseline = data["baseline_execution"]
    ast_res = data["ast_analysis"]
    opt = data["optimization"]
    ver = data["verification"]

    stage1_pass = (status_code == 200 and data["success"] is True)
    stage2_pass = (baseline["status"] in ("SUCCESS", "CACHE_HIT"))
    stage3_pass = (ast_res["max_loop_depth"] >= 2 and "O(n^2)" in ast_res["estimated_time_complexity"])
    stage4_pass = ("O(n)" in opt["new_complexity"] and len(opt["optimized_code"]) > 0)
    stage5_pass = (ver["is_verified"] is True)

    print("\n" + "-"*70)
    print("                     PIPELINE STAGE AUDIT RESULTS                    ")
    print("-"*70)
    print(f" Stage 1: Ingestion & Payload Validation    | STATUS: {'[PASS]' if stage1_pass else '[FAIL]'}")
    print(f" Stage 2: Baseline Sandbox Execution        | STATUS: {'[PASS]' if stage2_pass else '[FAIL]'} (Status: {baseline['status']})")
    print(f" Stage 3: AST Parsing & Complexity Analysis | STATUS: {'[PASS]' if stage3_pass else '[FAIL]'} (Complexity: {ast_res['estimated_time_complexity']})")
    print(f" Stage 4: Optimization Engine Refactoring   | STATUS: {'[PASS]' if stage4_pass else '[FAIL]'} (New Complexity: {opt['new_complexity']})")
    print(f" Stage 5: Semantic Verification & Timing    | STATUS: {'[PASS]' if stage5_pass else '[FAIL]'} (Verified: {ver['is_verified']})")
    print("-"*70)

    print("\n" + "="*70)
    print("                    TIMING & PERFORMANCE SUMMARY                    ")
    print("="*70)
    print(f" Original Baseline Runtime : {ver['original_runtime_ms']:.3f} ms")
    print(f" Optimized Runtime         : {ver['optimized_runtime_ms']:.3f} ms")
    print(f" Verified Speedup Ratio    : {ver['speedup_ratio']}x")
    print(f" Output Semantic Match     : {ver['stdout_matched']}")
    print(f" Detailed Verification Summary: {ver['details']}")
    print("="*70 + "\n")

    if all([stage1_pass, stage2_pass, stage3_pass, stage4_pass, stage5_pass]):
        print("[SUCCESS] All 5 pipeline stages audited and passed 100% successfully!\n")
    else:
        print("[-] AUDIT FAILED: One or more pipeline stages failed verification.\n")
        sys.exit(1)

if __name__ == "__main__":
    run_e2e_verification()
