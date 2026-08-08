// Quick validation of the OptiCode Agent pattern detection logic
// Run with: node test_agent_logic.js

function getMaxLoopDepth(code, lang) {
  if (lang === 'python') {
    const lines = code.split('\n');
    let maxDepth = 0, depth = 0;
    const stack = [];
    for (const line of lines) {
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;
      if (/^(for |while )/.test(trimmed)) {
        while (stack.length && stack[stack.length - 1] >= indent) { stack.pop(); depth = Math.max(0, depth - 1); }
        stack.push(indent); depth++; maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }
  const loopRe = /\b(for|while)\s*\(/g;
  let braceDepth = 0, loopDepth = 0, maxDepth = 0;
  const loopBraces = [];
  for (const line of code.split('\n')) {
    const t = line.trim();
    if (loopRe.test(t)) { loopDepth++; maxDepth = Math.max(maxDepth, loopDepth); loopBraces.push(braceDepth); }
    loopRe.lastIndex = 0;
    braceDepth += (line.match(/{/g)||[]).length - (line.match(/}/g)||[]).length;
    braceDepth = Math.max(0, braceDepth);
    while (loopBraces.length && braceDepth <= loopBraces[loopBraces.length-1]) { loopBraces.pop(); loopDepth = Math.max(0, loopDepth-1); }
  }
  return maxDepth;
}

function hasStringConcatInLoop(code, lang) {
  if (lang === 'python')     return /for\s.+:[\s\S]{0,300}\+=/m.test(code) && /=\s*['"]{2}|=\s*str\s*\(/.test(code);
  if (lang === 'javascript') return /for[\s\S]{0,400}\+=\s*['"`]/.test(code) || /for[\s\S]{0,200}result\s*\+=/.test(code);
  if (lang === 'java')       return (/String\s+\w+\s*=\s*""/.test(code) && /\+=/.test(code)) || /for[\s\S]{0,300}\+=\s*"/.test(code);
  return false;
}

function hasLinearSearchInLoop(code, lang) {
  if (lang === 'javascript') return /for[\s\S]{0,400}\.includes\s*\(|for[\s\S]{0,400}\.indexOf\s*\(/.test(code);
  return false;
}

function hasBubbleSortPattern(code, lang) {
  if (lang === 'javascript') return /for[\s\S]{0,200}for[\s\S]{0,200}(?:temp\s*=|swap|\[\s*j\s*\]\s*=\s*\w+\[\s*j\s*\+\s*1\s*\])/.test(code);
  if (lang === 'python')     return /for\s.+:[\s\S]{0,300}for\s.+:[\s\S]{0,200}(?:\w+\[\w+\]\s*,\s*\w+\[\w+\]\s*=|temp\s*=\s*\w+\[\w+\])/.test(code);
  return false;
}

// ── Test Cases ────────────────────────────────────────────────────────────────

const tests = [
  {
    name: 'JS: Two Sum O(n²) nested loop',
    lang: 'javascript',
    code: `function findPair(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) return [i, j];
    }
  }
  return null;
}`,
    expected: { loopDepth: 2, issue: 'NESTED_LOOPS', before: 'O(n²)', after: 'O(n)' }
  },
  {
    name: 'JS: String concat in loop O(n²)',
    lang: 'javascript',
    code: `function buildStr(items) {
  let result = '';
  for (let i = 0; i < items.length; i++) {
    result += items[i];
  }
  return result;
}`,
    expected: { loopDepth: 1, issue: 'STRING_CONCAT_LOOP', before: 'O(n²)', after: 'O(n)' }
  },
  {
    name: 'JS: .includes() in loop',
    lang: 'javascript',
    code: `function findDups(arr, lookup) {
  const dups = [];
  for (let i = 0; i < arr.length; i++) {
    if (lookup.includes(arr[i])) dups.push(arr[i]);
  }
  return dups;
}`,
    expected: { loopDepth: 1, issue: 'LINEAR_SEARCH_IN_LOOP', before: 'O(n²)', after: 'O(n)' }
  },
  {
    name: 'JS: Bubble sort O(n²)',
    lang: 'javascript',
    code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}`,
    expected: { loopDepth: 2, issue: 'BUBBLE_SORT', before: 'O(n²)', after: 'O(n log n)' }
  },
  {
    name: 'Python: Nested loops',
    lang: 'python',
    code: `def find_pair(arr, target):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                return (i, j)
    return None`,
    expected: { loopDepth: 2, issue: 'NESTED_LOOPS', before: 'O(n²)', after: 'O(n)' }
  },
  {
    name: 'Python: String concat in loop',
    lang: 'python',
    code: `def build_string(items):
    result = ''
    for item in items:
        result += str(item)
    return result`,
    expected: { loopDepth: 1, issue: 'STRING_CONCAT_LOOP', before: 'O(n²)', after: 'O(n)' }
  },
];

// ── Run Tests ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log('='.repeat(70));
console.log('OPTICODE AGENT — Pattern Detection Validation');
console.log(`${tests.length} test cases`);
console.log('='.repeat(70));

for (let i = 0; i < tests.length; i++) {
  const test = tests[i];
  const depth = getMaxLoopDepth(test.code, test.lang);
  const strConcat = hasStringConcatInLoop(test.code, test.lang);
  const linearSearch = hasLinearSearchInLoop(test.code, test.lang);
  const bubbleSort = hasBubbleSortPattern(test.code, test.lang);

  const issues = [];
  if (depth >= 2 && !strConcat && !bubbleSort) issues.push({ type: 'NESTED_LOOPS', before: 'O(n²)', after: 'O(n)' });
  if (strConcat)     issues.push({ type: 'STRING_CONCAT_LOOP', before: 'O(n²)', after: 'O(n)' });
  if (linearSearch)  issues.push({ type: 'LINEAR_SEARCH_IN_LOOP', before: 'O(n²)', after: 'O(n)' });
  if (bubbleSort)    issues.push({ type: 'BUBBLE_SORT', before: 'O(n²)', after: 'O(n log n)' });

  const detectedIssue = issues[0]?.type;
  const ok = depth === test.expected.loopDepth && detectedIssue === test.expected.issue;

  if (ok) {
    console.log(`[${i+1}/${tests.length}] ✅ PASS  ${test.name}`);
    console.log(`         Loop depth: ${depth} | Issue: ${detectedIssue} | ${test.expected.before} → ${test.expected.after}`);
    passed++;
  } else {
    console.log(`[${i+1}/${tests.length}] ❌ FAIL  ${test.name}`);
    console.log(`         Expected: loopDepth=${test.expected.loopDepth}, issue=${test.expected.issue}`);
    console.log(`         Got:      loopDepth=${depth}, issue=${detectedIssue}`);
    failed++;
  }
  console.log();
}

console.log('='.repeat(70));
console.log(`RESULT: ${passed}/${tests.length} PASSED (${failed} failed)`);
console.log('='.repeat(70));
