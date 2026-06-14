import re
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

LANG_MAP: dict[str, str] = {
    "java": "java",
    "python": "python",
    "typescript": "typescript",
    "javascript": "javascript",
}

# True when tree-sitter-languages is available; False for regex-only mode.
_TS_AVAILABLE = False
try:
    from tree_sitter_languages import get_parser as _get_ts_parser  # noqa: F401
    _TS_AVAILABLE = True
except Exception:
    logger.warning(
        "tree_sitter_languages not available — falling back to regex-only parsing"
    )


class TreeSitterParser:
    """
    Light AST parser that uses tree-sitter when available and falls back
    to regex heuristics when the native library is absent.
    """

    __slots__ = ("language", "parser")

    def __init__(self, language: str) -> None:
        self.language: str = language.lower()
        self.parser: Optional[Any] = None
        if _TS_AVAILABLE:
            try:
                lang_key = LANG_MAP.get(self.language, "python")
                from tree_sitter_languages import get_parser as _get_ts_parser
                self.parser = _get_ts_parser(lang_key)
            except Exception as exc:
                logger.warning(
                    "Could not load tree-sitter parser for %s: %s — using regex fallback",
                    self.language,
                    exc,
                )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse(self, code: str) -> dict[str, list[dict[str, Any]]]:
        return {
            "imports": self._extract_imports(code),
            "functions": self._extract_functions(code),
            "test_functions": self._extract_test_functions(code),
            "try_catch_blocks": self._extract_try_catch(code),
            "classes": self._extract_classes(code),
        }

    # ------------------------------------------------------------------
    # Private extraction helpers
    # ------------------------------------------------------------------

    def _extract_imports(self, code: str) -> list[dict[str, Any]]:
        imports: list[dict[str, Any]] = []
        for i, line in enumerate(code.split("\n")):
            s = line.strip()
            if s.startswith("import ") or s.startswith("from "):
                imports.append({"line": i + 1, "text": s})
        return imports

    def _extract_functions(self, code: str) -> list[dict[str, Any]]:
        fns: list[dict[str, Any]] = []
        lines = code.split("\n")
        for i, line in enumerate(lines):
            s = line.strip()
            is_fn = (
                re.search(r"\bdef\s+\w+\s*\(", s)
                or re.search(r"\b(?:public|private|protected|static)\b.+\w+\s*\(", s)
                or re.search(r"\bfunction\s+\w+\s*\(", s)
            )
            if is_fn:
                m = re.search(
                    r"(?:def\s+|function\s+|(?:public|private|protected|static)\s+(?:\w+\s+)+)(\w+)\s*\(",
                    s,
                )
                name = m.group(1) if m else f"fn_{i}"
                fns.append({"name": name, "line": i + 1, "text": s})
        return fns

    def _extract_test_functions(self, code: str) -> list[dict[str, Any]]:
        return [f for f in self._extract_functions(code) if self._is_test(f["name"])]

    def _is_test(self, name: str) -> bool:
        n = name.lower()
        return n.startswith("test") or n.endswith("test") or "test_" in n or n.startswith("should")

    def _extract_try_catch(self, code: str) -> list[dict[str, Any]]:
        blocks: list[dict[str, Any]] = []
        lines = code.split("\n")
        n = len(lines)
        i = 0
        while i < n:
            s = lines[i].strip()
            is_catch = (
                re.search(r"\}\s*catch\s*\(", s)
                or re.search(r"catch\s*\(", s)
                or re.search(r"except\s+", s)
                or re.search(r"except:", s)
            )
            if is_catch:
                catch_start = i + 1
                body: list[str] = []
                j = i + 1
                depth = 1 if "{" in s else 0
                while j < n and j < i + 30:
                    ls = lines[j].strip()
                    depth += ls.count("{") - ls.count("}")
                    if depth <= 0 and "{" in s:
                        # brace-based language — stop when block closes
                        break
                    body.append(ls)
                    j += 1
                blocks.append({"start": catch_start, "end": j, "body": body})
            i += 1
        return blocks

    def _extract_classes(self, code: str) -> list[dict[str, Any]]:
        classes: list[dict[str, Any]] = []
        for i, line in enumerate(code.split("\n")):
            s = line.strip()
            if (
                re.search(r"\b(?:class|interface)\b\s+\w+", s)
                and not s.startswith("//")
                and not s.startswith("#")
            ):
                m = re.search(r"(?:class|interface)\s+(\w+)", s)
                name = m.group(1) if m else f"cls_{i}"
                classes.append({"name": name, "line": i + 1})
        return classes
