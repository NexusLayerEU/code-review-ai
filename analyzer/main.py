import logging
import logging.config

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any

from parser.tree_sitter_parser import TreeSitterParser
from rules.ghost_handling import SwallowedExceptionRule, OptimisticAsyncRule
from rules.mirror_test import SpecFreeTestRule, HappyPathOnlyRule, TautologyTestRule, MockOveruseRule
from rules.dead_replica import DeadImportRule, DuplicationRule

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="AgentReview Static Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_CODE_BYTES = 100_000  # 100 KB — prevent OOM on huge payloads

# ---------------------------------------------------------------------------
# Rules registry
# ---------------------------------------------------------------------------
RULES = [
    SwallowedExceptionRule(),
    OptimisticAsyncRule(),
    SpecFreeTestRule(),
    HappyPathOnlyRule(),
    TautologyTestRule(),
    MockOveruseRule(),
    DeadImportRule(),
    DuplicationRule(),
]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    code: str
    language: str
    task_description: Optional[str] = None
    dependencies: dict[str, str] = {}
    file_path: Optional[str] = None


class FindingOut(BaseModel):
    rule_id: str
    category: str
    severity: str
    confidence: str
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    description: str
    suggestion: Optional[str] = None
    evidence: Optional[str] = None


class RuleInfo(BaseModel):
    rule_id: str
    category: str
    default_severity: str
    default_confidence: str
    supported_languages: list[str]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/rules", response_model=list[RuleInfo])
def list_rules() -> list[dict[str, Any]]:
    """List all available rules and their metadata."""
    return [
        {
            "rule_id": rule.rule_id,
            "category": rule.category,
            "default_severity": rule.default_severity,
            "default_confidence": rule.default_confidence,
            "supported_languages": rule.supported_languages,
        }
        for rule in RULES
    ]


@app.post("/analyze", response_model=list[FindingOut])
async def analyze(request: AnalyzeRequest) -> list[FindingOut]:
    # --- Input validation ---
    if not request.code or not request.code.strip():
        logger.info("Received empty code payload — returning early")
        return []

    if len(request.code.encode("utf-8")) > MAX_CODE_BYTES:
        logger.warning(
            "Code payload exceeds %d bytes, truncating before analysis", MAX_CODE_BYTES
        )
        # Truncate to MAX_CODE_BYTES characters (safe approximation)
        request = request.model_copy(
            update={"code": request.code[: MAX_CODE_BYTES]}
        )

    try:
        parser = TreeSitterParser(request.language)
        ast_info = parser.parse(request.code)
        findings: list[dict[str, Any]] = []
        ctx: dict[str, Any] = {
            "code": request.code,
            "language": request.language,
            "ast_info": ast_info,
            "task_description": request.task_description,
            "dependencies": request.dependencies,
            "file_path": request.file_path,
        }
        for rule in RULES:
            if rule.supports_language(request.language):
                try:
                    rule_findings = rule.analyze(ctx)
                    findings.extend(rule_findings)
                except Exception as exc:
                    logger.warning(
                        "Rule %s raised an exception and was skipped: %s",
                        rule.rule_id,
                        exc,
                        exc_info=True,
                    )
        logger.info(
            "Analysis complete: language=%s findings=%d file=%s",
            request.language,
            len(findings),
            request.file_path or "<inline>",
        )
        return findings
    except Exception as exc:
        logger.error("Analysis pipeline failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
