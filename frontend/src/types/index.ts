export type ReviewStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
export type ReviewMode = 'STATIC' | 'FULL' | 'LLM_ONLY'
export type ExecutorType = 'CLAUDE_API' | 'CLAUDE_CLI' | 'ANTIGRAVITY_CLI'
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'
export type FindingCategory = 'HALLUCINATION' | 'INTENT_DRIFT' | 'MIRROR_TEST' | 'ABSTRACTION_SMELL' | 'CONFIDENCE_BUG' | 'DEAD_REPLICA' | 'VERSION_BLIND' | 'GHOST_HANDLING'
export type Recommendation = 'BLOCK' | 'WARN' | 'PASS'

export interface ExecutorConfig {
  type: ExecutorType
  apiKey?: string
  model?: string
  cliPath?: string
  extraArgs?: string
}

export interface ReviewFile {
  path: string
  content: string
  isDiff?: boolean
}

export interface Finding {
  id: string
  ruleId: string
  category: FindingCategory
  severity: Severity
  confidence: Confidence
  layer: number
  file?: string
  lineStart?: number
  lineEnd?: number
  description: string
  suggestion?: string
  evidence?: string
}

export interface ReviewSummary {
  totalFindings: number
  bySeverity: Record<Severity, number>
  byCategory: Record<FindingCategory, number>
  riskScore: number
  riskLabel: string
  recommendation: Recommendation
}

export interface AgentActionItem {
  priority: number
  action: string
  findingId: string
  instruction: string
}

export interface Review {
  reviewId: string
  status: ReviewStatus
  createdAt: string
  durationMs?: number
  summary?: ReviewSummary
  findings?: Finding[]
  agentActionItems?: AgentActionItem[]
  pollingUrl?: string
  streamUrl?: string
}

export interface ReviewListItem {
  reviewId: string
  agentId?: string
  createdAt: string
  language: string
  recommendation?: Recommendation
  riskScore?: number
  findingCount?: number
  status: ReviewStatus
  sourceType?: string
}

export interface User {
  email: string
  username: string
  role: string
}

export interface AuthResponse {
  token: string
  email: string
  username: string
  role: string
}
