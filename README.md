# OptiCode — AI-Powered Code Optimizer & IDE

OptiCode is a modern, high-performance code analysis and optimization platform. It features an interactive dual-pane web IDE, a real-time code analyzer engine, multi-language support (JavaScript, Python, C++, Java, Rust), and automated Big-O complexity refactoring.

---

## 🌐 Website Access

Access the main OptiCode web application locally:

- **Main Application**: [http://localhost:3000](http://localhost:3000)

---

## ✨ Core Features

- **Real-Time Code Analyzer Engine**:
  - Analyzes open source code for any user-created or uploaded file in real time across JavaScript, Python, C++, Java, and Rust.
  - Identifies algorithmic bottlenecks ($O(n^2)$, $O(n^3)$, $O(2^n)$) and outputs targeted refactoring strategies.
- **"Maximum Optimization Reached" Notification**:
  - Automatically detects when code is already optimal ($O(n)$ or $O(1)$) and alerts the user with an optimal status notification banner.
- **Interactive Dual Editor**:
  - Side-by-side Source Code and Optimized Code views with synchronized scrolling and generous bottom padding clearance.
- **Glowing Red "OPTIMIZE CODE" Button**:
  - Positioned beside the `SOURCE CODE` label in the editor pane header for clear access across all code windows.
- **12-Program Benchmark Suite**:
  - Built-in benchmark programs covering common data structures, sorting algorithms, matrix multiplication, and graph traversals.
- **Customizable IDE Settings**:
  - Glassmorphic settings panel with configurable font sizes, indentation tab spacing (2/4 Spaces), auto-formatting, and analyzer threshold toggles.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Main Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to access the application.

---

## 📜 License

Distributed under the MIT License.
