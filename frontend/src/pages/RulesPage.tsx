import {
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  Code2,
  GitBranch,
  Zap,
} from 'lucide-react'

interface RuleCardProps {
  id: string
  name: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  category: string
  active?: boolean
}

const SEVERITY_CONFIG: Record<string, { bg: string; color: string; border: string; icon: React.ElementType }> = {
  CRITICAL: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)', icon: ShieldAlert },
  HIGH: { bg: 'rgba(249,115,22,0.08)', color: '#fb923c', border: 'rgba(249,115,22,0.2)', icon: AlertTriangle },
  MEDIUM: { bg: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)', icon: AlertTriangle },
  LOW: { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)', icon: Info },
  INFO: { bg: 'rgba(100,116,139,0.08)', color: '#94a3b8', border: 'rgba(100,116,139,0.2)', icon: Info },
}

const RULES: RuleCardProps[] = [
  {
    id: 'SEC-001', name: 'Hardcoded Secrets', severity: 'CRITICAL', category: 'Security',
    description: 'Detects hardcoded API keys, passwords, tokens, and other secrets embedded directly in source code.',
    active: true,
  },
  {
    id: 'SEC-002', name: 'SQL Injection', severity: 'CRITICAL', category: 'Security',
    description: 'Identifies string concatenation in SQL queries that may allow injection attacks.',
    active: true,
  },
  {
    id: 'SEC-003', name: 'Insecure Deserialization', severity: 'HIGH', category: 'Security',
    description: 'Flags unsafe deserialization of untrusted data that could lead to remote code execution.',
    active: true,
  },
  {
    id: 'SEC-004', name: 'Path Traversal', severity: 'HIGH', category: 'Security',
    description: 'Detects user-controlled input used in file system paths without proper sanitization.',
    active: true,
  },
  {
    id: 'SEC-005', name: 'Weak Cryptography', severity: 'HIGH', category: 'Security',
    description: 'Identifies use of deprecated or weak cryptographic algorithms (MD5, SHA1, DES, RC4).',
    active: true,
  },
  {
    id: 'SEC-006', name: 'XSS Vulnerability', severity: 'HIGH', category: 'Security',
    description: 'Detects unescaped user input rendered in HTML, enabling cross-site scripting attacks.',
    active: true,
  },
  {
    id: 'QUA-001', name: 'Broad Exception Catch', severity: 'MEDIUM', category: 'Quality',
    description: 'Warns when catch blocks swallow all exceptions without logging or specific handling.',
    active: true,
  },
  {
    id: 'QUA-002', name: 'Null Pointer Risk', severity: 'MEDIUM', category: 'Quality',
    description: 'Identifies potential null dereferences where optional values are not checked before use.',
    active: true,
  },
  {
    id: 'QUA-003', name: 'Magic Numbers', severity: 'LOW', category: 'Quality',
    description: 'Flags unexplained numeric literals that should be extracted into named constants.',
    active: false,
  },
  {
    id: 'QUA-004', name: 'Long Method', severity: 'LOW', category: 'Quality',
    description: 'Reports methods exceeding 80 lines, suggesting refactoring into smaller units.',
    active: false,
  },
  {
    id: 'PERF-001', name: 'N+1 Query Pattern', severity: 'HIGH', category: 'Performance',
    description: 'Detects database queries executed inside loops that could be batched into a single query.',
    active: true,
  },
  {
    id: 'PERF-002', name: 'Unnecessary Object Creation', severity: 'LOW', category: 'Performance',
    description: 'Identifies repeated object instantiation inside hot loops where instances can be reused.',
    active: false,
  },
]

function SeverityBadge({ severity }: { severity: RuleCardProps['severity'] }) {
  const cfg = SEVERITY_CONFIG[severity]
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <Icon size={10} />
      {severity}
    </span>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ElementType> = {
    Security: ShieldAlert,
    Quality: Code2,
    Performance: Zap,
    Git: GitBranch,
  }
  const Icon = icons[category] ?? BookOpen
  return <Icon size={14} style={{ color: '#6366f1' }} />
}

const CATEGORIES = ['All', 'Security', 'Quality', 'Performance']

export default function RulesPage() {
  const active = RULES.filter(r => r.active).length
  const counts = CATEGORIES.slice(1).reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = RULES.filter(r => r.category === cat).length
    return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Review Rules</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {active} of {RULES.length} rules active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {CATEGORIES.slice(1).map(cat => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
              }}
            >
              <CategoryIcon category={cat} />
              {cat} <span style={{ color: '#475569' }}>{counts[cat]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl text-sm"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
      >
        <Info size={16} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: '#94a3b8' }}>
          Rules are applied automatically to every review. The LLM layer also performs a contextual
          analysis beyond these pattern-based checks.
        </p>
      </div>

      {/* Rule cards */}
      <div className="space-y-2">
        {CATEGORIES.slice(1).map(cat => {
          const catRules = RULES.filter(r => r.category === cat)
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 py-3">
                <CategoryIcon category={cat} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                  {cat}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <div className="space-y-2">
                {catRules.map(rule => (
                  <div
                    key={rule.id}
                    className="card animate-fade-in"
                    style={{ opacity: rule.active ? 1 : 0.5 }}
                  >
                    <div className="flex items-start gap-4 p-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: rule.active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${rule.active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {rule.active
                          ? <CheckCircle size={14} style={{ color: '#818cf8' }} />
                          : <div className="w-2 h-2 rounded-full" style={{ background: '#1e293b' }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold" style={{ color: '#475569' }}>
                            {rule.id}
                          </span>
                          <span className="font-semibold text-sm text-text-primary">{rule.name}</span>
                          <SeverityBadge severity={rule.severity} />
                          {!rule.active && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'rgba(255,255,255,0.04)', color: '#334155' }}
                            >
                              disabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: '#64748b' }}>{rule.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
