import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  GitBranch,
  Terminal,
  Globe,
  CheckCircle,
  AlertTriangle,
  Lock,
  Code2,
  Bug,
  Cpu,
  ArrowRight,
  Layers,
  Eye,
  Sparkles,
  Key,
  Wifi,
  Server,
  CreditCard,
  MonitorSmartphone,
} from 'lucide-react'

/* ── Shield SVG logo ─────────────────────────────────────────── */
function ShieldLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5.5V11C4 15.418 7.582 19.5 12 21C16.418 19.5 20 15.418 20 11V5.5L12 2Z"
        fill="url(#lg)" opacity="0.95" />
      <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="lg" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Gradient blob ───────────────────────────────────────────── */
function Blob({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{ filter: 'blur(80px)', ...style }}
    />
  )
}

/* ── Section label ───────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
    >
      {children}
    </span>
  )
}

/* ── Feature card ────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, description, accent,
}: { icon: React.ElementType; title: string; description: string; accent: string }) {
  return (
    <div
      className="group relative p-6 rounded-2xl transition-all duration-300"
      style={{
        background: 'rgba(22,22,31,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${accent}40`
        el.style.boxShadow = `0 0 30px ${accent}12`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{description}</p>
    </div>
  )
}

/* ── Rule chip ───────────────────────────────────────────────── */
function RuleChip({ label, severity }: { label: string; severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const cfg = {
    critical: { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.18)', text: '#f87171', dot: '#ef4444' },
    high:     { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.18)', text: '#fb923c', dot: '#f97316' },
    medium:   { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', text: '#fbbf24', dot: '#f59e0b' },
    low:      { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.18)', text: '#818cf8', dot: '#6366f1' },
  }[severity]
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {label}
    </span>
  )
}

/* ── Step card ───────────────────────────────────────────────── */
function StepCard({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
        >
          {num}
        </div>
        <div className="flex-1 w-px mt-2" style={{ background: 'rgba(99,102,241,0.1)' }} />
      </div>
      <div className="pb-8">
        <h3 className="font-semibold text-text-primary mb-1.5">{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{description}</p>
      </div>
    </div>
  )
}

/* ── Executor pill ───────────────────────────────────────────── */
function ExecutorPill({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub: string }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <Icon size={16} style={{ color: '#818cf8' }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs" style={{ color: '#475569' }}>{sub}</p>
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{
          background: 'rgba(10,10,15,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <ShieldLogo size={28} />
          <span className="font-semibold text-text-primary tracking-tight">AgentReview</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 md:px-12 pt-24 pb-28 text-center">
        <Blob style={{ top: -160, left: '50%', transform: 'translateX(-60%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <Blob style={{ top: 100, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto">
          <Label><Sparkles size={11} />AI-Powered Code Review</Label>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight text-text-primary">
            Review agent code<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #8b5cf6 100%)' }}
            >
              before it ships.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-xl mx-auto" style={{ color: '#64748b' }}>
            AgentReview catches hallucinations, security vulnerabilities, and risky patterns in
            AI-generated code — automatically, before they reach production.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link to="/register" className="btn-primary text-base py-3 px-7">
              Start reviewing free
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-base py-3 px-7">
              Sign in to dashboard
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { label: 'Security rules', value: '12+' },
              { label: 'Review layers', value: '3' },
              { label: 'LLM executors', value: '4' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p
                  className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#334155' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Review pipeline overview ──────────────────────────────── */}
      <section className="px-6 md:px-12 py-20" style={{ background: 'rgba(17,17,24,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Label><Layers size={11} />Three-Layer Pipeline</Label>
            <h2 className="mt-4 text-3xl font-bold text-text-primary">Every review runs three passes</h2>
            <p className="mt-3 text-base" style={{ color: '#64748b' }}>
              Each layer catches what the previous one can't.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: '01', icon: Code2, color: '#818cf8',
                title: 'Static Analysis',
                desc: 'Python + tree-sitter parses your code into an AST. Detects syntax issues, import risks, and structural anti-patterns without executing a single line.',
              },
              {
                num: '02', icon: ShieldAlert, color: '#fb923c',
                title: 'Rule Engine',
                desc: 'A Java rule engine evaluates 12+ security, quality, and performance rules — hardcoded secrets, injection vectors, N+1 queries, and more.',
              },
              {
                num: '03', icon: Sparkles, color: '#a78bfa',
                title: 'LLM Judge',
                desc: 'Claude synthesises all findings, reasons about intent drift and hallucination, and issues a final PASS / WARN / BLOCK verdict with a risk score.',
              },
            ].map(({ num, icon: Icon, color, title, desc }) => (
              <div
                key={num}
                className="relative p-6 rounded-2xl"
                style={{ background: 'rgba(22,22,31,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="absolute top-4 right-4 font-mono text-4xl font-black select-none"
                  style={{ color: `${color}10` }}
                >
                  {num}
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we check ────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Label><Eye size={11} />What We Check</Label>
            <h2 className="mt-4 text-3xl font-bold text-text-primary">Every vulnerability that matters</h2>
            <p className="mt-3 text-base" style={{ color: '#64748b' }}>
              Pattern-matched and semantically understood by the AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <FeatureCard
              icon={Lock} accent="#f87171" title="Hardcoded Secrets"
              description="API keys, passwords, tokens, and connection strings buried in source code before they leak to Git history."
            />
            <FeatureCard
              icon={ShieldAlert} accent="#fb923c" title="Injection Vulnerabilities"
              description="SQL, command, and path injection vectors — including subtle concatenations that bypass naive regex checks."
            />
            <FeatureCard
              icon={Bug} accent="#fbbf24" title="Insecure Deserialization"
              description="Unsafe object reconstruction from untrusted sources that can escalate to remote code execution."
            />
            <FeatureCard
              icon={Cpu} accent="#a78bfa" title="Weak Cryptography"
              description="Deprecated algorithms like MD5, SHA-1, DES, and RC4 used for hashing passwords or encrypting sensitive data."
            />
            <FeatureCard
              icon={AlertTriangle} accent="#60a5fa" title="Intent Drift"
              description="AI-generated code that does more (or less) than was requested — detected semantically by the LLM judge layer."
            />
            <FeatureCard
              icon={Zap} accent="#34d399" title="N+1 Query Patterns"
              description="Database queries inside loops that will punish your production database under real-world load."
            />
          </div>

          {/* Rule chips cloud */}
          <div className="flex flex-wrap gap-2 justify-center">
            <RuleChip label="Hardcoded Secrets" severity="critical" />
            <RuleChip label="SQL Injection" severity="critical" />
            <RuleChip label="Insecure Deserialization" severity="high" />
            <RuleChip label="Path Traversal" severity="high" />
            <RuleChip label="Weak Cryptography" severity="high" />
            <RuleChip label="XSS Vulnerability" severity="high" />
            <RuleChip label="Broad Exception Catch" severity="medium" />
            <RuleChip label="Null Pointer Risk" severity="medium" />
            <RuleChip label="N+1 Query Pattern" severity="high" />
            <RuleChip label="Magic Numbers" severity="low" />
            <RuleChip label="Long Method" severity="low" />
            <RuleChip label="Object Churn" severity="low" />
          </div>
        </div>
      </section>

      {/* ── Review modes ─────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20" style={{ background: 'rgba(17,17,24,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Label><GitBranch size={11} />Three Review Modes</Label>
            <h2 className="mt-4 text-3xl font-bold text-text-primary">Works with your workflow</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Code2, color: '#818cf8',
                title: 'Paste Code',
                desc: 'Drop in a snippet or file content directly. Great for quick one-off reviews of agent output.',
              },
              {
                icon: GitBranch, color: '#34d399',
                title: 'Git Diff / PR',
                desc: 'Point at a repo URL and two branch names (or a PR number). We compute the diff and review only what changed.',
              },
              {
                icon: ShieldCheck, color: '#fbbf24',
                title: 'Directory Scan',
                desc: 'Provide a local directory path and we recursively review all code files, aggregating findings across the whole project.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(22,22,31,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LLM executors ────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Label><Terminal size={11} />Four LLM Executors</Label>
            <h2 className="mt-4 text-3xl font-bold text-text-primary">
              Use the AI you already pay for
            </h2>
            <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              No forced API spend. Every review lets you choose how the LLM layer runs.
              Pick the executor that fits your team's setup and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Anthropic API */}
            <div className="p-6 rounded-2xl flex flex-col gap-4"
              style={{ background: 'rgba(22,22,31,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <CreditCard size={18} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Anthropic API</p>
                  <p className="text-xs" style={{ color: '#475569' }}>Pay-per-token · Direct HTTPS</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Calls the Claude API directly using your Anthropic API key. The review engine sends
                the code and rules to the API and receives analysis back. No local software required
                on the server.
              </p>
              <ul className="space-y-2">
                {[
                  'Best for CI/CD pipelines and automation',
                  'No local AI software needed on the server',
                  'Pay per review — cost scales with usage',
                  'Fastest setup: just paste your API key',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs" style={{ color: '#64748b' }}>
                    <CheckCircle size={12} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', color: '#818cf8' }}>
                <Server size={11} />
                Runs on the AgentReview server
              </div>
            </div>

            {/* Claude Code CLI */}
            <div className="p-6 rounded-2xl flex flex-col gap-4"
              style={{ background: 'rgba(22,22,31,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Terminal size={18} style={{ color: '#34d399' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">Claude Code CLI</p>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#475569' }}>Subscription · Server-side CLI</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Spawns the <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'monospace' }}>claude</code> CLI
                installed on the AgentReview server. Uses your Claude subscription — no token charges on top.
                The server must have Claude Code installed and authenticated.
              </p>
              <ul className="space-y-2">
                {[
                  'Zero extra API cost — uses your subscription',
                  'Full Claude capabilities including extended thinking',
                  'Requires claude CLI installed on the host server',
                  'Ideal for self-hosted teams with Claude subscriptions',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs" style={{ color: '#64748b' }}>
                    <CheckCircle size={12} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: '#34d399' }}>
                <Server size={11} />
                Runs on the AgentReview server
              </div>
            </div>

            {/* Antigravity CLI */}
            <div className="p-6 rounded-2xl flex flex-col gap-4"
              style={{ background: 'rgba(22,22,31,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Zap size={18} style={{ color: '#fbbf24' }} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Antigravity CLI</p>
                  <p className="text-xs" style={{ color: '#475569' }}>Subscription · Server-side CLI</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Runs the Antigravity CLI installed on the server. Works the same as Claude Code CLI
                but for teams using an Antigravity AI subscription instead of Claude.
              </p>
              <ul className="space-y-2">
                {[
                  'Uses your existing Antigravity subscription',
                  'No additional API charges',
                  'Requires Antigravity CLI on the host server',
                  'Same three-layer analysis pipeline',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs" style={{ color: '#64748b' }}>
                    <CheckCircle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                <Server size={11} />
                Runs on the AgentReview server
              </div>
            </div>

            {/* Remote Skill */}
            <div className="p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden"
              style={{ background: 'rgba(22,22,31,0.8)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 30px rgba(139,92,246,0.06)' }}>
              <div
                className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <MonitorSmartphone size={18} style={{ color: '#a78bfa' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">Remote Skill</p>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                      Unique
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#475569' }}>Claude Code on your laptop · No server AI cost</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                The server queues the review task. Your <strong style={{ color: '#94a3b8' }}>local Claude Code</strong> polls
                for pending tasks, runs the full AI analysis on your machine using your own Claude subscription,
                and posts the results back. The server never touches any AI API.
              </p>

              {/* Flow diagram */}
              <div className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#a78bfa' }}>How it works</p>
                {[
                  { icon: Globe, label: 'You submit a review in the web UI', color: '#818cf8' },
                  { icon: Server, label: 'Server queues the task (status: PENDING)', color: '#64748b' },
                  { icon: MonitorSmartphone, label: 'Your Claude Code polls & picks up the task', color: '#a78bfa' },
                  { icon: Sparkles, label: 'Claude analyses locally — full AI power', color: '#c4b5fd' },
                  { icon: Wifi, label: 'Results posted back to the platform via API key', color: '#818cf8' },
                ].map(({ icon: Icon, label, color }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Icon size={11} style={{ color }} />
                    </div>
                    <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
                  </div>
                ))}
              </div>

              <ul className="space-y-2">
                {[
                  'Zero AI cost on the server — your machine does the work',
                  'Full Claude capabilities: extended context, deep reasoning',
                  'Secure: code never leaves your local environment for AI analysis',
                  'Authenticate with an API key from Settings → API Keys',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs" style={{ color: '#64748b' }}>
                    <CheckCircle size={12} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-auto rounded-lg px-3 py-2.5 text-xs font-mono"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                <span style={{ color: '#475569' }}># run in Claude Code on your laptop</span>
                <br />
                /agentreview-tasks
              </div>
            </div>

          </div>

          {/* Quick comparison table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(22,22,31,0.5)' }}>
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Quick comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Executor', 'Where AI runs', 'Cost model', 'Setup needed', 'Best for'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-medium" style={{ color: '#334155' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Anthropic API', where: 'Server → Anthropic', cost: 'Per-token billing', setup: 'API key only', best: 'CI/CD · Automation', color: '#818cf8' },
                    { name: 'Claude Code CLI', where: 'Server (local claude)', cost: 'Subscription (yours)', setup: 'claude CLI on host', best: 'Self-hosted teams', color: '#34d399' },
                    { name: 'Antigravity CLI', where: 'Server (local antigravity)', cost: 'Subscription (yours)', setup: 'antigravity CLI on host', best: 'Antigravity users', color: '#fbbf24' },
                    { name: 'Remote Skill', where: 'Your laptop', cost: 'Subscription (yours)', setup: 'Claude Code + API key', best: 'No server AI cost', color: '#a78bfa' },
                  ].map(({ name, where, cost, setup, best, color }) => (
                    <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-5 py-3 font-semibold" style={{ color }}>{name}</td>
                      <td className="px-5 py-3" style={{ color: '#64748b' }}>{where}</td>
                      <td className="px-5 py-3" style={{ color: '#64748b' }}>{cost}</td>
                      <td className="px-5 py-3" style={{ color: '#64748b' }}>{setup}</td>
                      <td className="px-5 py-3" style={{ color: '#64748b' }}>{best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20" style={{ background: 'rgba(17,17,24,0.5)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <Label><Zap size={11} />How It Works</Label>
              <h2 className="mt-4 text-3xl font-bold text-text-primary">From code to verdict in seconds</h2>
            </div>
            <div className="pt-2">
              <StepCard num="1" title="Submit your code"
                description="Paste a snippet, point at a Git diff, or provide a local directory path." />
              <StepCard num="2" title="Three-layer analysis runs"
                description="Static analysis → rule engine → LLM judge, each passing findings to the next layer." />
              <StepCard num="3" title="Get a risk score and verdict"
                description="A 0–100 risk score maps to PASS / WARN / BLOCK with a per-finding breakdown and explanation." />
              <StepCard num="4" title="Ship with confidence"
                description="BLOCK means stop — fix the issues. PASS means the code is clear to merge." />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 md:px-12 py-28 text-center">
        <Blob style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
        <div className="relative max-w-2xl mx-auto">
          <ShieldLogo size={48} />
          <h2 className="mt-6 text-4xl font-bold text-text-primary leading-tight">
            Ready to review<br />your agent code?
          </h2>
          <p className="mt-4 text-lg" style={{ color: '#64748b' }}>
            Create an account and run your first review in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/register" className="btn-primary text-base py-3 px-8">
              Create free account
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary text-base py-3 px-8">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 md:px-12 py-6 text-xs"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#1e293b' }}
      >
        <div className="flex items-center gap-2">
          <ShieldLogo size={18} />
          <span>AgentReview</span>
        </div>
        <span>&copy; {new Date().getFullYear()} AgentReview. Built for the AI-first engineering era.</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-text-primary transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-text-primary transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  )
}
