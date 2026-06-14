import re
from typing import Any

from .base import BaseRule


class SwallowedExceptionRule(BaseRule):
    rule_id = "AI_G1_SWALLOWED"
    category = "GHOST_HANDLING"
    default_severity = "HIGH"

    LOG_PATTERNS: list[str] = [
        r"log\.(error|warn|info|debug)",
        r"System\.out\.print",
        r"console\.(log|error|warn)",
        r"print\(",
        r"logger\.",
        r"LOG\.",
    ]
    PROPAGATION_PATTERNS: list[str] = [
        r"\bthrow\b",
        r"\breturn\b",
        r"\.fail\(",
        r"\.setError\(",
    ]

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        blocks: list[dict[str, Any]] = ctx["ast_info"].get("try_catch_blocks", [])
        for block in blocks:
            body_lines: list[str] = block.get("body", [])
            if not body_lines:
                findings.append(
                    self._finding(
                        line_start=block.get("start"),
                        line_end=block.get("end"),
                        description="Empty catch block silently swallows exception",
                        suggestion="At minimum log the exception or rethrow it",
                        evidence="catch { }",
                    )
                )
                continue
            body_text = " ".join(body_lines)
            has_propagation = any(
                re.search(p, body_text) for p in self.PROPAGATION_PATTERNS
            )
            has_log_only = (
                any(re.search(p, body_text) for p in self.LOG_PATTERNS)
                and not has_propagation
            )
            if has_log_only:
                findings.append(
                    self._finding(
                        line_start=block.get("start"),
                        line_end=block.get("end"),
                        description=(
                            "Catch block only logs the exception without rethrowing "
                            "or returning an error"
                        ),
                        suggestion="After logging, rethrow the exception or return an error result",
                        evidence=body_lines[0] if body_lines else None,
                    )
                )
        return findings


class OptimisticAsyncRule(BaseRule):
    rule_id = "AI_G4_OPTIMISTIC_ASYNC"
    category = "GHOST_HANDLING"
    default_severity = "MEDIUM"
    supported_languages = ["typescript", "javascript", "java"]

    ASYNC_PATTERNS: list[str] = [
        r"CompletableFuture\.runAsync",
        r"CompletableFuture\.supplyAsync",
        r"Promise\.all\(",
        r"fetch\(",
    ]
    ERROR_PATTERNS: list[str] = [
        r"\.exceptionally\(",
        r"\.handle\(",
        r"\.whenComplete\(",
        r"\.catch\(",
        r"try\s*\{",
    ]

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        code: str = ctx["code"]
        lines = code.split("\n")
        n = len(lines)
        for i, line in enumerate(lines):
            for ap in self.ASYNC_PATTERNS:
                if re.search(ap, line):
                    window_start = max(0, i - 1)
                    window_end = min(n, i + 6)
                    window = "\n".join(lines[window_start:window_end])
                    has_handler = any(
                        re.search(ep, window) for ep in self.ERROR_PATTERNS
                    )
                    if not has_handler:
                        findings.append(
                            self._finding(
                                line_start=i + 1,
                                description="Async operation has no error handler",
                                suggestion="Add .exceptionally() / .catch() or wrap in try/catch",
                                evidence=line.strip(),
                            )
                        )
                    break
        return findings
