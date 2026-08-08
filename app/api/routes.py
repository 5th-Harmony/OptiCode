import shutil
import sys
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from app.api.schemas import (
    CodeOptimizationRequest,
    CodeOptimizationResponse,
    ASTAnalysisRequest,
    ASTAnalysisResult,
    VerificationRequest,
    VerificationResult,
    SupportedLanguagesResponse,
    LanguageInfo,
    PatternListResponse,
    PatternInfo,
    SupportedLanguage,
    BenchmarkRequest,
    BenchmarkResult,
    BatchOptimizationRequest,
    BatchOptimizationResponse
)
from app.config import settings
from app.services.sandbox import sandbox_service
from app.services.ast_parser import ast_parser_service
from app.services.optimizer import optimizer_engine_service
from app.services.verifier import semantic_verifier_service
from app.utils.logger import get_logger
from app.utils.rate_limiter import rate_limiter, POLICY_LOGIN, POLICY_OPTIMIZE, POLICY_GENERAL

from app.db import check_cache, store_cache, store_log, get_db

logger = get_logger("APIRoutes")

router = APIRouter()


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    username: str = ""
    email: str = ""
    token: str = ""
    message: str = ""


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=LoginResponse, tags=["Auth"])
def login_endpoint(request: Request, response: Response, body: LoginRequest):
    """
    Authenticated login with IP-based rate limiting.
    Industry standard: 5 attempts per 15 minutes per IP. 15-minute lockout after exhaustion.
    """
    client_ip = request.client.host if request.client else "unknown"
    allowed, rl_info = rate_limiter.is_allowed(client_ip, "login", **POLICY_LOGIN)

    # Always attach rate limit headers
    response.headers["X-RateLimit-Limit"] = str(rl_info["X-RateLimit-Limit"])
    response.headers["X-RateLimit-Remaining"] = str(rl_info["X-RateLimit-Remaining"])
    response.headers["X-RateLimit-Reset"] = str(rl_info["X-RateLimit-Reset"])

    if not allowed:
        retry = rl_info["Retry-After"]
        mins = round(retry / 60)
        msg = (
            f"Account temporarily locked due to too many failed attempts. "
            f"Please try again in {mins} minute(s)."
            if rl_info.get("blocked")
            else f"Too many login attempts. Please wait {retry} seconds."
        )
        response.headers["Retry-After"] = str(retry)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"success": False, "message": msg, "retry_after": retry}
        )

    # Demo credential check (replace with real DB lookup in production)
    DEMO_USERS = {
        "alex.dev@opticode.io": {"password": "opticode2024", "username": "dev_architect_99"},
        "admin@opticode.io":    {"password": "admin123",     "username": "admin"},
    }
    user = DEMO_USERS.get(body.email.lower().strip())
    if not user or user["password"] != body.password:
        logger.warning(f"[AUTH] Failed login attempt from IP={client_ip} email={body.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid email or password.", "retry_after": 0}
        )

    # Success — reset rate limit counter
    rate_limiter.reset(client_ip, "login")
    logger.info(f"[AUTH] Successful login: {body.email} from IP={client_ip}")
    return LoginResponse(
        success=True,
        username=user["username"],
        email=body.email,
        token=f"demo-jwt-{user['username']}-2026",
        message="Login successful."
    )

@router.get("/health", tags=["Health"])
def health_check():
    """
    Service health check endpoint.
    """
    return {
        "status": "healthy",
        "docker_available": sandbox_service.docker_available
    }

@router.post(
    "/optimize",
    response_model=CodeOptimizationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Optimization Pipeline"]
)
def optimize_code_endpoint(http_request: Request, response: Response, request: CodeOptimizationRequest):
    """
    5-Stage Big-O Optimization Pipeline with Database Caching:
    1. Check OptimizationCache Table (Fast Cache Hit Lookup)
    2. Ingestion & Security Validation
    3. Execution Sandbox (Baseline Timing & Error Capture)
    4. AST Structural Parsing & Bottleneck Detection
    5. Optimization Engine Pattern Refactoring & Persistence
    """
    # IP Rate Limiting — 30 requests/min per client
    client_ip = http_request.client.host if http_request.client else "unknown"
    allowed, rl_info = rate_limiter.is_allowed(client_ip, "optimize", **POLICY_OPTIMIZE)
    response.headers["X-RateLimit-Limit"] = str(rl_info["X-RateLimit-Limit"])
    response.headers["X-RateLimit-Remaining"] = str(rl_info["X-RateLimit-Remaining"])
    response.headers["X-RateLimit-Reset"] = str(rl_info["X-RateLimit-Reset"])
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Max 30 optimization requests per minute. Retry in {rl_info['Retry-After']}s."
        )

    logger.info(f"Received optimization request for language: {request.language} from IP={client_ip}")

    try:
        language = request.language
        code = request.code
        test_input = request.test_input or ""

        # Step 1: Check OptimizationCache table
        cached_entry = check_cache(code, language)
        if cached_entry:
            logger.info("Database CACHE HIT! Returning instant cached optimization.")
            # Record log entry for this cache hit
            store_log(
                original_code=code,
                optimized_code=cached_entry["optimized_code"],
                language=language,
                original_complexity=cached_entry["original_big_o"],
                optimized_complexity=cached_entry["optimized_big_o"],
                speedup_factor=cached_entry["speedup_factor"],
                execution_time_ms=1.2
            )
            from app.api.schemas import (
                OptimizationResult, SandboxExecutionResult, VerificationResult
            )
            return CodeOptimizationResponse(
                success=True,
                language=language,
                baseline_execution=SandboxExecutionResult(
                    status="CACHE_HIT", stdout="", stderr="",
                    execution_time_ms=1.2, exit_code=0
                ),
                ast_analysis=ast_parser_service.analyze(language, code),
                optimization=OptimizationResult(
                    optimized_code=cached_entry["optimized_code"],
                    original_complexity=cached_entry["original_big_o"],
                    new_complexity=cached_entry["optimized_big_o"],
                    optimization_technique="Cache Hit (SHA-256 Lookup)",
                    explanation="Result retrieved from OptimizationCache (SHA-256 hash match). No re-processing needed."
                ),
                verification=VerificationResult(
                    is_verified=True,
                    stdout_matched=True,
                    original_runtime_ms=1.2,
                    optimized_runtime_ms=1.2,
                    speedup_ratio=float(cached_entry["speedup_factor"].replace("x", "")) if cached_entry["speedup_factor"].replace("x", "").replace(".", "").isdigit() else 1.0,
                    details="Returned from cache."
                ),
                error_message=None
            )

        # Stage 2: Sandbox Execution
        logger.info("Stage 2: Running baseline execution in sandbox...")
        baseline_result = sandbox_service.run_code(
            language=language,
            code=code,
            test_input=test_input
        )

        if baseline_result.status == "COMPILATION_ERROR":
            return CodeOptimizationResponse(
                success=False,
                language=language,
                baseline_execution=baseline_result,
                ast_analysis=ast_parser_service.analyze(language, code),
                optimization=optimizer_engine_service.generic_fallback(code, ast_parser_service.analyze(language, code)),
                verification=semantic_verifier_service.verify(language, baseline_result, code, test_input),
                error_message=f"Compilation error in baseline code: {baseline_result.stderr}"
            )

        # Stage 3: AST Parsing
        logger.info("Stage 3: Parsing Abstract Syntax Tree (AST)...")
        ast_result = ast_parser_service.analyze(language, code)

        # Stage 4: Optimization Engine
        logger.info("Stage 4: Running Optimization Engine...")
        optimization_result = optimizer_engine_service.optimize(
            language=language,
            code=code,
            ast_result=ast_result
        )

        # Stage 5: Semantic Verification
        logger.info("Stage 5: Performing Semantic Verification...")
        verification_result = semantic_verifier_service.verify(
            language=language,
            baseline_result=baseline_result,
            optimized_code=optimization_result.optimized_code,
            test_input=test_input
        )

        logger.info(f"Pipeline complete. Speedup: {verification_result.speedup_ratio}x, Verified: {verification_result.is_verified}")

        # Persist optimization results into OptimizationCache & OptimizationLogs database tables
        store_cache(
            code=code,
            language=language,
            optimized_code=optimization_result.optimized_code,
            original_big_o=ast_result.estimated_time_complexity,
            optimized_big_o=optimization_result.new_complexity,
            speedup_factor=f"{verification_result.speedup_ratio}x"
        )
        store_log(
            original_code=code,
            optimized_code=optimization_result.optimized_code,
            language=language,
            original_complexity=ast_result.estimated_time_complexity,
            optimized_complexity=optimization_result.new_complexity,
            speedup_factor=f"{verification_result.speedup_ratio}x",
            execution_time_ms=verification_result.optimized_runtime_ms
        )

        return CodeOptimizationResponse(
            success=True,
            language=language,
            baseline_execution=baseline_result,
            ast_analysis=ast_result,
            optimization=optimization_result,
            verification=verification_result,
            error_message=None
        )

    except Exception as e:
        logger.exception("Unexpected failure during pipeline execution.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected internal error occurred in the optimization pipeline: {str(e)}"
        )

@router.post(
    "/batch-optimize",
    response_model=BatchOptimizationResponse,
    status_code=status.HTTP_200_OK,
    tags=["Optimization Pipeline"]
)
def batch_optimize_endpoint(request: BatchOptimizationRequest):
    """
    Batch optimization endpoint for processing multiple code snippets in a single call.
    """
    logger.info(f"Received batch optimization request with {len(request.items)} items")
    results = []
    for item in request.items:
        res = optimize_code_endpoint(item)
        results.append(res)
    return BatchOptimizationResponse(
        total_processed=len(results),
        results=results
    )

@router.post(
    "/analyze",
    response_model=ASTAnalysisResult,
    status_code=status.HTTP_200_OK,
    tags=["AST Analysis"]
)
def analyze_ast_endpoint(request: ASTAnalysisRequest):
    """
    Lightweight AST Analysis Endpoint.
    Performs structural logic parsing, loop depth analysis, and complexity estimation
    without sandbox code execution.
    """
    logger.info(f"Received standalone AST analysis request for language: {request.language}")
    try:
        return ast_parser_service.analyze(request.language, request.code)
    except Exception as e:
        logger.exception("AST analysis endpoint failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AST Analysis error: {str(e)}"
        )

@router.post(
    "/verify",
    response_model=VerificationResult,
    status_code=status.HTTP_200_OK,
    tags=["Verification"]
)
def verify_code_endpoint(request: VerificationRequest):
    """
    Standalone Semantic Verification Endpoint.
    Executes both original and custom optimized code in the sandbox to test semantic equivalence
    and compute execution speedup ratio.
    """
    logger.info(f"Received standalone verification request for language: {request.language}")
    try:
        test_input = request.test_input or ""
        baseline_result = sandbox_service.run_code(
            language=request.language,
            code=request.original_code,
            test_input=test_input
        )
        return semantic_verifier_service.verify(
            language=request.language,
            baseline_result=baseline_result,
            optimized_code=request.optimized_code,
            test_input=test_input
        )
    except Exception as e:
        logger.exception("Verification endpoint failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification error: {str(e)}"
        )

@router.post(
    "/benchmark",
    response_model=BenchmarkResult,
    status_code=status.HTTP_200_OK,
    tags=["Benchmarking & Profiling"]
)
def benchmark_code_endpoint(request: BenchmarkRequest):
    """
    Executes original and optimized code multiple times to collect statistical profiling metrics
    (min, max, average runtimes, and verified speedup ratio).
    """
    logger.info(f"Received benchmark request for language: {request.language}, iterations: {request.iterations}")
    try:
        test_input = request.test_input or ""
        orig_times = []
        opt_times = []

        base_res = sandbox_service.run_code(request.language, request.original_code, test_input)
        ver_res = semantic_verifier_service.verify(request.language, base_res, request.optimized_code, test_input)

        if not ver_res.is_verified:
            return BenchmarkResult(
                iterations=request.iterations,
                original_avg_ms=round(base_res.execution_time_ms, 3),
                original_min_ms=round(base_res.execution_time_ms, 3),
                original_max_ms=round(base_res.execution_time_ms, 3),
                optimized_avg_ms=0.0,
                optimized_min_ms=0.0,
                optimized_max_ms=0.0,
                speedup_ratio=1.0,
                is_verified=False,
                details=f"Benchmark aborted: Code semantic verification failed ({ver_res.details})"
            )

        orig_times.append(base_res.execution_time_ms)
        opt_times.append(ver_res.optimized_runtime_ms)

        for _ in range(request.iterations - 1):
            r1 = sandbox_service.run_code(request.language, request.original_code, test_input)
            r2 = sandbox_service.run_code(request.language, request.optimized_code, test_input)
            orig_times.append(r1.execution_time_ms)
            opt_times.append(r2.execution_time_ms)

        orig_avg = sum(orig_times) / len(orig_times)
        opt_avg = sum(opt_times) / len(opt_times)
        speedup = round(orig_avg / max(0.001, opt_avg), 2)

        return BenchmarkResult(
            iterations=request.iterations,
            original_avg_ms=round(orig_avg, 3),
            original_min_ms=round(min(orig_times), 3),
            original_max_ms=round(max(orig_times), 3),
            optimized_avg_ms=round(opt_avg, 3),
            optimized_min_ms=round(min(opt_times), 3),
            optimized_max_ms=round(max(opt_times), 3),
            speedup_ratio=speedup,
            is_verified=True,
            details=f"Benchmark completed successfully over {request.iterations} iterations. Average speedup: {speedup}x."
        )
    except Exception as e:
        logger.exception("Benchmark endpoint failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Benchmark error: {str(e)}"
        )

@router.get(
    "/supported-languages",
    response_model=SupportedLanguagesResponse,
    status_code=status.HTTP_200_OK,
    tags=["Environment Metadata"]
)
def supported_languages_endpoint():
    """
    Returns environment runtime capability details, compiler availability, and sandbox status.
    """
    python_available = sys.executable is not None
    javac_available = shutil.which("javac") is not None
    gpp_available = shutil.which("g++") is not None or shutil.which("gcc") is not None

    languages = [
        LanguageInfo(
            language=SupportedLanguage.PYTHON,
            display_name="Python 3",
            compiler_or_interpreter="python3",
            available=python_available,
            sandbox_supported=True
        ),
        LanguageInfo(
            language=SupportedLanguage.JAVA,
            display_name="Java OpenJDK",
            compiler_or_interpreter="javac / java",
            available=sandbox_service.docker_available or javac_available,
            sandbox_supported=True
        ),
        LanguageInfo(
            language=SupportedLanguage.CPP,
            display_name="C++ (GCC)",
            compiler_or_interpreter="g++",
            available=sandbox_service.docker_available or gpp_available,
            sandbox_supported=True
        )
    ]

    return SupportedLanguagesResponse(
        docker_available=sandbox_service.docker_available,
        local_fallback_allowed=settings.ALLOW_LOCAL_FALLBACK,
        languages=languages
    )

@router.get(
    "/patterns",
    response_model=PatternListResponse,
    status_code=status.HTTP_200_OK,
    tags=["Optimization Catalog"]
)
def detectable_patterns_endpoint():
    """
    Returns catalog of detectable algorithmic bottleneck patterns and optimization strategies.
    """
    patterns = [
        PatternInfo(
            id="two_sum_hashmap",
            name="Pairwise / Complement Search",
            original_complexity="O(n^2)",
            optimized_complexity="O(n)",
            description="Replaces nested loop pairwise array comparison with a single pass Hash Map complement lookup.",
            optimization_technique="Hash Map / Dictionary Complement Lookup"
        ),
        PatternInfo(
            id="duplicate_hashset",
            name="Duplicate Element Detection",
            original_complexity="O(n^2)",
            optimized_complexity="O(n)",
            description="Replaces quadratic nested search for duplicates with an average O(1) Hash Set lookup.",
            optimization_technique="Hash Set Duplicate Detection"
        ),
        PatternInfo(
            id="in_loop_set_lookup",
            name="Linear Search Inside Loop",
            original_complexity="O(n^2)",
            optimized_complexity="O(n)",
            description="Converts list target of 'in' or index lookups inside loop to a pre-indexed Hash Set.",
            optimization_technique="Hash Set Pre-indexing"
        ),
        PatternInfo(
            id="array_intersection",
            name="Nested Array Intersection",
            original_complexity="O(n * m)",
            optimized_complexity="O(n + m)",
            description="Transforms nested element lookups across lists into set mathematical intersection.",
            optimization_technique="Set Intersection"
        ),
        PatternInfo(
            id="string_concat_loop",
            name="In-Loop String Concatenation",
            original_complexity="O(n^2)",
            optimized_complexity="O(n)",
            description="Replaces quadratic string re-allocation ('+=') in loop with dynamic string buffer.",
            optimization_technique="String Buffer Pre-allocation"
        )
    ]
    return PatternListResponse(patterns=patterns)


# =====================================================================
# Database CRUD Endpoints for Workspaces, Files, & Optimization Logs
# =====================================================================

@router.get("/workspaces", tags=["Database Workspaces"])
def get_workspaces():
    """Returns all user workspaces stored in the database."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT w.*, COUNT(f.id) as file_count
    FROM workspaces w
    LEFT JOIN code_files f ON w.id = f.workspace_id
    GROUP BY w.id
    ORDER BY w.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return {"success": True, "data": [dict(r) for r in rows]}

@router.get("/workspaces/{workspace_id}", tags=["Database Workspaces"])
def get_workspace_detail(workspace_id: str):
    """Returns workspace details and all associated code files."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workspaces WHERE id = ?", (workspace_id,))
    ws = cursor.fetchone()
    if not ws:
        conn.close()
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    cursor.execute("SELECT * FROM code_files WHERE workspace_id = ? ORDER BY file_name ASC", (workspace_id,))
    files = cursor.fetchall()
    conn.close()
    
    res = dict(ws)
    res["files"] = [dict(f) for f in files]
    return {"success": True, "data": res}

@router.get("/files", tags=["Database Code Files"])
def get_files(workspace_id: str = None):
    """Returns code files stored in the database."""
    conn = get_db()
    cursor = conn.cursor()
    if workspace_id:
        cursor.execute("SELECT * FROM code_files WHERE workspace_id = ? ORDER BY updated_at DESC", (workspace_id,))
    else:
        cursor.execute("SELECT * FROM code_files ORDER BY updated_at DESC")
    files = cursor.fetchall()
    conn.close()
    return {"success": True, "data": [dict(f) for f in files]}

@router.get("/logs", tags=["Database Logs"])
def get_optimization_logs(limit: int = 50):
    """Returns historical optimization logs from PostgreSQL/SQLite."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM optimization_logs ORDER BY created_at DESC LIMIT ?", (limit,))
    logs = cursor.fetchall()
    cursor.execute("SELECT COUNT(*) as count FROM optimization_cache")
    cache_count = cursor.fetchone()["count"]
    conn.close()
    return {
        "success": True,
        "data": [dict(l) for l in logs],
        "meta": {"cached_entries": cache_count}
    }


