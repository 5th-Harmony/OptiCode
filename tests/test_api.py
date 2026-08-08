import os
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.config import _get_env_float, _get_env_int, _get_env_bool
from app.services.ast_parser import ast_parser_service
from app.api.schemas import SupportedLanguage

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome to the Big-O Optimization Checker API" in data["message"]
    assert data["health_url"] == "/api/v1/health"

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_validation_empty_code():
    response = client.post(
        "/api/v1/optimize",
        json={"language": "python", "code": "   "}
    )
    assert response.status_code == 422

def test_python_optimization_pipeline():
    python_code = '''
def find_pair(arr, target):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                return (i, j)
    return None

arr = [2, 7, 11, 15, 3, 6, 1, 8, 9, 4, 5, 12, 14, 10, 13]
print(find_pair(arr, 9))
'''
    response = client.post(
        "/api/v1/optimize",
        json={"language": "python", "code": python_code}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["ast_analysis"]["max_loop_depth"] >= 2
    assert "O(n^2)" in data["ast_analysis"]["estimated_time_complexity"]
    assert "O(n)" in data["optimization"]["new_complexity"]
    assert data["verification"]["is_verified"] is True
    assert data["verification"]["speedup_ratio"] > 0

def test_infinite_loop_sandbox_safety():
    infinite_loop_code = '''
while True:
    pass
'''
    response = client.post(
        "/api/v1/optimize",
        json={"language": "python", "code": infinite_loop_code}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["baseline_execution"]["status"] == "TIMEOUT"
    assert data["verification"]["is_verified"] is False
    assert "Verification skipped" in data["verification"]["details"]

def test_java_optimization_pipeline():
    java_code = '''
public class Solution {
    public static void main(String[] args) {
        int[] arr = {2, 7, 11, 15};
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] + arr[j] == 9) {
                    System.out.println("(" + i + ", " + j + ")");
                }
            }
        }
    }
}
'''
    response = client.post(
        "/api/v1/optimize",
        json={"language": "java", "code": java_code}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True or data.get("baseline_execution", {}).get("status") in ("COMPILATION_ERROR", "DOCKER_NOT_AVAILABLE", "ERROR")
    assert data["ast_analysis"]["max_loop_depth"] == 2
    assert "O(n^2)" in data["ast_analysis"]["estimated_time_complexity"]

def test_ast_list_comprehension_and_recursion():
    comp_code = "pairs = [(i, j) for i in range(10) for j in range(10)]"
    ast_comp = ast_parser_service.analyze(SupportedLanguage.PYTHON, comp_code)
    assert ast_comp.max_loop_depth == 2
    assert ast_comp.estimated_time_complexity == "O(n^2)"

    helper_code = '''
def helper(x):
    return x + 1

def main():
    return helper(5)
'''
    ast_helper = ast_parser_service.analyze(SupportedLanguage.PYTHON, helper_code)
    assert not any("Recursive" in pattern for pattern in ast_helper.detected_patterns)

    recursive_code = '''
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
'''
    ast_rec = ast_parser_service.analyze(SupportedLanguage.PYTHON, recursive_code)
    assert any("Recursive" in pattern for pattern in ast_rec.detected_patterns)

def test_config_resilience_defaults():
    os.environ["TEST_INVALID_FLOAT"] = "invalid"
    os.environ["TEST_INVALID_INT"] = "invalid"
    os.environ["TEST_INVALID_BOOL"] = "invalid"
    
    assert _get_env_float("TEST_INVALID_FLOAT", 5.0) == 5.0
    assert _get_env_int("TEST_INVALID_INT", 20000) == 20000
    assert _get_env_bool("TEST_INVALID_BOOL", True) is False

def test_duplicate_detection_python():
    dup_code = '''
def has_duplicates(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                return True
    return False

arr = [1, 2, 3, 4, 5, 2]
print(has_duplicates(arr))
'''
    response = client.post(
        "/api/v1/optimize",
        json={"language": "python", "code": dup_code}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Hash Set" in data["optimization"]["optimization_technique"]
    assert data["verification"]["is_verified"] is True

def test_standalone_analyze_endpoint():
    code = "for i in range(10):\n    for j in range(10):\n        print(i, j)"
    response = client.post(
        "/api/v1/analyze",
        json={"language": "python", "code": code}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["max_loop_depth"] == 2
    assert "O(n^2)" in data["estimated_time_complexity"]

def test_standalone_verify_endpoint():
    orig_code = "print('Hello World')"
    opt_code = "print('Hello World')"
    response = client.post(
        "/api/v1/verify",
        json={
            "language": "python",
            "original_code": orig_code,
            "optimized_code": opt_code
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is True
    assert data["stdout_matched"] is True

def test_benchmark_endpoint():
    orig_code = "sum([i for i in range(1000)])"
    opt_code = "sum(range(1000))"
    response = client.post(
        "/api/v1/benchmark",
        json={
            "language": "python",
            "original_code": orig_code,
            "optimized_code": opt_code,
            "iterations": 3
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["iterations"] == 3
    assert data["is_verified"] is True
    assert data["original_avg_ms"] >= 0
    assert data["optimized_avg_ms"] >= 0

def test_batch_optimize_endpoint():
    payload = {
        "items": [
            {
                "language": "python",
                "code": "print('hello')"
            },
            {
                "language": "python",
                "code": "def find_duplicates(arr):\n    for i in range(len(arr)):\n        for j in range(i+1, len(arr)):\n            if arr[i] == arr[j]:\n                return True\n    return False\nprint(find_duplicates([1, 2, 3, 2]))"
            }
        ]
    }
    response = client.post("/api/v1/batch-optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_processed"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["success"] is True
    assert data["results"][1]["success"] is True

def test_supported_languages_endpoint():
    response = client.get("/api/v1/supported-languages")
    assert response.status_code == 200
    data = response.json()
    assert len(data["languages"]) >= 3
    lang_names = [l["language"] for l in data["languages"]]
    assert "python" in lang_names
    assert "java" in lang_names
    assert "cpp" in lang_names

def test_patterns_catalog_endpoint():
    response = client.get("/api/v1/patterns")
    assert response.status_code == 200
    data = response.json()
    assert len(data["patterns"]) >= 4
    pattern_ids = [p["id"] for p in data["patterns"]]
    assert "two_sum_hashmap" in pattern_ids
    assert "duplicate_hashset" in pattern_ids


