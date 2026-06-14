import { useState } from 'react'
import {
  Settings,
  Key,
  Terminal,
  Globe,
  CheckCircle,
  ChevronDown,
  Info,
  Bot,
  Shield,
} from 'lucide-react'

type Executor = 'anthropic' | 'claude-cli' | 'antigravity'

interface Section {
  id: string
  title: string
  icon: React.ElementType
  description: string
}

const SECTIONS: Section[] = [
  { id: 'executor', title: 'LLM Executor', icon: Bot, description: 'Choose how the AI layer performs code review' },
  { id: 'security', title: 'Security', icon: Shield, description: 'API keys and authentication' },
  { id: 'advanced', title: 'Advanced', icon: Settings, description: 'Review thresholds and behaviour' },
]

function SectionHeader({ section }: { section: Section }) {
  const Icon = section.icon
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <Icon size={16} style={{ color: '#818cf8' }} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-text-primary">{section.title}</h2>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{section.description}</p>
      </div>
    </div>
  )
}

function ExecutorCard({
  id, label, description, icon: Icon, selected, onSelect,
}: {
  id: Executor; label: string; description: string; icon: React.ElementType
  selected: boolean; onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-start gap-3 p-4 rounded-xl transition-all"
      style={{
        background: selected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <Icon size={15} style={{ color: selected ? '#818cf8' : '#475569' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text-primary">{label}</span>
          {selected && <CheckCircle size={14} style={{ color: '#818cf8', flexShrink: 0 }} />}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{description}</p>
      </div>
    </button>
  )
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8">
      <div className="sm:w-48 flex-shrink-0 pt-0.5">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const [executor, setExecutor] = useState<Executor>('claude-cli')
  const [apiKey, setApiKey] = useState('')
  const [passThreshold, setPassThreshold] = useState(25)
  const [blockThreshold, setBlockThreshold] = useState(75)
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Configure your AgentReview environment</p>
      </div>

      {/* Executor */}
      <div className="card p-5 animate-fade-in">
        <SectionHeader section={SECTIONS[0]} />
        <div className="space-y-2">
          <ExecutorCard
            id="anthropic" selected={executor === 'anthropic'} onSelect={() => setExecutor('anthropic')}
            label="Anthropic API" icon={Globe}
            description="Call the Claude API directly using your API key. Best for CI pipelines and unattended automation."
          />
          <ExecutorCard
            id="claude-cli" selected={executor === 'claude-cli'} onSelect={() => setExecutor('claude-cli')}
            label="Claude Code CLI" icon={Terminal}
            description="Uses the claude CLI installed on this machine. Leverages your existing Claude subscription — no API cost."
          />
          <ExecutorCard
            id="antigravity" selected={executor === 'antigravity'} onSelect={() => setExecutor('antigravity')}
            label="Antigravity CLI" icon={Terminal}
            description="Runs the antigravity CLI. Useful if you have an Antigravity subscription active on this host."
          />
        </div>
        <p className="text-xs mt-3" style={{ color: '#334155' }}>
          This sets the default executor. You can override it per-review on the submission form.
        </p>
      </div>

      {/* Security */}
      <div className="card p-5 animate-fade-in">
        <SectionHeader section={SECTIONS[1]} />
        <div className="space-y-5">
          <FieldRow label="Anthropic API Key" hint="Required only when using the Anthropic API executor">
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input w-full pl-9 font-mono text-xs"
                style={{ letterSpacing: apiKey ? '0.1em' : 'normal' }}
              />
            </div>
          </FieldRow>

          <div
            className="flex items-start gap-2.5 p-3.5 rounded-lg text-sm"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
          >
            <Info size={14} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: '#94a3b8', fontSize: 12 }}>
              API keys are stored in your browser session only and are sent to the backend per-request
              as an Authorization header. They are not persisted server-side.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="card p-5 animate-fade-in">
        <SectionHeader section={SECTIONS[2]} />
        <div className="space-y-6">
          <FieldRow label="Pass threshold" hint="Risk score ≤ this value → PASS">
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} value={passThreshold}
                onChange={e => setPassThreshold(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span
                className="font-mono text-sm font-bold w-8 text-right"
                style={{ color: '#34d399' }}
              >
                {passThreshold}
              </span>
            </div>
          </FieldRow>

          <FieldRow label="Block threshold" hint="Risk score ≥ this value → BLOCK">
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} value={blockThreshold}
                onChange={e => setBlockThreshold(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span
                className="font-mono text-sm font-bold w-8 text-right"
                style={{ color: '#f87171' }}
              >
                {blockThreshold}
              </span>
            </div>
          </FieldRow>

          <FieldRow label="Score between" hint="Scores in the middle zone → WARN">
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}
            >
              <span>{passThreshold + 1}</span>
              <span style={{ color: '#475569' }}>–</span>
              <span>{blockThreshold - 1}</span>
              <span style={{ color: '#64748b', fontFamily: 'sans-serif', marginLeft: 4 }}>→ WARN</span>
            </div>
          </FieldRow>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={save}
          className="btn-primary"
          style={saved ? { background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' } : {}}
        >
          {saved ? <><CheckCircle size={14} /> Saved</> : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
