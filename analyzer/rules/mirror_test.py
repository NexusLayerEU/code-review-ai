import re
from typing import Any

from .base import BaseRule


class SpecFreeTestRule(BaseRule):
    rule_id = "AI_M2_SPEC_FREE"
    category = "MIRROR_TEST"
    default_severity = "MEDIUM"

    RELATIONAL: list[str] = [
        r"toBeDefined", r"toBeNull", r"toBeUndefined", r"toBeTruthy", r"toBeFalsy",
        r"assertNotNull", r"assertNull", r"assertTrue", r"assertFalse",
        r"isNotNull\(\)", r"isNull\(\)", r"isPresent\(\)", r"isEmpty\(\)",
    ]
    LITERAL: list[str] = [r'"[^"]{2,}"', r"'[^']{2,}'", r"\b\d{2,}\b"]

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        test_fns: list[dict[str, Any]] = ctx["ast_info"].get("test_functions", [])
        code = ctx["code"]
        code_lines = code.split("\n")
        n = len(code_lines)
        for fn in test_fns:
            start = fn["line"]
            # Guard against out-of-range slice
            body = "\n".join(code_lines[start : min(n, start + 30)])
            rel_count = sum(1 for p in self.RELATIONAL if re.search(p, body))
            lit_count = sum(1 for p in self.LITERAL if re.search(p, body))
            if rel_count > 0 and lit_count == 0:
                findings.append(
                    self._finding(
                        line_start=fn["line"],
                        description=(
                            f"Test '{fn['name']}' uses only relational assertions "
                            "with no specific expected values"
                        ),
                        suggestion=(
                            "Assert specific expected values (strings, numbers, objects) "
                            "not just 'is not null' or 'is true'"
                        ),
                        evidence=fn["text"],
                    )
                )
        return findings


class HappyPathOnlyRule(BaseRule):
    rule_id = "AI_M3_HAPPY_PATH"
    category = "MIRROR_TEST"
    default_severity = "MEDIUM"

    ERROR_PATTERNS: list[str] = [
        r"assertThrows", r"pytest\.raises", r"shouldThrow", r"toThrow",
        r"\bnull\b", r"\bnone\b", r'""', r"empty", r"-1\b",
    ]

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        test_fns: list[dict[str, Any]] = ctx["ast_info"].get("test_functions", [])
        if len(test_fns) < 3:
            return []
        code: str = ctx["code"]
        error_count = sum(
            1 for p in self.ERROR_PATTERNS if re.search(p, code, re.IGNORECASE)
        )
        ratio = error_count / max(len(test_fns), 1)
        if ratio < 0.1:
            return [
                self._finding(
                    description=(
                        f"Test suite has {len(test_fns)} tests but no error or edge-case coverage"
                    ),
                    suggestion=(
                        "Add tests for null inputs, empty collections, boundary values, "
                        "and exception paths"
                    ),
                )
            ]
        return []


class TautologyTestRule(BaseRule):
    rule_id = "AI_M1_TAUTOLOGY"
    category = "MIRROR_TEST"
    default_severity = "HIGH"

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        for i, line in enumerate(ctx["code"].split("\n")):
            if re.search(
                r"assertEquals\s*\(\s*(\w+)\s*\(([^)]+)\)\s*,\s*\1\s*\(\2\s*\)", line
            ):
                findings.append(
                    self._finding(
                        line_start=i + 1,
                        description=(
                            "Tautological test: asserts result equals calling "
                            "the same function again"
                        ),
                        suggestion=(
                            "Assert against a hardcoded expected value, "
                            "not the function's own output"
                        ),
                        evidence=line.strip(),
                    )
                )
        return findings


class MockOveruseRule(BaseRule):
    rule_id = "AI_M4_MOCK_OVERUSE"
    category = "MIRROR_TEST"
    # LOW severity — mock-heavy tests are common and not always wrong
    default_severity = "LOW"

    # A test is flagged when it has more mocks than meaningful assertions.
    # Threshold: meaningful_asserts < mock_count // 2 means you need at least
    # one real assertion per two mocks — intentionally lenient to avoid noise.
    MOCK_PATTERNS: list[str] = [
        r"\bwhen\(", r"\bMockito\.", r"\bspy\(", r"@Mock\b", r"\.mock\(", r"jest\.fn\(",
    ]
    ASSERT_PATTERNS: list[str] = [
        r"\bassert", r"\.verify\(", r"\.expect\(", r"assertEquals", r"assertTrue",
    ]
    CALL_ASSERTS: list[str] = [r"toHaveBeenCalled", r"verify\(", r"times\("]

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        test_fns: list[dict[str, Any]] = ctx["ast_info"].get("test_functions", [])
        code = ctx["code"]
        code_lines = code.split("\n")
        n = len(code_lines)
        for fn in test_fns:
            start = fn["line"]
            body = "\n".join(code_lines[start : min(n, start + 40)])
            mock_count = sum(1 for p in self.MOCK_PATTERNS if re.search(p, body))
            assert_count = sum(1 for p in self.ASSERT_PATTERNS if re.search(p, body))
            call_assert_count = sum(1 for p in self.CALL_ASSERTS if re.search(p, body))
            meaningful_asserts = max(0, assert_count - call_assert_count)
            # Only flag when there are at least 2 mocks to avoid trivial false positives
            if mock_count >= 2 and meaningful_asserts < mock_count // 2:
                findings.append(
                    self._finding(
                        line_start=fn["line"],
                        description=(
                            f"Test '{fn['name']}' has {mock_count} mocks but only "
                            f"{meaningful_asserts} meaningful assertions"
                        ),
                        suggestion="Reduce mocks or add assertions about actual output values",
                        evidence=fn["text"],
                    )
                )
        return findings
