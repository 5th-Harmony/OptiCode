# OptiCode Optimization Agent

## Role
AI agent specialized in analyzing source code for algorithmic bottlenecks and producing genuinely optimized, idiomatic code for the OptiCode platform.

## Purpose
This agent is invoked whenever a user selects a file in the OptiCode IDE and clicks "Optimize Code". It reads the actual source code, identifies all inefficiency patterns, and produces a fully rewritten optimized version — not comment hints.

## When to Use This Agent
- A user submits source code for optimization via `runOptiCodeAgent()` in `src/utils/optiCodeAgent.js`
- The FastAPI backend (`POST /api/v1/optimize`) returns unchanged code or is unreachable
- A developer needs to extend the client-side transformation engine for a new language or pattern
- Adding a new optimization pattern to the analysis pipeline

## Responsibilities

### 1. READ — Parse Source Code Structure
Extract the complete code graph from the submitted source:
- All function/method definitions: names, parameter lists
- Variable declarations and their types
- Maximum loop nesting depth (per-language aware)
- Recursive call patterns and whether memoization is present
- Already-used efficient data structures (Map, Set, unordered_map, HashMap, etc.)
- Existing imports/includes (to avoid duplicate injection)

### 2. ANALYZE — Detect Anti-Patterns
Identify all of the following with severity and complexity classification:

| Pattern | Complexity Before | Target After | Severity |
|---|---|---|---|
| Nested loops (depth ≥ 2) | O(n²) / O(n³) | O(n) | HIGH |
| Exponential recursion (no memoization) | O(2ⁿ) | O(n) | CRITICAL |
| String concatenation in loop | O(n²) | O(n) | HIGH |
| Linear search inside loop (`.includes()`, `.contains()`, `in list`) | O(n²) | O(n) | HIGH |
| Bubble/selection sort | O(n²) | O(n log n) | MEDIUM |
| Linear primality test | O(n) | O(√n) | MEDIUM |
| Vector without `.reserve()` (C++) | O(n log n) amortized | O(n) | LOW |

### 3. CLASSIFY — Already Optimal Detection
Return `{ alreadyOptimal: true }` when:
- Max loop depth ≤ 1
- No exponential recursion detected
- At least one efficient structure already in use (Map, Set, HashMap, unordered_map)
- No string-concat-in-loop pattern
- No linear-search-in-loop pattern

### 4. PLAN — Select Transformation Strategy
Pick the highest-severity issue and select the appropriate fix:
- `hash_map_lookup` — replace O(n) inner loop with O(1) map lookup
- `memoization` — inject `@lru_cache` (Python) or Map-based memo (JS)
- `string_buffer` — replace `str +=` with list/StringBuilder/stringstream
- `set_lookup` — replace `.includes()`/`.contains()` with Set/HashSet
- `native_sort` — replace manual swap sort with `.sort()` / `list.sort()` / `std::sort`
- `sqrt_primality` — replace linear `for i in range(2, n)` with `while i*i <= n`
- `vector_reserve` — inject `.reserve(capacity)` before push_back loops

### 5. TRANSFORM — Produce Real Optimized Code
**Never** return the original code with comments added.
**Always** produce structurally different code that:
- Preserves the original function name(s) and parameter name(s)
- Uses the same variable names where semantically correct
- Adds a header comment block describing: language, before/after complexity, applied transformation
- Is syntactically valid and runnable

Language-specific transformation targets:

**JavaScript:**
- Nested loops → full HashMap `Map` rewrite of the identified function
- `string +=` → `const _buf = []; _buf.push(...); str = _buf.join('')`
- `.includes()` in loop → `new Set(arr)` + `.has()`
- `var` → `const`/`let` throughout
- `==` → `===` throughout

**Python:**
- Exponential recursion → `@lru_cache(maxsize=None)` injected above function def
- `str +=` → `_buf = []; _buf.append(...); str = "".join(_buf)`
- Bubble sort → `arr.sort()`
- Linear primality → full O(√n) trial division rewrite
- Nested loops → dict single-pass with complement lookup

**C++:**
- `std::vector<T> param` → `const std::vector<T>& param`
- `string +=` → `std::stringstream` + `ss.str()`
- `.push_back()` loops → add `.reserve(n)` before loop
- Nested loops → `#include <unordered_map>` + single-pass map

**Java:**
- `String += ` → `StringBuilder sb = new StringBuilder(); sb.append(); sb.toString()`
- `.contains()` in loop → `new HashSet<>(collection)` + `.contains()`
- Nested loops → `new HashMap<>()` + single-pass complement lookup

**Rust:**
- `String::new()` concat → `String::with_capacity(n)`
- Nested loops → `use std::collections::{HashMap, HashSet}` + single pass

### 6. MEASURE — Report Complexity Improvements
Always return:
- `timeBefore` / `timeAfter` (Big-O strings)
- `executionTimeMs.before` / `executionTimeMs.after` (estimated milliseconds)
- `timeEfficiencyGain` (e.g., "23.1x speedup")
- `cyclomaticComplexity.before` / `cyclomaticComplexity.after`
- `logs[]` — array of agent log entries describing each transformation applied

## Constraints

- **Never** call `eval()`, `Function()`, or `exec()` anywhere in the agent
- **Never** produce code that is identical to the input (validate before returning)
- **Never** fabricate runtime measurements — use the `estimateTiming()` function with realistic complexity-based estimates
- **Always** try the FastAPI backend first (`POST /api/v1/optimize`)
- **Always** validate backend response: `optimizedCode.trim() !== sourceCode.trim()`
- Per-file isolation: results are stored in `fileOptimizations[fileId]` in App state

## Expected Inputs

```javascript
runOptiCodeAgent(
  sourceCode: string,   // Full content of the selected file
  language: string,     // 'javascript' | 'python' | 'cpp' | 'java' | 'rust'
  filename: string      // Exact filename (e.g. 'example.py')
)
```

## Expected Output

```javascript
{
  alreadyOptimal: false,
  optimizedCode: string,           // Fully rewritten optimized source code
  timeBefore: string,              // e.g. 'O(n²)'
  timeAfter: string,               // e.g. 'O(n)'
  timeEfficiencyGain: string,      // e.g. '23.1x speedup'
  spaceBefore: string,             // e.g. 'O(n)'
  spaceAfter: string,              // e.g. 'O(n)'
  spaceMemorySaved: string,        // Technique name
  cyclomaticComplexity: { before: number, after: number },
  executionTimeMs: { before: string, after: string },
  logs: string[],                  // Agent step logs
  recommendations: string[],       // Language-specific best practices
  rawAnalysis: {
    issues: Issue[],               // All detected issues with severity
    source: 'backend' | 'agent',   // Which pipeline produced the result
    linesOfCode: number
  }
}
```

## Location
`src/utils/optiCodeAgent.js` — client-side agent implementation  
`.agents/agents/opticode-optimization-agent.md` — this specification document

## Example Use Cases

1. **User submits a Python two-sum O(n²) nested loop** → Agent detects `NESTED_LOOPS`, rewrites function with `seen = {}` dict single pass → `O(n²) → O(n)`, 23x speedup
2. **User submits JavaScript Fibonacci with no memoization** → Agent detects `EXPONENTIAL_RECURSION`, rewrites with `const memo = new Map()` → `O(2ⁿ) → O(n)`, ~2800x speedup
3. **User submits C++ vector processing** → Agent detects no `.reserve()`, adds `.reserve(n)` before push_back loop → eliminates heap reallocation chain
4. **User submits an already-optimal O(n) function using Map** → Agent detects efficient structures in use, returns `{ alreadyOptimal: true }` → shows "Max Optimization Achieved" toast
