import re
from typing import Any

from .base import BaseRule


class DeadImportRule(BaseRule):
    rule_id = "AI_D3_DEAD_IMPORT"
    category = "DEAD_REPLICA"
    default_severity = "LOW"
    default_confidence = "HIGH"

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        imports: list[dict[str, Any]] = ctx["ast_info"].get("imports", [])
        code: str = ctx["code"]
        lines = code.split("\n")
        for imp in imports:
            sym = self._extract_symbol(imp["text"], ctx["language"])
            if not sym or "*" in sym:
                continue
            # Build the file body without the import line itself
            body = "\n".join(
                line for i, line in enumerate(lines) if i + 1 != imp["line"]
            )
            if not re.search(r"\b" + re.escape(sym) + r"\b", body):
                findings.append(
                    self._finding(
                        line_start=imp["line"],
                        description=f"Import '{sym}' is never used in this file",
                        suggestion=f"Remove unused import: {imp['text']}",
                        evidence=imp["text"],
                    )
                )
        return findings

    def _extract_symbol(self, import_text: str, language: str) -> str:
        if language == "python":
            m = re.search(r"import (\w+)$", import_text) or re.search(
                r"from .+ import (\w+)", import_text
            )
            return m.group(1) if m else ""
        if language in ("typescript", "javascript"):
            m = re.search(r"import (?:\{\s*)?(\w+)", import_text)
            return m.group(1) if m else ""
        if language == "java":
            m = re.search(r"import (?:static )?(?:[\w.]+\.)(\w+);", import_text)
            return m.group(1) if m else ""
        return ""


class DuplicationRule(BaseRule):
    rule_id = "AI_D1_DUPLICATION"
    category = "DEAD_REPLICA"
    default_severity = "MEDIUM"
    default_confidence = "LOW"

    # Minimum token-set size to consider a function body meaningful
    _MIN_TOKENS = 10
    # Jaccard similarity threshold above which two functions are flagged
    _SIMILARITY_THRESHOLD = 0.85

    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        fns: list[dict[str, Any]] = ctx["ast_info"].get("functions", [])
        if len(fns) < 2:
            return findings

        code_lines = ctx["code"].split("\n")
        n = len(code_lines)
        fn_bodies: list[tuple[dict[str, Any], set[str]]] = []
        for fn in fns:
            start = fn["line"]
            body = "\n".join(code_lines[start : min(n, start + 25)])
            tokens: set[str] = set(re.findall(r"\b\w+\b", body))
            fn_bodies.append((fn, tokens))

        for i in range(len(fn_bodies)):
            for j in range(i + 1, len(fn_bodies)):
                fn_a, toks_a = fn_bodies[i]
                fn_b, toks_b = fn_bodies[j]
                if len(toks_a) < self._MIN_TOKENS or len(toks_b) < self._MIN_TOKENS:
                    continue
                union = toks_a | toks_b
                # Guard against empty union (shouldn't happen given the min-token
                # check above, but be defensive)
                if not union:
                    continue
                intersection = toks_a & toks_b
                similarity = len(intersection) / len(union)
                if similarity > self._SIMILARITY_THRESHOLD:
                    findings.append(
                        self._finding(
                            line_start=fn_a["line"],
                            description=(
                                f"Function '{fn_a['name']}' appears highly similar to "
                                f"'{fn_b['name']}' ({int(similarity * 100)}% token overlap)"
                            ),
                            suggestion="Extract shared logic into a common function",
                            evidence=fn_a["text"],
                        )
                    )
        return findings
