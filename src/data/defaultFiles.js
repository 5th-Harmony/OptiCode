// OptiCode Default Benchmark Files — 12 distinct programs across 5 languages
// Each file has a UNIQUE function signature & a specific complexity bottleneck
// so optimizerEngine.js can produce a UNIQUE optimization result per file.

export const INITIAL_FILES = [

  // ══════════════════════════════════════════════════════════════
  // JAVASCRIPT — 3 files, each with a different bottleneck pattern
  // ══════════════════════════════════════════════════════════════

  {
    id: 'js-1',
    name: 'DataGrid.js',
    path: 'src/components/DataGrid.js',
    language: 'javascript',
    content: `// DataGrid.js — O(n²) nested duplicate scan + manual groupBy
// Pattern: nested for-loop duplicate check, redundant Object.keys() scan

function processData(items) {
  let result = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].active === true) {
      let isDuplicate = false;
      for (let j = 0; j < result.length; j++) {   // O(n) inner scan → O(n²) total
        if (result[j].id === items[i].id) { isDuplicate = true; break; }
      }
      if (!isDuplicate) {
        let temp = items[i];
        temp.processed = true;
        result.push(temp);
      }
    }
  }
  return result.sort(function(a, b) { return a.value - b.value; });
}

function groupByCategory(items) {
  let groups = {};
  for (let i = 0; i < items.length; i++) {
    let found = false;
    let keys = Object.keys(groups);               // Recomputed O(n) every iteration
    for (let k = 0; k < keys.length; k++) {
      if (keys[k] === items[i].category) { groups[keys[k]].push(items[i]); found = true; break; }
    }
    if (!found) groups[items[i].category] = [items[i]];
  }
  return groups;
}

const sampleItems = Array.from({ length: 1000 }, (_, i) => ({
  id: i % 200, active: i % 3 !== 0, value: Math.random() * 100,
  category: ['A','B','C','D'][i % 4], processed: false
}));
console.log('Processed:', processData(sampleItems).length);
console.log('Groups:', Object.keys(groupByCategory(sampleItems)).length);`
  },

  {
    id: 'js-2',
    name: 'SearchEngine.js',
    path: 'src/search/SearchEngine.js',
    language: 'javascript',
    content: `// SearchEngine.js — O(n*m) brute-force substring search + O(n²) ranking sort
// Pattern: naive string search, bubble sort ranking, no index structure

function naiveSearch(corpus, query) {
  const results = [];
  for (let i = 0; i < corpus.length; i++) {
    let matchCount = 0;
    // O(m) substring check repeated O(n) times = O(n*m)
    for (let pos = 0; pos <= corpus[i].length - query.length; pos++) {
      let match = true;
      for (let c = 0; c < query.length; c++) {
        if (corpus[i][pos + c] !== query[c]) { match = false; break; }
      }
      if (match) matchCount++;
    }
    if (matchCount > 0) results.push({ doc: corpus[i], score: matchCount });
  }
  return results;
}

function rankResults(results) {
  // O(n²) bubble sort — replace with O(n log n) native sort
  for (let i = 0; i < results.length - 1; i++) {
    for (let j = 0; j < results.length - i - 1; j++) {
      if (results[j].score < results[j+1].score) {
        let temp = results[j]; results[j] = results[j+1]; results[j+1] = temp;
      }
    }
  }
  return results;
}

const corpus = Array.from({ length: 500 }, (_, i) => \`document_\${i} contains keyword_\${i % 10}\`);
const hits = naiveSearch(corpus, 'keyword_5');
console.log('Hits:', rankResults(hits).length);`
  },

  {
    id: 'js-3',
    name: 'EventManager.js',
    path: 'src/core/EventManager.js',
    language: 'javascript',
    content: `// EventManager.js — O(n) listener scan + memory leak patterns
// Pattern: linear scan for every emit, no cleanup, closure leak

function EventManager() {
  this.listeners = [];

  this.on = function(event, callback) {
    this.listeners.push({ event, callback });  // No deduplication check
  };

  this.emit = function(event, data) {
    // O(n) full scan for every emit — scales poorly with many event types
    for (let i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i].event === event) {
        this.listeners[i].callback(data);       // No try/catch — one bad listener kills all
      }
    }
  };

  this.off = function(event, callback) {
    // O(n) filter rebuild on every removal — O(n²) for mass removal
    this.listeners = this.listeners.filter(function(l) {
      return !(l.event === event && l.callback === callback);
    });
  };
}

const mgr = new EventManager();
for (let i = 0; i < 1000; i++) {
  mgr.on('data', function(d) { return d * 2; });  // 1000 identical anonymous listeners — leak
}
mgr.emit('data', 42);  // Calls all 1000 listeners`
  },

  // ══════════════════════════════════════════════════════════════
  // PYTHON — 3 files, each with a different bottleneck pattern
  // ══════════════════════════════════════════════════════════════

  {
    id: 'py-1',
    name: 'algo.py',
    path: 'src/utils/algo.py',
    language: 'python',
    content: `# algo.py — O(n²) duplicate scan + O(2^n) Fibonacci recursion
# Pattern: nested index loops, unguarded exponential recursion

def find_duplicates(numbers):
    """O(n²) nested loop scan — ~n²/2 comparisons for n=1000 → 500,000 ops"""
    duplicates = []
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] == numbers[j]:
                if numbers[i] not in duplicates:
                    duplicates.append(numbers[i])
    return duplicates

def compute_fibonacci(n):
    """O(2^n) unguarded recursion — fib(40) triggers ~2.7 billion calls"""
    if n <= 1:
        return n
    return compute_fibonacci(n - 1) + compute_fibonacci(n - 2)

def count_pairs_with_sum(arr, target):
    """O(n²) brute-force pair check — all (i,j) combinations"""
    count = 0
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                count += 1
    return count

sample = list(range(500)) + list(range(250))
print("Duplicates:", len(find_duplicates(sample)))
print("Fib(35):", compute_fibonacci(35))
print("Pairs:", count_pairs_with_sum(list(range(200)), 100))`
  },

  {
    id: 'py-2',
    name: 'graph_bfs.py',
    path: 'src/graphs/graph_bfs.py',
    language: 'python',
    content: `# graph_bfs.py — O(V*(V+E)) BFS with O(n) visited check + O(n²) adjacency build
# Pattern: list-based visited check, adjacency matrix rebuild every BFS call

def build_adjacency_list(edges):
    """O(n²) — rebuild adjacency matrix from scratch on every call"""
    graph = {}
    for u, v in edges:
        if u not in graph: graph[u] = []
        if v not in graph: graph[v] = []
        for node in graph:              # O(n) scan to check membership each time
            if node == u: graph[node].append(v)
            if node == v: graph[node].append(u)
    return graph

def bfs_shortest_path(graph, start, end):
    """BFS with O(n) list.index() check — should be O(1) set lookup"""
    visited = []   # Using list instead of set: O(n) membership check each time
    queue = [[start]]

    while queue:
        path = queue.pop(0)    # Dequeue from front: O(n) operation on list
        node = path[-1]

        if node in visited:    # O(n) linear scan every iteration
            continue
        visited.append(node)

        if node == end:
            return path

        for neighbour in graph.get(node, []):
            new_path = list(path) + [neighbour]   # O(n) copy each time
            queue.append(new_path)
    return []

edges = [(i, i+1) for i in range(100)] + [(i, i+2) for i in range(98)]
graph = build_adjacency_list(edges)
path = bfs_shortest_path(graph, 0, 50)
print("Path length:", len(path))`
  },

  {
    id: 'py-3',
    name: 'prime_sieve.py',
    path: 'src/math/prime_sieve.py',
    language: 'python',
    content: `# prime_sieve.py — O(n*sqrt(n)) trial division vs O(n log log n) sieve
# Pattern: redundant modulo checks, no early termination optimization

def is_prime_naive(n):
    """O(n) trial division — checks every number from 2 to n"""
    if n < 2:
        return False
    for i in range(2, n):     # Should only go to sqrt(n)
        if n % i == 0:
            return False
    return True

def find_primes_naive(limit):
    """O(n²) — calls O(n) is_prime for each of n numbers"""
    primes = []
    for num in range(2, limit + 1):
        if is_prime_naive(num):    # O(n) check called O(n) times = O(n²)
            primes.append(num)
    return primes

def count_prime_factors(n):
    """O(n) factor count — redundant division checks without precomputed primes"""
    factors = []
    for i in range(2, n + 1):   # Should stop at sqrt(n)
        while n % i == 0:
            factors.append(i)
            n //= i
    return factors

primes = find_primes_naive(1000)
print("Primes up to 1000:", len(primes))
print("Factors of 360:", count_prime_factors(360))
print("Is 997 prime:", is_prime_naive(997))`
  },

  // ══════════════════════════════════════════════════════════════
  // C++ — 2 files with different memory/algorithm patterns
  // ══════════════════════════════════════════════════════════════

  {
    id: 'cpp-1',
    name: 'quick_sort.cpp',
    path: 'src/sorting/quick_sort.cpp',
    language: 'cpp',
    content: `// quick_sort.cpp — O(n²) vector inner scan + bubble sort + no reserve()
// Pattern: nested vector lookup, manual bubble sort, heap reallocation chain

#include <iostream>
#include <vector>
#include <string>

// O(n²): inner result-scan for duplicate filtering
std::vector<int> filter_and_square(const std::vector<int>& data) {
    std::vector<int> result;   // No reserve: log2(n) heap reallocs
    for (size_t i = 0; i < data.size(); i++) {
        if (data[i] % 2 == 0) {
            int squared = data[i] * data[i];
            bool exists = false;
            for (size_t j = 0; j < result.size(); j++) {   // O(n) inner scan
                if (result[j] == squared) { exists = true; break; }
            }
            if (!exists) result.push_back(squared);
        }
    }
    return result;
}

// O(n²): bubble sort — n*(n-1)/2 comparisons
std::vector<int> bubble_sort(std::vector<int> arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = temp;
            }
        }
    }
    return arr;
}

int main() {
    std::vector<int> data;
    for (int i = 0; i < 2000; i++) data.push_back(i);
    auto filtered = filter_and_square(data);
    auto sorted = bubble_sort(data);
    std::cout << "Filtered: " << filtered.size() << ", Sorted[0]: " << sorted[0] << std::endl;
    return 0;
}`
  },

  {
    id: 'cpp-2',
    name: 'linked_list.cpp',
    path: 'src/data_structures/linked_list.cpp',
    language: 'cpp',
    content: `// linked_list.cpp — O(n) linear search + O(n²) insertion sort on linked list
// Pattern: no index structure, every search is O(n), sort is O(n²)

#include <iostream>
#include <string>
#include <vector>

struct Node {
    int value;
    Node* next;
    Node(int v) : value(v), next(nullptr) {}
};

class LinkedList {
public:
    Node* head = nullptr;
    int size = 0;

    void append(int val) {
        Node* node = new Node(val);
        if (!head) { head = node; size++; return; }
        Node* cur = head;
        while (cur->next) cur = cur->next;   // O(n) traversal for every append
        cur->next = node;
        size++;
    }

    bool contains(int val) {
        Node* cur = head;
        while (cur) {                         // O(n) linear search — no indexing
            if (cur->value == val) return true;
            cur = cur->next;
        }
        return false;
    }

    // O(n²) insertion sort on linked list
    void insertionSort() {
        for (Node* i = head; i && i->next; i = i->next) {
            for (Node* j = i->next; j; j = j->next) {
                if (i->value > j->value) {
                    int temp = i->value; i->value = j->value; j->value = temp;
                }
            }
        }
    }
};

int main() {
    LinkedList list;
    for (int i = 1000; i >= 0; i--) list.append(i);
    list.insertionSort();
    std::cout << "Contains 500: " << list.contains(500) << std::endl;
    return 0;
}`
  },

  // ══════════════════════════════════════════════════════════════
  // JAVA — 2 files with different JVM anti-patterns
  // ══════════════════════════════════════════════════════════════

  {
    id: 'java-1',
    name: 'MatrixAlgo.java',
    path: 'src/algorithms/MatrixAlgo.java',
    language: 'java',
    content: `package com.opticode.algo;

import java.util.ArrayList;
import java.util.List;

// MatrixAlgo.java — O(n³) cache-unfriendly matrix multiply + O(n³) String concat
// Pattern: i-j-k loop order (cache miss), immutable String in inner loop

public class MatrixAlgo {

    // O(n³): i→j→k loop — B[k][j] accessed non-sequentially (L1/L2 cache miss)
    public static int[][] multiplyMatrices(int[][] A, int[][] B) {
        int n = A.length;
        int[][] C = new int[n][n];
        String auditLog = "";   // Immutable: each += creates a new String object

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                C[i][j] = 0;
                for (int k = 0; k < n; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                    auditLog += "(" + i + "," + j + "," + k + ");";  // O(n³) object churn
                }
            }
        }
        System.out.println("Log: " + auditLog.length());
        return C;
    }

    // O(n²): ArrayList.contains() is O(n) inside an O(n) outer loop
    public static List<Integer> findUniqueElements(List<Integer> items) {
        List<Integer> unique = new ArrayList<>();
        for (Integer item : items) {
            if (!unique.contains(item)) {  // O(n) linear scan each time
                unique.add(item);
            }
        }
        return unique;
    }

    public static void main(String[] args) {
        int n = 100;
        int[][] A = new int[n][n], B = new int[n][n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) { A[i][j] = i+j; B[i][j] = i-j; }
        int[][] C = multiplyMatrices(A, B);
        System.out.println("C[0][0]=" + C[0][0]);
    }
}`
  },

  {
    id: 'java-2',
    name: 'StringProcessor.java',
    path: 'src/processing/StringProcessor.java',
    language: 'java',
    content: `package com.opticode.processing;

import java.util.ArrayList;
import java.util.List;

// StringProcessor.java — O(n²) String concat + O(n*m) naive substring search
// Pattern: += String in loop, no StringBuilder, linear text search

public class StringProcessor {

    // O(n²): Each += creates a new String — JVM allocates n*(n+1)/2 char arrays
    public static String buildReport(List<String> entries) {
        String report = "";
        for (String entry : entries) {
            report += "[LOG] " + entry + "\\n";   // O(n) copy per iteration → O(n²) total
        }
        return report;
    }

    // O(n*m): brute-force substring search with char-by-char comparison
    public static List<Integer> findAllOccurrences(String text, String pattern) {
        List<Integer> positions = new ArrayList<>();
        for (int i = 0; i <= text.length() - pattern.length(); i++) {
            boolean match = true;
            for (int j = 0; j < pattern.length(); j++) {   // O(m) per position
                if (text.charAt(i + j) != pattern.charAt(j)) { match = false; break; }
            }
            if (match) positions.add(i);
        }
        return positions;
    }

    // O(n²): count word frequencies by scanning list for each unique word
    public static void countFrequencies(String[] words) {
        List<String> seen = new ArrayList<>();
        for (String word : words) {
            if (!seen.contains(word)) {   // O(n) ArrayList.contains each time
                seen.add(word);
                int count = 0;
                for (String w : words) { if (w.equals(word)) count++; }   // O(n) scan again
                System.out.println(word + ": " + count);
            }
        }
    }

    public static void main(String[] args) {
        List<String> entries = new ArrayList<>();
        for (int i = 0; i < 1000; i++) entries.add("Event_" + i);
        String report = buildReport(entries);
        System.out.println("Report length: " + report.length());

        List<Integer> occ = findAllOccurrences("abcabcabc", "abc");
        System.out.println("Occurrences: " + occ.size());
    }
}`
  },

  // ══════════════════════════════════════════════════════════════
  // RUST — 2 files with different ownership/complexity patterns
  // ══════════════════════════════════════════════════════════════

  {
    id: 'rs-1',
    name: 'data_processor.rs',
    path: 'src/processor/data_processor.rs',
    language: 'rust',
    content: `// data_processor.rs — O(n²) clone-heavy Vec dedup + O(n²) pair search
// Pattern: Vec::contains() is O(n) inside O(n) loop, unnecessary .clone()

use std::time::Instant;

pub fn process_records(records: Vec<String>) -> Vec<String> {
    let mut unique_filtered: Vec<String> = Vec::new();
    for item in &records {
        if item.contains("ERR") || item.contains("WARN") {
            let mut exists = false;
            for existing in &unique_filtered {   // O(n) inner scan — O(n²) total
                if existing == item { exists = true; break; }
            }
            if !exists {
                unique_filtered.push(item.clone());  // .clone() on every push
            }
        }
    }
    unique_filtered
}

pub fn find_pair_with_sum(nums: &[i64], target: i64) -> Option<(i64, i64)> {
    for i in 0..nums.len() {
        for j in (i+1)..nums.len() {      // O(n²) nested loop — all pairs
            if nums[i] + nums[j] == target { return Some((nums[i], nums[j])); }
        }
    }
    None
}

fn main() {
    let records: Vec<String> = (0..5000)
        .map(|i| format!("{}: {}", if i % 3 == 0 { "ERR" } else { "INFO" }, i))
        .collect();
    let start = Instant::now();
    let result = process_records(records);
    println!("Unique ERR records: {} in {:?}", result.len(), start.elapsed());

    let nums: Vec<i64> = (0..1000).collect();
    match find_pair_with_sum(&nums, 1500) {
        Some((a, b)) => println!("Found: {} + {} = 1500", a, b),
        None => println!("Not found"),
    }
}`
  },

  {
    id: 'rs-2',
    name: 'hash_counter.rs',
    path: 'src/analytics/hash_counter.rs',
    language: 'rust',
    content: `// hash_counter.rs — O(n²) frequency count + O(n²) top-k selection
// Pattern: Vec-based frequency counting, no HashMap, naive top-k

use std::time::Instant;

pub fn count_frequencies(words: &[String]) -> Vec<(String, usize)> {
    let mut result: Vec<(String, usize)> = Vec::new();

    for word in words {
        let mut found = false;
        for entry in &mut result {          // O(n) scan per word → O(n²) total
            if &entry.0 == word {
                entry.1 += 1;
                found = true;
                break;
            }
        }
        if !found {
            result.push((word.clone(), 1)); // .clone() on every new word
        }
    }
    result
}

pub fn top_k_words(frequencies: &[(String, usize)], k: usize) -> Vec<(String, usize)> {
    let mut sorted = frequencies.to_vec();  // O(n) clone of the whole vec
    // O(n²): bubble sort to find top-k — should use partial sort or BinaryHeap
    for i in 0..sorted.len() {
        for j in 0..sorted.len() - i - 1 {
            if sorted[j].1 < sorted[j+1].1 {
                sorted.swap(j, j+1);
            }
        }
    }
    sorted.into_iter().take(k).collect()
}

fn main() {
    let words: Vec<String> = (0..2000)
        .map(|i| format!("word_{}", i % 100))
        .collect();
    let start = Instant::now();
    let freqs = count_frequencies(&words);
    let top = top_k_words(&freqs, 10);
    println!("Unique words: {}, Top: {:?}", freqs.len(), top[0].0);
    println!("Time: {:?}", start.elapsed());
}`
  }
];

export const MOCK_USER_PROFILE = {
  username: 'dev_architect_99',
  email: 'alex.dev@opticode.io',
  role: 'Senior AI & Systems Architect',
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
      description: 'Nested forEach and map iterations detected. Consider Map lookups for O(1) time.'
    },
    {
      id: 'ins-2',
      title: 'Deeply Nested Conditionals',
      count: 18,
      severity: 'medium',
      description: 'High cyclomatic complexity detected. Implement early returns (Guard Clauses) to flatten branches.'
    },
    {
      id: 'ins-3',
      title: 'Memory Leaks (Event Listeners)',
      count: 7,
      severity: 'critical',
      description: 'Unbound event listeners in component teardown. Ensure removeEventListener is called in cleanup.'
    }
  ]
};
