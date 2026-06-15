import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Key,
  Terminal,
  Globe,
  CheckCircle,
  Info,
  Bot,
  Shield,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiKeyApi, ApiKeyDto } from '../lib/api'

type Executor = 'anthropic' | 'claude-cli' | 'antigravity' | 'remote-skill'

/* ── helpers ─────────────────────────────────────────────────── */
function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function SectionHeader({
  icon: Icon, title, description,
}: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <Icon size={16} style={{ color: '#818cf8' }} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{description}</p>
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

/* ── Key row ─────────────────────────────────────────────────── */
function KeyRow({ k, onRevoke }: { k: ApiKeyDto; onRevoke: (id: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [copying, setCopying] = useState(false)

  function copyKey() {
    if (!k.plainKey) return
    navigator.clipboard.writeText(k.plainKey)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
    toast.success('Key copied to clipboard')
  }

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.1)' }}
      >
        <Key size={14} style={{ color: '#818cf8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{k.name}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="font-mono text-xs" style={{ color: '#475569' }}>{k.keyPrefix}</span>
          <span className="text-xs" style={{ color: '#334155' }}>
            Created {formatDate(k.createdAt)}
          </span>
          {k.lastUsedAt && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#334155' }}>
              <Clock size={10} />
              Used {formatDate(k.lastUsedAt)}
            </span>
          )}
        </div>
        {k.plainKey && (
          <div
            className="flex items-center gap-2 mt-2 p-2 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <span className="font-mono text-xs flex-1 truncate" style={{ color: '#34d399' }}>
              {k.plainKey}
            </span>
            <button
              onClick={copyKey}
              className="flex-shrink-0 p-1 rounded transition-colors"
              style={{ color: copying ? '#34d399' : '#475569' }}
              title="Copy key"
            >
              {copying ? <CheckCircle size={12} /> : <Copy size={12} />}
            </button>
          </div>
        )}
        {k.plainKey && (
          <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>
            Save this key now — it will not be shown again.
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onRevoke(k.id); setShowConfirm(false) }}
              className="text-xs px-2 py-1 rounded-md transition-colors"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs px-2 py-1 rounded-md transition-colors"
              style={{ color: '#475569' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#334155' }}
            title="Revoke key"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [executor, setExecutor] = useState<Executor>('claude-cli')
  const [newKeyName, setNewKeyName] = useState('')
  const [passThreshold, setPassThreshold] = useState(25)
  const [blockThreshold, setBlockThreshold] = useState(75)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeyApi.list(),
  })

  const generateMutation = useMutation({
    mutationFn: (name: string) => apiKeyApi.generate(name),
    onSuccess: (newKey) => {
      queryClient.setQueryData<ApiKeyDto[]>(['api-keys'], prev => [newKey, ...(prev ?? [])])
      setNewKeyName('')
      toast.success('API key generated')
    },
    onError: () => toast.error('Failed to generate key'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeyApi.revoke(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ApiKeyDto[]>(['api-keys'], prev => prev?.filter(k => k.id !== id))
      toast.success('Key revoked')
    },
    onError: () => toast.error('Failed to revoke key'),
  })

  function handleGenerate() {
    const name = newKeyName.trim() || 'My key'
    generateMutation.mutate(name)
  }

  function saveSettings() {
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Configure your AgentReview environment</p>
      </div>

      {/* ── API Keys ────────────────────────────────────────────── */}
      <div className="card p-5 animate-fade-in">
        <SectionHeader icon={Key} title="API Keys" description="Keys for the Claude Code skill to authenticate with AgentReview" />

        {/* How it works */}
        <div
          className="flex items-start gap-3 p-3.5 rounded-xl mb-5 text-sm"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
        >
          <Info size={14} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: '#94a3b8', fontSize: 12 }}>
            <p className="font-medium mb-1" style={{ color: '#c4b5fd' }}>How the remote skill works:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Generate a key below and copy it</li>
              <li>Open Claude Code on your machine and run <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'monospace' }}>/agentreview-tasks</code></li>
              <li>Paste the key when prompted</li>
              <li>Submit reviews with <strong>Remote Skill</strong> executor — they queue up</li>
              <li>Claude Code picks them up, analyzes with its full AI capabilities, and posts results back</li>
            </ol>
          </div>
        </div>

        {/* Generate new key */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Key name (e.g. My Laptop)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            maxLength={100}
          />
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="btn-primary flex-shrink-0"
          >
            {generateMutation.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <Plus size={14} />}
            Generate
          </button>
        </div>

        {/* Key list */}
        {keysLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div
            className="flex items-center justify-center gap-2 py-8 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Key size={16} style={{ color: '#334155' }} />
            <span className="text-sm" style={{ color: '#334155' }}>No API keys yet</span>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <KeyRow
                key={k.id}
                k={k}
                onRevoke={id => revokeMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Default executor ───────────────────────────────────── */}
      <div className="card p-5 animate-fade-in">
        <SectionHeader icon={Bot} title="Default LLM Executor" description="Choose how the AI layer runs reviews by default" />
        <div className="space-y-2">
          <ExecutorCard
            id="anthropic" selected={executor === 'anthropic'} onSelect={() => setExecutor('anthropic')}
            label="Anthropic API" icon={Globe}
            description="Calls Claude API directly. Best for CI pipelines and unattended automation."
          />
          <ExecutorCard
            id="claude-cli" selected={executor === 'claude-cli'} onSelect={() => setExecutor('claude-cli')}
            label="Claude Code CLI" icon={Terminal}
            description="Spawns the claude CLI on the server. Uses your Claude subscription — no API cost."
          />
          <ExecutorCard
            id="antigravity" selected={executor === 'antigravity'} onSelect={() => setExecutor('antigravity')}
            label="Antigravity CLI" icon={Terminal}
            description="Runs the antigravity CLI. Requires an Antigravity subscription on this host."
          />
          <ExecutorCard
            id="remote-skill" selected={executor === 'remote-skill'} onSelect={() => setExecutor('remote-skill')}
            label="Remote Skill (Claude Code)" icon={Key}
            description="Your local Claude Code picks up the review task via API key. No server AI cost — runs on your machine."
          />
        </div>
        <p className="text-xs mt-3" style={{ color: '#334155' }}>
          You can override this per review on the submission form.
        </p>
      </div>

      {/* ── Thresholds ─────────────────────────────────────────── */}
      <div className="card p-5 animate-fade-in">
        <SectionHeader icon={Shield} title="Risk Thresholds" description="Adjust when a review PASSES, WARNS, or BLOCKS" />
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="label mb-0">Pass threshold</label>
              <span className="font-mono text-sm font-bold" style={{ color: '#34d399' }}>{passThreshold}</span>
            </div>
            <input type="range" min={0} max={100} value={passThreshold}
              onChange={e => setPassThreshold(Number(e.target.value))}
              className="w-full accent-indigo-500" />
            <p className="text-xs mt-1" style={{ color: '#334155' }}>Risk score ≤ {passThreshold} → PASS</p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="label mb-0">Block threshold</label>
              <span className="font-mono text-sm font-bold" style={{ color: '#f87171' }}>{blockThreshold}</span>
            </div>
            <input type="range" min={0} max={100} value={blockThreshold}
              onChange={e => setBlockThreshold(Number(e.target.value))}
              className="w-full accent-indigo-500" />
            <p className="text-xs mt-1" style={{ color: '#334155' }}>Risk score ≥ {blockThreshold} → BLOCK</p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}
          >
            <span>{passThreshold + 1}</span>
            <span style={{ color: '#475569' }}>–</span>
            <span>{blockThreshold - 1}</span>
            <span style={{ color: '#64748b', fontFamily: 'sans-serif', marginLeft: 4 }}>→ WARN</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          className="btn-primary"
          style={settingsSaved ? { background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' } : {}}
        >
          {settingsSaved ? <><CheckCircle size={14} /> Saved</> : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
