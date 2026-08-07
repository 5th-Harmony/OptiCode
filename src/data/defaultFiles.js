export const INITIAL_FILES = [
  {
    id: '1',
    name: 'DataGrid.js',
    path: 'src/components/DataGrid.js',
    language: 'javascript',
    content: `function processData(items) {
  let result = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].active === true) {
      let temp = items[i];
      temp.processed = true;
      result.push(temp);
    }
  }

  return result.sort(function(a, b) {
    return a.value - b.value;
  });
}`
  },
  {
    id: '2',
    name: 'algo.py',
    path: 'src/utils/algo.py',
    language: 'python',
    content: `def find_duplicates(numbers):
    duplicates = []
    # O(n^2) time complexity with nested loops
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] == numbers[j]:
                if numbers[i] not in duplicates:
                    duplicates.append(numbers[i])
    return duplicates

def compute_fibonacci(n):
    # Unoptimized exponential recursive fibonacci O(2^n)
    if n <= 1:
        return n
    return compute_fibonacci(n - 1) + compute_fibonacci(n - 2)`
  },
  {
    id: '3',
    name: 'quick_sort.cpp',
    path: 'src/sorting/quick_sort.cpp',
    language: 'cpp',
    content: `#include <iostream>
#include <vector>

std::vector<int> filter_and_square(const std::vector<int>& data) {
    std::vector<int> result;
    // Inefficient repeated allocation and vector search
    for (int i = 0; i < data.size(); i++) {
        bool exists = false;
        for (int j = 0; j < result.size(); j++) {
            if (result[j] == data[i] * data[i]) {
                exists = true;
                break;
            }
        }
        if (!exists && data[i] % 2 == 0) {
            result.push_back(data[i] * data[i]);
        }
    }
    return result;
}`
  },
  {
    id: '4',
    name: 'main.js',
    path: 'src/main.js',
    language: 'javascript',
    content: `// Main entry point for OptiCode workbench
import { processData } from './components/DataGrid.js';

const rawData = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  value: Math.random() * 1000,
  active: i % 2 === 0
}));

console.time('Processing');
const output = processData(rawData);
console.timeEnd('Processing');
console.log('Processed count:', output.length);`
  }
];

export const MOCK_USER_PROFILE = {
  username: 'dev_architect_99',
  email: 'alex.dev@opticode.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  isPro: true,
  stats: {
    totalOptimizations: 128,
    weeklyIncrease: 14,
    efficiencyGain: 42,
    topLanguage: 'JavaScript'
  },
  insights: [
    {
      id: 'ins-1',
      title: 'Unnecessary Loops',
      count: 42,
      severity: 'high',
      description: 'Nested `forEach` and `map` iterations detected. Consider using a single reduce or leveraging Map lookups for O(1) time.'
    },
    {
      id: 'ins-2',
      title: 'Deeply Nested Conditionals',
      count: 18,
      severity: 'medium',
      description: 'High cyclomatic complexity detected. Recommend implementing early returns (Guard Clauses) to flatten execution branches.'
    },
    {
      id: 'ins-3',
      title: 'Memory Leaks (Event Listeners)',
      count: 7,
      severity: 'critical',
      description: 'Unbound event listeners in component teardown phase. Ensure `removeEventListener` is registered in cleanup callbacks.'
    }
  ]
};
