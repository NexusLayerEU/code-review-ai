import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import { reviewApi } from '../lib/api'
import { Review, Finding, Severity, AgentActionItem } from '../types'
import {
  getRecommendationClass,
  getSeverityClass,
  getCategoryLabel,
  getRiskColor,
  formatDate,
} from '../lib/utils'

/* ── Severity config ──────────────────────────────────────── */
const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; borderColor: string; bg: string }
> = {
  CRITICAL: { label: 'Critical', borderColor: '#ef4444', bg: 'rgba(239,68,68,0.04)' },
  HIGH:     { label: 'High',     borderColor: '#f97316', bg: 'rgba(249,115,22,0.04)' },
  MEDIUM:   { label: 'Medium',   borderColor: '#f59e0b', bg: 'rgba(245,158,11,0.04)' },
  LOW:      { label: 'Low',      borderColor: '#6366f1', bg: 'rgba(99,102,241,0.04)' },
  INFO:     { label: 'Info',     borderColor: '#334155', bg: 'rgba(51,65,85,0.04)'   },
}

/* ── Skeleton ─────────────────────────────────────────────── */
function SkeletonPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-6 w-48 rounded" />
      </div>
      <div className="card p-6 space-y-4">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="flex gap-4">
          {[60, 60, 60, 60, 60].map((w, i) => (
            <div key={i} className="space-y-1">
              <div className="skeleton h-3 rounded" style={{ width: `${w}px` }} />
              <div className="skeleton h-5 rounded" style={{ width: `${w}px` }} />
            </div>
          ))}
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
}

/* ── Risk gauge SVG arc ───────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
  const r = 52
  const cx = 64
  const cy = 64
  const startAngle = -210
  const totalSweep = 240

  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function describeArc(startDeg: number, endDeg: number) {
    const s = polarToCartesian(startDeg)
    const e = polarToCartesian(endDeg)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const fillEnd = startAngle + (score / 100) * totalSweep
  const color =
    score >= 76 ? '#ef4444' :
    score >= 51 ? '#f97316' :
    score >= 26 ? '#f59e0b' : '#10b981'

  return (
    <div className="flex items-center justify-center">
      <svg width="128" height="80" viewBox="0 0 128 90">
        {/* Track */}
        <path
          d={describeArc(startAngle, startAngle + totalSweep)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Fill */}
        {score > 0 && (
          <path
            d={describeArc(startAngle, fillEnd)}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={color}
          fontSize="20"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#475569"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          RISK SCORE
        </text>
      </svg>
    </div>
  )
}

/* ── Copy button ──────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
      style={{ color: copied ? '#34d399' : '#64748b' }}
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

/* ── Finding card ─────────────────────────────────────────── */
function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)
  const cfg = SEVERITY_CONFIG[finding.severity]

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-150"
      style={{
        background: open ? cfg.bg : 'transparent',
        border: `1px solid ${open ? cfg.borderColor + '30' : 'rgba(255,255,255,0.04)'}`,
        borderLeft: `3px solid ${cfg.borderColor}`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors group"
        style={{ background: 'transparent' }}
      >
        <span className={`${getSeverityClass(finding.severity)} mt-0.5 flex-shrink-0`}>
          {finding.severity}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono" style={{ color: '#475569' }}>
              {finding.ruleId}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#64748b',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {getCategoryLabel(finding.category)}
            </span>
            {finding.file && (
              <span className="text-xs font-mono" style={{ color: '#334155' }}>
                {finding.file}{finding.lineStart ? `:${finding.lineStart}` : ''}
              </span>
            )}
          </div>
          <p className="text-sm leading-snug" style={{ color: '#cbd5e1' }}>
            {finding.description}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1" style={{ color: '#334155' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {finding.suggestion && (
            <div>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#475569' }}>
                Suggestion
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                {finding.suggestion}
              </p>
            </div>
          )}
          {finding.evidence && (
            <div>
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#475569' }}>
                Evidence
              </p>
              <pre
                className="text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#94a3b8',
                }}
              >
                {finding.evidence}
              </pre>
            </div>
          )}
          <div className="flex gap-4 text-xs pt-1" style={{ color: '#334155' }}>
            <span>Confidence: <span style={{ color: '#475569' }}>{finding.confidence}</span></span>
            <span>Layer: <span style={{ color: '#475569' }}>{finding.layer}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Severity group ───────────────────────────────────────── */
function SeverityGroup({ severity, findings }: { severity: Severity; findings: Finding[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const cfg = SEVERITY_CONFIG[severity]
  if (findings.length === 0) return null

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span className={getSeverityClass(severity)}>{cfg.label}</span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
        >
          {findings.length}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <span style={{ color: '#334155' }}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-2 pl-1 animate-fade-in">
          {findings.map(f => <FindingCard key={f.id} finding={f} />)}
        </div>
      )}
    </div>
  )
}

/* ── Action item ──────────────────────────────────────────── */
function ActionItem({ item, index }: { item: AgentActionItem; index: number }) {
  return (
    <div className="group flex items-start gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{item.action}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
          {item.instruction}
        </p>
      </div>
      <CopyButton text={`${item.action}\n\n${item.instruction}`} />
    </div>
  )
}

/* ── Status icon ──────────────────────────────────────────── */
function StatusIcon({ status }: { status: Review['status'] }) {
  if (status === 'COMPLETE') return <CheckCircle size={15} style={{ color: '#34d399' }} />
  if (status === 'FAILED')   return <XCircle size={15} style={{ color: '#f87171' }} />
  return <Clock size={15} style={{ color: '#fbbf24' }} className="animate-pulse" />
}

type DetailTab = 'findings' | 'summary' | 'details'

/* ── Page ──────────────────────────────────────────────────── */
export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<DetailTab>('findings')

  const { data: review, isLoading } = useQuery({
    queryKey: ['review', id],
    queryFn: () => reviewApi.get(id!),
    refetchInterval: query => {
      const status = query.state.data?.status
      return status === 'PENDING' || status === 'PROCESSING' ? 3000 : false
    },
  })

  if (isLoading) return <SkeletonPage />

  if (!review) {
    return (
      <div className="p-6 text-sm" style={{ color: '#64748b' }}>
        Review not found.{' '}
        <Link to="/dashboard" style={{ color: '#818cf8' }}>Go back</Link>
      </div>
    )
  }

  const { summary, findings = [], agentActionItems = [] } = review
  const isPending = review.status === 'PENDING' || review.status === 'PROCESSING'

  const findingsBySeverity = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map(sev => ({
    severity: sev,
    findings: findings.filter(f => f.severity === sev),
  }))

  const TABS: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'findings', label: 'Findings', count: findings.length },
    { id: 'summary', label: 'Summary' },
    { id: 'details', label: 'Details' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Back */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#475569' }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#475569' }}
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      {/* Hero card */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Gauge */}
          {summary && <RiskGauge score={summary.riskScore} />}

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusIcon status={review.status} />
              <span className="font-mono text-sm" style={{ color: '#64748b' }}>
                {review.reviewId.slice(0, 16)}…
              </span>
              {summary?.recommendation && (
                <span className={getRecommendationClass(summary.recommendation)}>
                  {summary.recommendation}
                </span>
              )}
            </div>

            <div className="flex gap-4 flex-wrap text-xs" style={{ color: '#64748b' }}>
              <span>{formatDate(review.createdAt)}</span>
              {review.durationMs && (
                <span>{(review.durationMs / 1000).toFixed(1)}s</span>
              )}
              {findings.length > 0 && (
                <span>{findings.length} finding{findings.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {/* Severity breakdown */}
            {summary && (
              <div className="flex gap-3 flex-wrap pt-1">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map(sev => {
                  const count = summary.bySeverity[sev]
                  if (!count) return null
                  const cfg = SEVERITY_CONFIG[sev]
                  return (
                    <div
                      key={sev}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.borderColor}20` }}
                    >
                      <span className="text-xs" style={{ color: cfg.borderColor }}>{sev}</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: cfg.borderColor }}
                      >
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing banner */}
      {isPending && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-fade-in"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            color: '#fbbf24',
          }}
        >
          <div className="relative flex-shrink-0">
            <Clock size={15} />
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(245,158,11,0.3)' }}
            />
          </div>
          <span>
            Review is{' '}
            <span className="font-medium">{review.status.toLowerCase()}</span>
            … auto-refreshing every 3s
          </span>
        </div>
      )}

      {/* Action items */}
      {agentActionItems.length > 0 && (
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-semibold text-text-primary">Action Items</h2>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {agentActionItems.length}
            </span>
          </div>
          <div>
            {agentActionItems.map((item, i) => (
              <ActionItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Tabbed section */}
      {(findings.length > 0 || summary) && (
        <div className="card overflow-hidden">
          {/* Tab bar */}
          <div
            className="flex gap-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {TABS.map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium transition-all duration-150 relative"
                style={
                  activeTab === id
                    ? {
                        color: '#f1f5f9',
                        borderBottom: '2px solid #6366f1',
                        marginBottom: '-1px',
                      }
                    : { color: '#475569' }
                }
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: activeTab === id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                      color: activeTab === id ? '#818cf8' : '#475569',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* Findings tab */}
            {activeTab === 'findings' && (
              <div className="space-y-5 animate-fade-in">
                {findings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle size={28} style={{ color: '#34d399' }} className="mb-3" />
                    <p className="text-sm font-medium text-text-primary">No findings</p>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                      The review engine found no issues to report.
                    </p>
                  </div>
                ) : (
                  findingsBySeverity.map(({ severity, findings: f }) => (
                    <SeverityGroup key={severity} severity={severity} findings={f} />
                  ))
                )}
              </div>
            )}

            {/* Summary tab */}
            {activeTab === 'summary' && summary && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#475569' }}>Risk Label</p>
                    <p className="text-sm font-semibold text-text-primary">{summary.riskLabel}</p>
                  </div>
                  <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#475569' }}>Risk Score</p>
                    <p className={`text-sm font-bold font-mono ${getRiskColor(summary.riskScore)}`}>
                      {summary.riskScore} / 100
                    </p>
                  </div>
                  <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#475569' }}>Total Findings</p>
                    <p className="text-sm font-bold text-text-primary">{summary.totalFindings}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>By Severity</p>
                  <div className="grid grid-cols-5 gap-2">
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map(sev => {
                      const cfg = SEVERITY_CONFIG[sev]
                      return (
                        <div
                          key={sev}
                          className="flex flex-col items-center gap-1 py-3 rounded-xl"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.borderColor}20` }}
                        >
                          <p className="text-xl font-bold" style={{ color: cfg.borderColor }}>
                            {summary.bySeverity[sev] || 0}
                          </p>
                          <p className="text-xs uppercase tracking-wider" style={{ color: cfg.borderColor + 'aa' }}>
                            {cfg.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Details tab */}
            {activeTab === 'details' && (
              <div className="space-y-3 animate-fade-in">
                {[
                  { label: 'Review ID', value: review.reviewId, mono: true },
                  { label: 'Status', value: review.status },
                  { label: 'Created', value: formatDate(review.createdAt) },
                  { label: 'Duration', value: review.durationMs ? `${(review.durationMs / 1000).toFixed(2)}s` : '—' },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <span className="text-xs" style={{ color: '#475569' }}>{label}</span>
                    <span
                      className={`text-sm ${mono ? 'font-mono text-xs' : ''}`}
                      style={{ color: '#94a3b8' }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
