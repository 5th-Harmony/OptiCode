import re
from app.api.schemas import (
    VerificationResult,
    SandboxExecutionResult,
    SupportedLanguage
)
from app.services.sandbox import sandbox_service
from app.utils.logger import get_logger

logger = get_logger("SemanticVerifierService")

class SemanticVerifierService:
    """
    Stage 5: Semantic Verification Service.
    Runs optimized code in the isolated sandbox, compares stdout/return output against baseline original code execution,
    and computes the verified performance speedup ratio.
    """

    def verify(
        self,
        language: SupportedLanguage,
        baseline_result: SandboxExecutionResult,
        optimized_code: str,
        test_input: str = ""
    ) -> VerificationResult:
        """
        Executes optimized code in sandbox and verifies semantic equivalence with original execution.
        """
        logger.info(f"Running semantic verification for language={language}...")

        # Handle non-successful baseline execution
        if baseline_result.status != "SUCCESS":
            logger.warning(f"Baseline code execution status is non-successful: {baseline_result.status}")
            return VerificationResult(
                is_verified=False,
                stdout_matched=False,
                speedup_ratio=1.0,
                original_runtime_ms=round(baseline_result.execution_time_ms, 3),
                optimized_runtime_ms=0.0,
                details=f"Baseline code execution was not successful (status={baseline_result.status}). Verification skipped."
            )

        # 1. Execute optimized code in sandbox
        optimized_exec_result = sandbox_service.run_code(
            language=language,
            code=optimized_code,
            test_input=test_input
        )

        # Handle compilation or execution failures in optimized code
        if optimized_exec_result.status != "SUCCESS":
            logger.warning(f"Optimized code failed verification execution with status={optimized_exec_result.status}")
            return VerificationResult(
                is_verified=False,
                stdout_matched=False,
                speedup_ratio=1.0,
                original_runtime_ms=round(baseline_result.execution_time_ms, 3),
                optimized_runtime_ms=round(optimized_exec_result.execution_time_ms, 3),
                details=f"Optimized code failed execution in sandbox: status={optimized_exec_result.status}, stderr={optimized_exec_result.stderr}"
            )

        # 2. Normalize and compare outputs (ignoring trivial trailing whitespace differences)
        baseline_out = baseline_result.stdout.strip()
        optimized_out = optimized_exec_result.stdout.strip()

        stdout_matched = (baseline_out == optimized_out)

        # 3. Calculate speedup ratio (T_orig / T_opt)
        orig_ms = max(0.001, baseline_result.execution_time_ms)
        opt_ms = max(0.001, optimized_exec_result.execution_time_ms)
        speedup_ratio = round(orig_ms / opt_ms, 2)

        # Semantic verification decision logic
        if stdout_matched:
            is_verified = True
            details = f"Semantic verification successful! Outputs match exactly. Speedup ratio: {speedup_ratio}x."
        else:
            # Check if outputs are semantically equivalent
            is_semantic_match = self._are_semantically_equivalent(baseline_out, optimized_out)

            if is_semantic_match:
                is_verified = True
                details = f"Semantic verification successful! Outputs are semantically equivalent. Speedup ratio: {speedup_ratio}x."
            else:
                is_verified = False
                details = (
                    f"Output mismatch detected between original and optimized version. "
                    f"Original output: '{baseline_out[:100]}', Optimized output: '{optimized_out[:100]}'"
                )

        return VerificationResult(
            is_verified=is_verified,
            stdout_matched=stdout_matched,
            speedup_ratio=speedup_ratio,
            original_runtime_ms=round(orig_ms, 3),
            optimized_runtime_ms=round(opt_ms, 3),
            details=details
        )

    def _are_semantically_equivalent(self, out1: str, out2: str) -> bool:
        if not out1 and not out2:
            return True
        if not out1 or not out2:
            return False

        if out1 in out2 or out2 in out1:
            return True

        # Strip all non-alphanumeric characters (e.g. parens, brackets, spaces, commas)
        clean1 = re.sub(r'[^\w\d]', '', out1)
        clean2 = re.sub(r'[^\w\d]', '', out2)
        if clean1 == clean2 and len(clean1) > 0:
            return True

        # Extract all numbers and check if sets of numbers match
        nums1 = re.findall(r'\d+', out1)
        nums2 = re.findall(r'\d+', out2)
        if nums1 and nums2 and sorted(nums1) == sorted(nums2):
            return True

        return False

semantic_verifier_service = SemanticVerifierService()
