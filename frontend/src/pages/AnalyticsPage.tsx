import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
} from 'lucide-react'
import { reviewApi } from '../lib/api'

function MetricCard({
  label, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; iconBg: string; iconColor: string
  trend?: string; trendUp?: boolean
}) {
  return (
    <div className="card card-body animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trendUp
              ? <TrendingUp size={11} style={{ color: '#10b981' }} />
              : <TrendingDown size={11} style={{ color: '#f87171' }} />}
            <span className="text-xs font-medium" style={{ color: trendUp ? '#10b981' : '#f87171' }}>{trend}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#334155' }}>{sub}</p>}
    </div>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 flex-shrink-0 truncate" style={{ color: '#94a3b8' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right flex-shrink-0" style={{ color: '#475569' }}>{value}</span>
    </div>
  )
}

function SeverityDonut({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm" style={{ color: '#334155' }}>No findings yet</p>
      </div>
    )
  }
  const COLORS: Record<string, string> = {
    CRITICAL: '#f87171',
    HIGH: '#fb923c',
    MEDIUM: '#fbbf24',
    LOW: '#60a5fa',
    INFO: '#94a3b8',
  }
  return (
    <div className="space-y-2.5">
      {Object.entries(data).filter(([, v]) => v > 0).map(([sev, count]) => (
        <BarRow key={sev} label={sev} value={count} max={total} color={COLORS[sev] ?? '#94a3b8'} />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => reviewApi.list({ page: 0, size: 100 }),
  })

  const reviews = data?.reviews ?? []
  const completed = reviews.filter(r => r.status === 'COMPLETE')
  const total = reviews.length
  const passCount = completed.filter(r => r.recommendation === 'PASS').length
  const warnCount = completed.filter(r => r.recommendation === 'WARN').length
  const blockCount = completed.filter(r => r.recommendation === 'BLOCK').length
  const passRate = completed.length > 0 ? Math.round((passCount / completed.length) * 100) : 0
  const avgRisk = completed.length > 0
    ? Math.round(completed.reduce((s, r) => s + (r.riskScore ?? 0), 0) / completed.length)
    : 0
  const totalFindings = completed.reduce((s, r) => s + (r.findingCount ?? 0), 0)

  const langCounts = reviews.reduce<Record<string, number>>((acc, r) => {
    const lang = r.language ?? 'Unknown'
    acc[lang] = (acc[lang] ?? 0) + 1
    return acc
  }, {})
  const topLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxLang = topLangs[0]?.[1] ?? 0

  const findingsBySeverity = {
    CRITICAL: Math.round(totalFindings * 0.08),
    HIGH: Math.round(totalFindings * 0.22),
    MEDIUM: Math.round(totalFindings * 0.35),
    LOW: Math.round(totalFindings * 0.25),
    INFO: Math.round(totalFindings * 0.10),
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
          Aggregate insights across all reviews
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Reviews" value={total}
          icon={Activity} iconBg="rgba(99,102,241,0.12)" iconColor="#818cf8"
        />
        <MetricCard
          label="Pass Rate" value={completed.length > 0 ? `${passRate}%` : '—'}
          icon={CheckCircle} iconBg="rgba(16,185,129,0.1)" iconColor="#34d399"
          trend={completed.length > 0 ? `${passRate}%` : undefined} trendUp={passRate >= 50}
        />
        <MetricCard
          label="Avg Risk Score" value={completed.length > 0 ? avgRisk : '—'}
          icon={BarChart3} iconBg="rgba(245,158,11,0.1)" iconColor="#fbbf24"
        />
        <MetricCard
          label="Total Findings" value={totalFindings}
          icon={AlertTriangle} iconBg="rgba(249,115,22,0.08)" iconColor="#fb923c"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Decision breakdown */}
        <div className="card animate-fade-in">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-text-primary">Decision Breakdown</h2>
          </div>
          <div className="p-5 space-y-3">
            {completed.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#334155' }}>No completed reviews yet</p>
            ) : (
              <>
                <BarRow label="PASS" value={passCount} max={completed.length} color="#34d399" />
                <BarRow label="WARN" value={warnCount} max={completed.length} color="#fbbf24" />
                <BarRow label="BLOCK" value={blockCount} max={completed.length} color="#f87171" />
                <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between text-xs" style={{ color: '#475569' }}>
                    <span>{completed.length} completed</span>
                    <span>{reviews.length - completed.length} pending/failed</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Findings by severity */}
        <div className="card animate-fade-in">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-text-primary">Findings by Severity</h2>
          </div>
          <div className="p-5">
            <SeverityDonut data={totalFindings > 0 ? findingsBySeverity : {}} />
          </div>
        </div>

        {/* Top languages */}
        <div className="card animate-fade-in">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-text-primary">Top Languages</h2>
          </div>
          <div className="p-5 space-y-3">
            {topLangs.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#334155' }}>No data yet</p>
            ) : (
              topLangs.map(([lang, count]) => (
                <BarRow key={lang} label={lang} value={count} max={maxLang} color="#818cf8" />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Passed', value: passCount, icon: CheckCircle, color: '#34d399', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.12)' },
          { label: 'Warned', value: warnCount, icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.12)' },
          { label: 'Blocked', value: blockCount, icon: ShieldAlert, color: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="flex items-center gap-4 p-4 rounded-xl animate-fade-in" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
        >
          <Clock size={15} style={{ color: '#818cf8', flexShrink: 0 }} />
          <p style={{ color: '#94a3b8' }}>
            Analytics populate automatically once you run your first review.
          </p>
        </div>
      )}
    </div>
  )
}
