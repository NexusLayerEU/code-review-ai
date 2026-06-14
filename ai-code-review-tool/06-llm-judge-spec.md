# AgentReview — LLM Judge Layer Specification
## Document 06

---

## Overview

The LLM Judge is Layer 3 of the analysis pipeline. It handles failure modes that require semantic understanding and cannot be detected through static or type analysis alone:

- **Intent Drift** — code doesn't match the task description
- **Confidence Bugs** — plausible but wrong assumptions
- **Semantic Abstraction Smells** — misleading names or hidden logic
- **Ambiguous findings validation** — confirming or rejecting LOW-confidence Layer 1/2 findings

---

## Architecture

```
ReviewOrchestrator
        │
        ▼
  LLMJudgeService
        │
        ├── PromptBuilder          (builds structured prompts per sub-task)
        ├── ClaudeAPIClient        (calls Anthropic API)
        ├── ResponseParser         (parses structured JSON from response)
        └── FindingMerger          (merges LLM findings with L1/L2)
```

---

## LLM Judge Interface

```java
public interface LLMJudge {
    /**
     * Judge the review request using LLM analysis.
     * @param request Original review request (includes task_description)
     * @param priorFindings Findings from Layer 1 and 2
     * @return New findings discovered by LLM analysis
     */
    List<Finding> judge(ReviewRequest request, List<Finding> priorFindings);
}
```

---

## Analysis Sub-Tasks

The LLM is called with **separate, focused prompts** for each sub-task. A single "review everything" prompt produces low-quality results. Focused prompts per concern produce reliable, structured output.

### Sub-Task 1: Intent Alignment Check

**When called:** Always (when mode = full)

**Prompt:**

```
SYSTEM:
You are a code review system specializing in AI-generated code.
Your job is to check whether the provided code correctly implements the stated task.
You are NOT a style critic. You are NOT checking formatting or naming.
You are checking: does the code do what was asked?

Output ONLY valid JSON. No preamble. No explanation. No markdown.

OUTPUT FORMAT:
{
  "aligned": true | false,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "findings": [
    {
      "rule_id": "AI_I1_SCOPE_CREEP" | "AI_I2_REQUIREMENT_INVERSION" | "AI_I3_WRONG_ENTITY" | "AI_I4_PARTIAL_IMPLEMENTATION",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "description": "one sentence describing the mismatch",
      "evidence": "the specific code or lack of code that shows the problem",
      "suggestion": "what should be different"
    }
  ]
}

If the code correctly implements the task, return: {"aligned": true, "confidence": "HIGH", "findings": []}

USER:
## TASK DESCRIPTION
{task_description}

## CODE SUBMITTED FOR REVIEW
Language: {language}

{code}

## PRIOR STATIC/SEMANTIC FINDINGS (for context, do not re-report these)
{prior_findings_summary}

Does the code implement what the task description asks for?
Report ONLY intent alignment issues. Do not report style, optimization, or other concerns.
```

---

### Sub-Task 2: Confidence Bug Detection

**When called:** Always (when mode = full)

**Prompt:**

```
SYSTEM:
You are a code review system specializing in AI-generated code.
AI agents often write code that makes confident assumptions that are wrong.
Your job: find assumptions in the code that are stated as fact but may be wrong.

Focus on:
- Accessing properties/indices without checking if they exist
- Assuming a collection is non-empty before accessing first element
- Assuming a configuration value has a specific default when it may not
- Assuming a specific data shape without validation
- Assuming success of an operation without checking the result

Output ONLY valid JSON. No preamble. No markdown.

OUTPUT FORMAT:
{
  "findings": [
    {
      "rule_id": "AI_C1_MISSING_NULL_GUARD" | "AI_C2_ASSUMED_COLLECTION_SIZE" | "AI_C3_WRONG_DEFAULT" | "AI_C4_SILENT_COERCION",
      "severity": "HIGH" | "MEDIUM",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "line_hint": "approximate line number or null",
      "description": "what assumption is being made",
      "evidence": "the exact code making the assumption",
      "suggestion": "how to guard against the assumption being wrong"
    }
  ]
}

USER:
Language: {language}
{code}

Task context: {task_description}

Find all unguarded assumptions in this code. Report only what you are reasonably confident about.
```

---

### Sub-Task 3: Test Quality Judge

**When called:** When test files are present in the review

**Prompt:**

```
SYSTEM:
You are a code review system evaluating test quality in AI-generated code.
AI agents often generate tests that are structurally present but semantically weak —
they look like tests but don't actually verify correctness.

Your job: determine if the tests would catch bugs in the implementation.
Think like a QA engineer trying to break the code.

Output ONLY valid JSON. No preamble. No markdown.

OUTPUT FORMAT:
{
  "test_quality_score": 0-100,
  "findings": [
    {
      "rule_id": "AI_M1_TAUTOLOGY" | "AI_M2_SPEC_FREE" | "AI_M3_HAPPY_PATH" | "AI_M4_MOCK_OVERUSE",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "test_name": "name of the test function",
      "description": "why this test is weak",
      "missing": "what this test should be checking but isn't",
      "suggestion": "a better test approach"
    }
  ],
  "missing_test_scenarios": [
    "scenario description that has no test coverage"
  ]
}

USER:
## IMPLEMENTATION CODE
Language: {language}
{implementation_code}

## TEST CODE
{test_code}

## TASK DESCRIPTION
{task_description}

Evaluate whether these tests would catch bugs in this implementation.
```

---

### Sub-Task 4: Semantic Abstraction Review

**When called:** When Layer 1 flagged A-category findings OR when file has 3+ classes/interfaces

**Prompt:**

```
SYSTEM:
You are a code review system checking whether code abstractions make semantic sense.
AI agents often create classes and interfaces that look structured but are misleading:
- Names imply one thing, implementation does another
- Utility classes contain business logic
- Layers that exist but add no value

Output ONLY valid JSON. No preamble. No markdown.

OUTPUT FORMAT:
{
  "findings": [
    {
      "rule_id": "AI_A1_SINGLE_USE" | "AI_A2_SEMANTIC_MISMATCH" | "AI_A3_HIDDEN_LOGIC" | "AI_A4_INDIRECTION",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "entity_name": "ClassName or methodName",
      "description": "what is semantically wrong with this abstraction",
      "evidence": "the specific code that is misleading",
      "suggestion": "how to correct the abstraction"
    }
  ]
}

USER:
Language: {language}
{code}

Review the abstractions (classes, interfaces, modules) in this code for semantic correctness.
```

---

### Sub-Task 5: Prior Finding Validation

**When called:** When Layer 1/2 produced LOW-confidence findings

**Prompt:**

```
SYSTEM:
You are validating findings from a static code analysis tool.
The tool found potential issues but is not certain about them.
Your job: for each finding, decide if it is a real issue or a false positive.

Output ONLY valid JSON. No preamble. No markdown.

OUTPUT FORMAT:
{
  "validations": [
    {
      "finding_id": "uuid from input",
      "verdict": "CONFIRMED" | "FALSE_POSITIVE" | "UNCERTAIN",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "reasoning": "one sentence explaining the verdict"
    }
  ]
}

USER:
## CODE
{code}

## FINDINGS TO VALIDATE
{low_confidence_findings_json}

For each finding, determine if it is a real problem or a false positive.
```

---

## Calling Claude API

```java
@Service
public class ClaudeJudgeClient {
    
    private static final String MODEL = "claude-sonnet-4-6";
    private static final int MAX_TOKENS = 4096;
    
    public LLMJudgeResponse call(String systemPrompt, String userPrompt) {
        var requestBody = Map.of(
            "model", MODEL,
            "max_tokens", MAX_TOKENS,
            "system", systemPrompt,
            "messages", List.of(
                Map.of("role", "user", "content", userPrompt)
            )
        );
        
        // Call Anthropic API
        // Parse response content[0].text as JSON
        // Return structured LLMJudgeResponse
    }
}
```

### Token Budget Management

| Sub-Task | Estimated Input Tokens | Max Output Tokens |
|---|---|---|
| Intent Alignment | 500–3000 | 1000 |
| Confidence Bugs | 500–3000 | 1000 |
| Test Quality | 1000–5000 | 1500 |
| Semantic Abstraction | 500–3000 | 1000 |
| Finding Validation | 300–1000 | 500 |

**Rules:**
- If code exceeds 4000 tokens, chunk by file and call per file
- Always send prior findings summary (not full JSON) to save tokens
- Cache LLM findings by hash(code + task_description) with 1-hour TTL

---

## Response Parsing

```java
public class LLMResponseParser {
    
    public List<Finding> parse(String llmResponseText, String subTask) {
        // Strip any markdown fences if present (defensive)
        String cleaned = llmResponseText
            .replaceAll("```json", "")
            .replaceAll("```", "")
            .trim();
        
        JsonNode root = objectMapper.readTree(cleaned);
        
        return switch (subTask) {
            case "INTENT" -> parseIntentFindings(root);
            case "CONFIDENCE" -> parseConfidenceFindings(root);
            case "TEST" -> parseTestFindings(root);
            case "ABSTRACTION" -> parseAbstractionFindings(root);
            case "VALIDATION" -> parseValidationResults(root);
            default -> throw new IllegalArgumentException("Unknown sub-task: " + subTask);
        };
    }
}
```

---

## Fallback Strategy

If LLM call fails:
1. Log error with `finding_layer=3, status=LLM_UNAVAILABLE`
2. Return L1 + L2 findings only
3. Add INFO finding: `"LLM judge unavailable — intent alignment not checked"`
4. Report still returned (not failed)

---

## LLM Finding Confidence Downgrade

LLM findings are treated with lower default confidence than static findings:

| LLM Self-Reported Confidence | AgentReview Stored Confidence |
|---|---|
| HIGH | MEDIUM |
| MEDIUM | LOW |
| LOW | — (discard) |

The LLM's HIGH confidence becomes our MEDIUM because LLMs can be confidently wrong. This ensures LLM findings are surfaced but not treated as definitive.

Human reviewers or subsequent agent passes can promote LOW→MEDIUM after verification.
