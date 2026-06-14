import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Recommendation, Severity, FindingCategory } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRecommendationClass(rec?: Recommendation): string {
  switch (rec) {
    case 'BLOCK': return 'badge-block'
    case 'WARN': return 'badge-warn'
    case 'PASS': return 'badge-pass'
    default: return 'badge-info'
  }
}

export function getSeverityClass(sev: Severity): string {
  switch (sev) {
    case 'CRITICAL': return 'badge-critical'
    case 'HIGH': return 'badge-high'
    case 'MEDIUM': return 'badge-medium'
    case 'LOW': return 'badge-low'
    default: return 'badge-info'
  }
}

export function getCategoryLabel(cat: FindingCategory): string {
  const labels: Record<FindingCategory, string> = {
    HALLUCINATION: 'Hallucination',
    INTENT_DRIFT: 'Intent Drift',
    MIRROR_TEST: 'Mirror Test',
    ABSTRACTION_SMELL: 'Abstraction Smell',
    CONFIDENCE_BUG: 'Confidence Bug',
    DEAD_REPLICA: 'Dead Replica',
    VERSION_BLIND: 'Version Blind',
    GHOST_HANDLING: 'Ghost Handling',
  }
  return labels[cat] || cat
}

export function getRiskColor(score: number): string {
  if (score >= 76) return 'text-red-400'
  if (score >= 51) return 'text-orange-400'
  if (score >= 26) return 'text-amber-400'
  return 'text-green-400'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
