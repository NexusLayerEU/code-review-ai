from abc import ABC, abstractmethod
from typing import Any, Optional


class BaseRule(ABC):
    rule_id: str = ""
    category: str = ""
    default_severity: str = "MEDIUM"
    default_confidence: str = "MEDIUM"
    supported_languages: list[str] = ["python", "typescript", "javascript", "java"]

    def supports_language(self, language: str) -> bool:
        return language.lower() in self.supported_languages

    @abstractmethod
    def analyze(self, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        pass

    def _finding(
        self,
        line_start: Optional[int] = None,
        line_end: Optional[int] = None,
        description: str = "",
        suggestion: Optional[str] = None,
        evidence: Optional[str] = None,
        severity: Optional[str] = None,
        confidence: Optional[str] = None,
        file_path: Optional[str] = None,
    ) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "category": self.category,
            "severity": severity or self.default_severity,
            "confidence": confidence or self.default_confidence,
            "file_path": file_path,
            "line_start": line_start,
            "line_end": line_end,
            "description": description,
            "suggestion": suggestion,
            "evidence": evidence,
        }
