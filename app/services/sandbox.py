import os
import re
import sys
import time
import tempfile
import subprocess
import shutil
from typing import Tuple
try:
    import docker
    from docker.errors import DockerException, ImageNotFound, APIError
    HAS_DOCKER_LIB = True
except ImportError:
    docker = None
    DockerException = Exception
    ImageNotFound = Exception
    APIError = Exception
    HAS_DOCKER_LIB = False

from app.config import settings
from app.api.schemas import SandboxExecutionResult, SupportedLanguage
from app.utils.logger import get_logger

logger = get_logger("SandboxService")

class ExecutionSandboxService:
    """
    Stage 2: Execution Sandbox Service.
    Spins up isolated containers (or secure subprocess fallbacks) to execute code safely.
    Handles memory limits, CPU quotas, network isolation, and infinite loop timeouts.
    """
    def __init__(self):
        try:
            if HAS_DOCKER_LIB:
                self.docker_client = docker.from_env()
                self.docker_available = True
            else:
                self.docker_client = None
                self.docker_available = False
            logger.info("Docker SDK initialized successfully.")
        except Exception as e:
            self.docker_client = None
            self.docker_available = False
            logger.warning(f"Docker SDK initialization failed ({e}). Will use process sandbox fallback.")

    def run_code(
        self,
        language: SupportedLanguage,
        code: str,
        test_input: str = ""
    ) -> SandboxExecutionResult:
        """
        Executes user code in the isolated sandbox and records timing/output.
        """
        if self.docker_available and settings.SANDBOX_DOCKER_IMAGE:
            try:
                return self._run_in_docker(language, code, test_input)
            except Exception as e:
                logger.error(f"Docker sandbox execution encountered error: {e}. Falling back to local process sandbox.")
                if settings.ALLOW_LOCAL_FALLBACK:
                    return self._run_in_local_process(language, code, test_input)
                raise e
        elif settings.ALLOW_LOCAL_FALLBACK:
            return self._run_in_local_process(language, code, test_input)
        else:
            raise RuntimeError("Docker is unavailable and local process fallback is disabled.")

    def _run_in_docker(
        self,
        language: SupportedLanguage,
        code: str,
        test_input: str
    ) -> SandboxExecutionResult:
        """
        Executes code inside a restricted Docker container.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            cmd, filename = self._prepare_execution_command(language, temp_dir, code)
            
            # Ensure file is world-readable for docker non-root user
            os.chmod(os.path.join(temp_dir, filename), 0o666)

            start_time = time.perf_counter()
            try:
                container = self.docker_client.containers.run(
                    image=settings.SANDBOX_DOCKER_IMAGE,
                    command=f"/bin/bash -c '{cmd}'",
                    volumes={temp_dir: {'bind': '/sandbox', 'mode': 'rw'}},
                    working_dir="/sandbox",
                    network_mode="none",  # Security: Disable all network access
                    mem_limit=settings.SANDBOX_MEMORY_LIMIT,  # Memory restriction (e.g. 128MB)
                    nano_cpus=int(settings.SANDBOX_NCPU * 1e9),  # CPU quota restriction
                    detach=True,
                    user="sandboxuser",
                    stdout=True,
                    stderr=True
                )

                try:
                    # Wait for container execution with strict timeout
                    result = container.wait(timeout=settings.SANDBOX_TIMEOUT_SECONDS)
                    end_time = time.perf_counter()
                    execution_time_ms = (end_time - start_time) * 1000

                    stdout = container.logs(stdout=True, stderr=False).decode('utf-8', errors='replace')
                    stderr = container.logs(stdout=False, stderr=True).decode('utf-8', errors='replace')

                    exit_code = result.get('StatusCode', 0)
                    status = "SUCCESS" if exit_code == 0 else "RUNTIME_ERROR"

                    return SandboxExecutionResult(
                        status=status,
                        stdout=stdout,
                        stderr=stderr,
                        execution_time_ms=execution_time_ms,
                        exit_code=exit_code
                    )
                except Exception as wait_err:
                    # Container timed out (e.g., infinite loop)
                    container.kill()
                    end_time = time.perf_counter()
                    return SandboxExecutionResult(
                        status="TIMEOUT",
                        stdout="",
                        stderr=f"Execution timed out after {settings.SANDBOX_TIMEOUT_SECONDS} seconds (Infinite loop or deadlocks detected).",
                        execution_time_ms=(end_time - start_time) * 1000,
                        exit_code=-1
                    )
                finally:
                    try:
                        container.remove(force=True)
                    except Exception:
                        pass

            except DockerException as de:
                logger.error(f"Docker API Error: {de}")
                raise de

    def _run_in_local_process(
        self,
        language: SupportedLanguage,
        code: str,
        test_input: str
    ) -> SandboxExecutionResult:
        """
        Secure local subprocess fallback with strict timeout and directory isolation.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            if language == SupportedLanguage.PYTHON:
                filepath = os.path.join(temp_dir, "script.py")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(code)
                run_cmd = [sys.executable, filepath]

            elif language == SupportedLanguage.JAVA:
                match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
                class_name = match.group(1) if match else "Main"
                filepath = os.path.join(temp_dir, f"{class_name}.java")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(code)
                try:
                    compile_proc = subprocess.run(
                        ["javac", filepath],
                        cwd=temp_dir,
                        capture_output=True,
                        text=True
                    )
                    if compile_proc.returncode != 0:
                        return SandboxExecutionResult(
                            status="COMPILATION_ERROR",
                            stdout=compile_proc.stdout,
                            stderr=compile_proc.stderr,
                            execution_time_ms=0.0,
                            exit_code=compile_proc.returncode
                        )
                except FileNotFoundError:
                    return SandboxExecutionResult(
                        status="COMPILATION_ERROR",
                        stdout="",
                        stderr="Java compiler 'javac' is not installed or available on system PATH.",
                        execution_time_ms=0.0,
                        exit_code=1
                    )
                run_cmd = ["java", "-cp", temp_dir, class_name]

            elif language == SupportedLanguage.CPP:
                filepath = os.path.join(temp_dir, "solution.cpp")
                out_path = os.path.join(temp_dir, "solution.exe" if os.name == 'nt' else "solution")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(code)
                try:
                    compile_proc = subprocess.run(
                        ["g++", "-O2", filepath, "-o", out_path],
                        cwd=temp_dir,
                        capture_output=True,
                        text=True
                    )
                    if compile_proc.returncode != 0:
                        return SandboxExecutionResult(
                            status="COMPILATION_ERROR",
                            stdout=compile_proc.stdout,
                            stderr=compile_proc.stderr,
                            execution_time_ms=0.0,
                            exit_code=compile_proc.returncode
                        )
                except FileNotFoundError:
                    return SandboxExecutionResult(
                        status="COMPILATION_ERROR",
                        stdout="",
                        stderr="C++ compiler 'g++' is not installed or available on system PATH.",
                        execution_time_ms=0.0,
                        exit_code=1
                    )
                run_cmd = [out_path]
            else:
                raise ValueError(f"Unsupported language: {language}")

            start_time = time.perf_counter()
            try:
                proc = subprocess.run(
                    run_cmd,
                    input=test_input,
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,
                    timeout=settings.SANDBOX_TIMEOUT_SECONDS
                )
                end_time = time.perf_counter()
                execution_time_ms = (end_time - start_time) * 1000

                status = "SUCCESS" if proc.returncode == 0 else "RUNTIME_ERROR"
                return SandboxExecutionResult(
                    status=status,
                    stdout=proc.stdout,
                    stderr=proc.stderr,
                    execution_time_ms=execution_time_ms,
                    exit_code=proc.returncode
                )
            except subprocess.TimeoutExpired:
                end_time = time.perf_counter()
                return SandboxExecutionResult(
                    status="TIMEOUT",
                    stdout="",
                    stderr=f"Execution timed out after {settings.SANDBOX_TIMEOUT_SECONDS}s limit.",
                    execution_time_ms=(end_time - start_time) * 1000,
                    exit_code=-1
                )
            except FileNotFoundError as fnfe:
                return SandboxExecutionResult(
                    status="RUNTIME_ERROR",
                    stdout="",
                    stderr=f"Execution failed: runtime command not found ({fnfe})",
                    execution_time_ms=0.0,
                    exit_code=1
                )

    def _prepare_execution_command(
        self,
        language: SupportedLanguage,
        temp_dir: str,
        code: str
    ) -> Tuple[str, str]:
        """
        Creates source file in directory and constructs single bash command string.
        """
        if language == SupportedLanguage.PYTHON:
            filename = "script.py"
            with open(os.path.join(temp_dir, filename), "w", encoding="utf-8") as f:
                f.write(code)
            return "python3 script.py", filename

        elif language == SupportedLanguage.JAVA:
            match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
            class_name = match.group(1) if match else "Main"
            filename = f"{class_name}.java"
            with open(os.path.join(temp_dir, filename), "w", encoding="utf-8") as f:
                f.write(code)
            return f"javac {filename} && java -cp /sandbox {class_name}", filename

        elif language == SupportedLanguage.CPP:
            filename = "solution.cpp"
            with open(os.path.join(temp_dir, filename), "w", encoding="utf-8") as f:
                f.write(code)
            return "g++ -O2 solution.cpp -o solution && ./solution", filename

        raise ValueError(f"Unsupported language {language}")

sandbox_service = ExecutionSandboxService()
