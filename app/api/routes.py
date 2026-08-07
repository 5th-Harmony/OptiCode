import shutil
import sys
from fastapi import APIRouter, HTTPException, status
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

logger = get_logger("APIRoutes")

router = APIRouter()

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
def optimize_code_endpoint(request: CodeOptimizationRequest):
    """
    5-Stage Big-O Optimization Pipeline:
    1. Ingestion & Security Validation
    2. Execution Sandbox (Baseline Timing & Error Capture)
    3. AST Structural Parsing & Bottleneck Detection
    4. Optimization Engine Pattern Refactoring
    5. Semantic Equivalence Verification
    """
    logger.info(f"Received optimization request for language: {request.language}")

    try:
        language = request.language
        code = request.code
        test_input = request.test_input or ""

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

