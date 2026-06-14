import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ShieldAlert,
  FileCode2,
} from 'lucide-react'
import { reviewApi } from '../lib/api'
import { getRecommendationClass, getRiskColor, formatDate } from '../lib/utils'
import { ReviewListItem } from '../types'

/* ── Skeleton row ──────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[80, 120, 70, 50, 50, 80, 80].map((w, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="skeleton h-3 rounded" style={{ width: `${w}px` }} />
        </td>
      ))}
    </tr>
  )
}

/* ── Stat card ─────────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: string
  trendUp?: boolean
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <div className="card card-body animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendingUp size={11} style={{ color: '#10b981' }} />
            <span className="text-xs font-medium" style={{ color: '#10b981' }}>{trend}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</p>
    </div>
  )
}

/* ── Status badge ──────────────────────────────────────────── */
function StatusBadge({ status }: { status: ReviewListItem['status'] }) {
  const CONFIG: Record<string, { bg: string; color: string; border: string }> = {
    COMPLETE: { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
    FAILED: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
    PROCESSING: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
    PENDING: { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
  }
  const cfg = CONFIG[status] ?? CONFIG.PENDING
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {status === 'PROCESSING' && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: cfg.color }}
        />
      )}
      {status}
    </span>
  )
}

/* ── Empty state ───────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}
      >
        <FileCode2 size={24} style={{ color: '#6366f1' }} />
      </div>
      <p className="text-text-primary font-medium mb-1">No reviews yet</p>
      <p className="text-sm mb-5" style={{ color: '#64748b' }}>
        Submit your first review to start catching risky patterns
      </p>
      <Link to="/review/new" className="btn-primary">
        <PlusCircle size={14} />
        Create your first review
      </Link>
    </div>
  )
}

/* ── Risk pill ─────────────────────────────────────────────── */
function RiskPill({ score }: { score: number }) {
  const color = getRiskColor(score)
  const bg =
    score >= 76 ? 'rgba(239,68,68,0.1)' :
    score >= 51 ? 'rgba(249,115,22,0.1)' :
    score >= 26 ? 'rgba(245,158,11,0.1)' :
    'rgba(16,185,129,0.1)'
  const border =
    score >= 76 ? 'rgba(239,68,68,0.2)' :
    score >= 51 ? 'rgba(249,115,22,0.2)' :
    score >= 26 ? 'rgba(245,158,11,0.2)' :
    'rgba(16,185,129,0.2)'

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {score}
    </span>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => reviewApi.list({ page: 0, size: 20 }),
  })

  const reviews = data?.reviews ?? []
  const total = data?.total ?? 0
  const completed = reviews.filter(r => r.status === 'COMPLETE').length
  const blocked = reviews.filter(r => r.recommendation === 'BLOCK').length
  const inQueue = reviews.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length
  const passRate =
    completed > 0
      ? Math.round((reviews.filter(r => r.recommendation === 'PASS').length / completed) * 100)
      : 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            AI-powered code review for agent-generated code
          </p>
        </div>
        <Link to="/review/new" className="btn-primary">
          <PlusCircle size={14} />
          New Review
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reviews"
          value={total}
          icon={Activity}
          iconBg="rgba(99,102,241,0.12)"
          iconColor="#818cf8"
        />
        <StatCard
          label="Pass Rate"
          value={completed > 0 ? `${passRate}%` : '—'}
          icon={CheckCircle}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#34d399"
          trend={completed > 0 ? `${passRate}%` : undefined}
        />
        <StatCard
          label="Blocked"
          value={blocked}
          icon={ShieldAlert}
          iconBg="rgba(239,68,68,0.1)"
          iconColor="#f87171"
        />
        <StatCard
          label="In Queue"
          value={inQueue}
          icon={Clock}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#fbbf24"
        />
      </div>

      {/* Reviews table */}
      <div className="card overflow-hidden animate-fade-in">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-semibold text-text-primary">Recent Reviews</h2>
          {reviews.length > 0 && (
            <span className="text-xs" style={{ color: '#475569' }}>{reviews.length} shown</span>
          )}
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['ID', 'Date', 'Language', 'Risk', 'Findings', 'Decision', 'Status'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#334155' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['ID', 'Date', 'Language', 'Risk', 'Findings', 'Decision', 'Status'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#334155' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr
                    key={r.reviewId}
                    onClick={() => navigate(`/review/${r.reviewId}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = ''
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className="font-mono text-xs font-medium"
                        style={{ color: '#818cf8' }}
                      >
                        {r.reviewId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: '#64748b' }}>
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.language ? (
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {r.language}
                        </span>
                      ) : (
                        <span style={{ color: '#1e293b' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.riskScore != null ? (
                        <RiskPill score={r.riskScore} />
                      ) : (
                        <span style={{ color: '#1e293b' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium" style={{ color: '#64748b' }}>
                      {r.findingCount ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.recommendation ? (
                        <span className={getRecommendationClass(r.recommendation)}>
                          {r.recommendation}
                        </span>
                      ) : (
                        <span style={{ color: '#1e293b' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert when processing */}
      {inQueue > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-fade-in"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            color: '#fbbf24',
          }}
        >
          <Clock size={14} className="animate-pulse flex-shrink-0" />
          <span>
            {inQueue} review{inQueue > 1 ? 's' : ''} currently processing — page refreshes automatically.
          </span>
        </div>
      )}
    </div>
  )
}
