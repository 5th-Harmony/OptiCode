import urllib.request
import json

url = "http://127.0.0.1:8000/api/v1/optimize"
user_code = """#include <iostream>
#include <vector>

bool hasDuplicate(const std::vector<int>& arr) {
    for (int i = 0; i < arr.size(); i++) {
        for (int j = i + 1; j < arr.size(); j++) {  // O(n²) brute force
            if (arr[i] == arr[j]) return true;
        }
    }
    return false;
}

int main() {
    std::vector<int> arr = {2, 7, 11, 15, 2, 6, 1};
    std::cout << (hasDuplicate(arr) ? "true" : "false") << std::endl;
    return 0;
}"""

payload = {
    "language": "cpp",
    "code": user_code
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        print("=================================================")
        print("API Response Success:", res_data.get("success"))
        print("Original Complexity:", res_data.get("ast_analysis", {}).get("estimated_time_complexity"))
        print("New Complexity:", res_data.get("optimization", {}).get("new_complexity"))
        print("Technique:", res_data.get("optimization", {}).get("optimization_technique"))
        print("-------------------------------------------------")
        print("Optimized Code:\n", res_data.get("optimization", {}).get("optimized_code"))
        print("=================================================")
except Exception as e:
    print("Error querying API:", e)
