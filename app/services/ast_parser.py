import ast
import re
from typing import Dict, Any, List
from app.api.schemas import ASTAnalysisResult, SupportedLanguage
from app.utils.logger import get_logger

logger = get_logger("ASTParserService")

class ASTParserService:
    """
    Stage 3: AST Parsing Module.
    Parses code strings into Abstract Syntax Trees (AST) to measure structural logic,
    detect nested loop depths, recursive calls, and estimate algorithmic complexity.
    """

    def analyze(self, language: SupportedLanguage, code: str) -> ASTAnalysisResult:
        """
        Parses source code into AST and evaluates structural complexity.
        """
        if language == SupportedLanguage.PYTHON:
            return self._analyze_python_ast(code)
        elif language == SupportedLanguage.JAVA:
            return self._analyze_heuristic_ast(code, language="java")
        elif language == SupportedLanguage.CPP:
            return self._analyze_heuristic_ast(code, language="cpp")
        elif language == SupportedLanguage.JAVASCRIPT:
            return self._analyze_heuristic_ast(code, language="javascript")
        elif language == SupportedLanguage.RUST:
            return self._analyze_heuristic_ast(code, language="rust")
        else:
            return self.generic_fallback_ast(code)

    def _analyze_python_ast(self, code: str) -> ASTAnalysisResult:
        """
        Parses Python code using native AST library and measures loop nesting and recursion.
        """
        try:
            tree = ast.parse(code)
        except SyntaxError as se:
            logger.warning(f"Python AST parsing syntax error: {se}")
            return ASTAnalysisResult(
                max_loop_depth=0,
                estimated_time_complexity="O(1) [Syntax Error]",
                estimated_space_complexity="O(1)",
                detected_patterns=["Syntax Error in input code"],
                ast_tree_repr=f"SyntaxError: {se}"
            )

        max_depth = 0
        detected_patterns = []
        has_recursion = False
        has_in_loop_search = False
        has_string_concat_in_loop = False
        has_matrix_alloc = False

        class LoopDepthVisitor(ast.NodeVisitor):
            def __init__(self):
                self.current_depth = 0
                self.max_depth = 0
                self.current_function = None

            def visit_FunctionDef(self, node):
                prev_func = self.current_function
                self.current_function = node.name
                self.generic_visit(node)
                self.current_function = prev_func

            def visit_AsyncFunctionDef(self, node):
                prev_func = self.current_function
                self.current_function = node.name
                self.generic_visit(node)
                self.current_function = prev_func

            def visit_For(self, node):
                self.current_depth += 1
                if self.current_depth > self.max_depth:
                    self.max_depth = self.current_depth
                self.generic_visit(node)
                self.current_depth -= 1

            def visit_While(self, node):
                self.current_depth += 1
                if self.current_depth > self.max_depth:
                    self.max_depth = self.current_depth
                self.generic_visit(node)
                self.current_depth -= 1

            def _visit_comprehension(self, node):
                generators = getattr(node, 'generators', [])
                num_gens = len(generators)
                self.current_depth += num_gens
                if self.current_depth > self.max_depth:
                    self.max_depth = self.current_depth
                self.generic_visit(node)
                self.current_depth -= num_gens

            def visit_ListComp(self, node):
                nonlocal has_matrix_alloc
                generators = getattr(node, 'generators', [])
                if len(generators) >= 2 or isinstance(node.elt, (ast.ListComp, ast.List)):
                    has_matrix_alloc = True
                self._visit_comprehension(node)

            def visit_SetComp(self, node):
                self._visit_comprehension(node)

            def visit_DictComp(self, node):
                self._visit_comprehension(node)

            def visit_GeneratorExp(self, node):
                self._visit_comprehension(node)

            def visit_Compare(self, node):
                nonlocal has_in_loop_search
                if self.current_depth > 0:
                    for op in node.ops:
                        if isinstance(op, (ast.In, ast.NotIn)):
                            has_in_loop_search = True
                self.generic_visit(node)

            def visit_Call(self, node):
                nonlocal has_recursion, has_in_loop_search
                if (
                    isinstance(node.func, ast.Name)
                    and self.current_function is not None
                    and node.func.id == self.current_function
                ):
                    has_recursion = True

                if self.current_depth > 0:
                    if isinstance(node.func, ast.Attribute) and node.func.attr in ("index", "count", "find"):
                        has_in_loop_search = True

                self.generic_visit(node)

            def visit_AugAssign(self, node):
                nonlocal has_string_concat_in_loop
                if self.current_depth > 0 and isinstance(node.op, ast.Add):
                    has_string_concat_in_loop = True
                self.generic_visit(node)

        visitor = LoopDepthVisitor()
        visitor.visit(tree)
        max_depth = visitor.max_depth

        effective_time_depth = max_depth
        if max_depth == 1 and has_in_loop_search:
            effective_time_depth = 2
            detected_patterns.append("Implicit O(n^2) bottleneck: Linear sequence lookup ('in' / index / count) inside single loop")

        if max_depth == 1 and has_string_concat_in_loop:
            detected_patterns.append("Quadratic string concatenation inside loop detected ('+=' creates new string each iteration)")

        if effective_time_depth >= 3:
            time_complexity = f"O(n^{effective_time_depth})"
            detected_patterns.append(f"Deeply nested loop structure (Depth {effective_time_depth})")
        elif effective_time_depth == 2:
            time_complexity = "O(n^2)"
            if max_depth >= 2:
                detected_patterns.append("Quadratic bottleneck: Double nested loop searching or operating on iterable")
        elif effective_time_depth == 1:
            time_complexity = "O(n)"
            detected_patterns.append("Linear loop traversal")
        else:
            time_complexity = "O(1)"
            detected_patterns.append("Constant time operations / no loops")

        if has_recursion:
            detected_patterns.append("Recursive function call pattern detected")
            if max_depth == 0:
                time_complexity = "O(2^n) or O(n) [Recursive]"

        # Space complexity heuristics
        if has_matrix_alloc:
            space_complexity = "O(n^2)"
            detected_patterns.append("Quadratic space allocation detected (2D Matrix / Nested List Comprehension)")
        else:
            space_complexity = "O(1)"
            for node in ast.walk(tree):
                if isinstance(node, (ast.List, ast.Dict, ast.Set, ast.ListComp, ast.DictComp)):
                    space_complexity = "O(n)"
                    detected_patterns.append("Linear space allocation detected (List/Dict instantiation)")
                    break

        tree_str = ast.dump(tree)[:300] + "..." if len(ast.dump(tree)) > 300 else ast.dump(tree)

        return ASTAnalysisResult(
            max_loop_depth=max_depth,
            estimated_time_complexity=time_complexity,
            estimated_space_complexity=space_complexity,
            detected_patterns=list(set(detected_patterns)),
            ast_tree_repr=tree_str
        )

    def _analyze_heuristic_ast(self, code: str, language: str) -> ASTAnalysisResult:
        """
        Regex/Heuristic structural analyzer for Java and C++ code.
        Detects nested loops by tracking brace scope, linear searches in loops, and recursion.
        """
        lines = code.split("\n")
        max_depth = 0
        current_brace_depth = 0
        loop_scope_depths = []
        has_in_loop_search = False
        has_string_concat_in_loop = False
        has_recursion = False

        # Check for user-defined function recursion
        func_matches = re.findall(r'\b([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{', code)
        keywords = {"main", "for", "while", "if", "switch", "catch"}
        user_funcs = [fn for fn in func_matches if fn not in keywords]
        for fn in user_funcs:
            if len(re.findall(r'\b' + fn + r'\s*\(', code)) > 1:
                has_recursion = True
                break

        for line in lines:
            line_clean = line.strip()
            if line_clean.startswith("//") or line_clean.startswith("/*") or line_clean.startswith("*"):
                continue

            line_clean = re.sub(r'".*?"|\'.*?\'', '', line_clean)
            is_loop = any(re.search(r'\b' + kw + r'\b\s*\(', line_clean) for kw in ["for", "while"]) or bool(re.search(r'\bdo\b', line_clean))

            for char in line_clean:
                if char == '{':
                    current_brace_depth += 1
                    if is_loop:
                        loop_scope_depths.append(current_brace_depth)
                        if len(loop_scope_depths) > max_depth:
                            max_depth = len(loop_scope_depths)
                        is_loop = False
                elif char == '}':
                    while loop_scope_depths and loop_scope_depths[-1] >= current_brace_depth:
                        loop_scope_depths.pop()
                    current_brace_depth = max(0, current_brace_depth - 1)

            if loop_scope_depths or is_loop:
                if any(pattern in line_clean for pattern in [".contains(", ".indexOf(", "std::find(", ".find("]):
                    has_in_loop_search = True
                if "+=" in line_clean or ("+" in line_clean and ("String" in code or "string" in code or "std::string" in code)):
                    has_string_concat_in_loop = True

            if is_loop and "{" not in line_clean:
                temp_depth = len(loop_scope_depths) + 1
                if temp_depth > max_depth:
                    max_depth = temp_depth

        detected_patterns = []
        effective_depth = max_depth
        if max_depth == 1 and has_in_loop_search:
            effective_depth = 2
            detected_patterns.append("Implicit O(n^2) bottleneck: Linear sequence lookup inside single loop")

        if max_depth >= 2:
            time_complexity = f"O(n^{effective_depth})" if effective_depth > 2 else "O(n^2)"
            detected_patterns.append(f"Nested loop structure with depth {max_depth}")
        elif effective_depth == 2:
            time_complexity = "O(n^2)"
        elif effective_depth == 1:
            time_complexity = "O(n)"
            detected_patterns.append("Single loop iteration detected")
        else:
            time_complexity = "O(1)"
            detected_patterns.append("Constant time execution")

        if has_recursion:
            detected_patterns.append("Recursive function call pattern detected")
            if max_depth == 0:
                time_complexity = "O(2^n) or O(n) [Recursive]"

        if has_string_concat_in_loop and max_depth >= 1:
            detected_patterns.append("Quadratic string concatenation inside loop detected")

        space_complexity = "O(n)" if any(w in code.lower() for w in ["map", "set", "vector", "list", "new "]) else "O(1)"

        return ASTAnalysisResult(
            max_loop_depth=max_depth,
            estimated_time_complexity=time_complexity,
            estimated_space_complexity=space_complexity,
            detected_patterns=detected_patterns,
            ast_tree_repr=f"<{language.upper()} Structural AST Analysis Depth={max_depth}>"
        )

ast_parser_service = ASTParserService()

