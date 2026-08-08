from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
try:
    from pydantic import field_validator
except ImportError:
    from pydantic import validator as field_validator

class SupportedLanguage(str, Enum):
    PYTHON = "python"
    JAVA = "java"
    CPP = "cpp"
    JAVASCRIPT = "javascript"
    RUST = "rust"

class CodeOptimizationRequest(BaseModel):
    language: SupportedLanguage = Field(..., description="Target programming language (python, java, cpp)")
    code: str = Field(..., description="Source code to analyze and optimize")
    test_input: Optional[str] = Field(None, description="Optional custom test input feed into stdin during sandbox execution")

    @field_validator('code')
    @classmethod
    def validate_code_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Source code cannot be empty")
        if len(v) > 20000:
            raise ValueError("Source code exceeds maximum allowed length of 20,000 characters")
        return v

class SandboxExecutionResult(BaseModel):
    status: str = Field(..., description="SUCCESS, TIMEOUT, COMPILATION_ERROR, RUNTIME_ERROR, or OOM")
    stdout: str = Field("", description="Standard output captured from container execution")
    stderr: str = Field("", description="Standard error captured from container execution")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
    exit_code: int = Field(0, description="Process exit status code")

class ASTAnalysisResult(BaseModel):
    max_loop_depth: int = Field(..., description="Maximum depth of nested loops detected")
    estimated_time_complexity: str = Field(..., description="Big-O Time complexity estimated from AST structural analysis")
    estimated_space_complexity: str = Field(..., description="Big-O Space complexity estimated from AST structural analysis")
    detected_patterns: List[str] = Field(default_factory=list, description="List of detected structural bottlenecks")
    ast_tree_repr: str = Field("", description="Condensed AST string representation")

class OptimizationResult(BaseModel):
    optimized_code: str = Field(..., description="Optimized code refactored for lower time/space complexity")
    original_complexity: str = Field(..., description="Original time complexity")
    new_complexity: str = Field(..., description="Optimized time complexity")
    optimization_technique: str = Field(..., description="Name of optimization pattern/technique applied")
    explanation: str = Field(..., description="Architectural explanation of optimizations made")

class VerificationResult(BaseModel):
    is_verified: bool = Field(..., description="True if original and optimized code outputs match semantically")
    stdout_matched: bool = Field(..., description="True if standard outputs are identical")
    speedup_ratio: float = Field(..., description="Ratio of original runtime / optimized runtime")
    original_runtime_ms: float = Field(..., description="Baseline execution time in ms")
    optimized_runtime_ms: float = Field(..., description="Optimized code execution time in ms")
    details: str = Field(..., description="Verification summary or error explanation")

class CodeOptimizationResponse(BaseModel):
    success: bool
    language: SupportedLanguage
    baseline_execution: SandboxExecutionResult
    ast_analysis: ASTAnalysisResult
    optimization: OptimizationResult
    verification: VerificationResult
    error_message: Optional[str] = None

class ASTAnalysisRequest(BaseModel):
    language: SupportedLanguage = Field(..., description="Target programming language")
    code: str = Field(..., description="Source code to analyze")

    @field_validator('code')
    @classmethod
    def validate_code_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Source code cannot be empty")
        if len(v) > 20000:
            raise ValueError("Source code exceeds maximum allowed length of 20,000 characters")
        return v

class VerificationRequest(BaseModel):
    language: SupportedLanguage = Field(..., description="Target programming language")
    original_code: str = Field(..., description="Original baseline source code")
    optimized_code: str = Field(..., description="Optimized source code to compare against baseline")
    test_input: Optional[str] = Field(None, description="Optional custom test input feed into stdin")

    @field_validator('original_code', 'optimized_code')
    @classmethod
    def validate_code_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Source code cannot be empty")
        if len(v) > 20000:
            raise ValueError("Source code exceeds maximum allowed length of 20,000 characters")
        return v

class LanguageInfo(BaseModel):
    language: SupportedLanguage
    display_name: str
    compiler_or_interpreter: str
    available: bool
    sandbox_supported: bool

class SupportedLanguagesResponse(BaseModel):
    docker_available: bool
    local_fallback_allowed: bool
    languages: List[LanguageInfo]

class PatternInfo(BaseModel):
    id: str
    name: str
    original_complexity: str
    optimized_complexity: str
    description: str
    optimization_technique: str

class PatternListResponse(BaseModel):
    patterns: List[PatternInfo]

class BenchmarkRequest(BaseModel):
    language: SupportedLanguage = Field(..., description="Target programming language (python, java, cpp)")
    original_code: str = Field(..., description="Original baseline code")
    optimized_code: str = Field(..., description="Optimized code to benchmark")
    test_input: Optional[str] = Field(None, description="Optional custom stdin input")
    iterations: int = Field(5, ge=1, le=20, description="Number of execution iterations for profiling (1-20)")

    @field_validator('original_code', 'optimized_code')
    @classmethod
    def validate_code_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Source code cannot be empty")
        if len(v) > 20000:
            raise ValueError("Source code exceeds maximum allowed length of 20,000 characters")
        return v

class BenchmarkResult(BaseModel):
    iterations: int
    original_avg_ms: float
    original_min_ms: float
    original_max_ms: float
    optimized_avg_ms: float
    optimized_min_ms: float
    optimized_max_ms: float
    speedup_ratio: float
    is_verified: bool
    details: str

class BatchOptimizationRequest(BaseModel):
    items: List[CodeOptimizationRequest] = Field(..., min_items=1, max_items=10, description="List of code snippets to optimize (1-10)")

class BatchOptimizationResponse(BaseModel):
    total_processed: int
    results: List[CodeOptimizationResponse]


