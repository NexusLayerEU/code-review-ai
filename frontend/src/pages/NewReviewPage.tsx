import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2,
  Code2,
  GitBranch,
  FolderOpen,
  CreditCard,
  Terminal,
  Zap,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewApi } from '../lib/api'
import { ReviewMode, ExecutorType } from '../types'

type SourceTab = 'code' | 'git-diff' | 'directory'

const LANGUAGES = [
  'typescript', 'javascript', 'python', 'java', 'go',
  'rust', 'csharp', 'cpp', 'ruby', 'php',
]

const SOURCE_TABS: { id: SourceTab; label: string; icon: React.ElementType }[] = [
  { id: 'code', label: 'Code Snippet', icon: Code2 },
  { id: 'git-diff', label: 'Git Diff / PR', icon: GitBranch },
  { id: 'directory', label: 'Directory', icon: FolderOpen },
]

const EXECUTOR_OPTIONS: {
  type: ExecutorType
  label: string
  description: string
  icon: React.ElementType
  badge?: string
  requiresKey: boolean
}[] = [
  {
    type: 'CLAUDE_API',
    label: 'Anthropic API',
    description: 'Uses your API key',
    icon: CreditCard,
    requiresKey: true,
  },
  {
    type: 'CLAUDE_CLI',
    label: 'Claude Code CLI',
    description: 'Uses your subscription',
    icon: Terminal,
    badge: 'Recommended',
    requiresKey: false,
  },
  {
    type: 'ANTIGRAVITY_CLI',
    label: 'Antigravity CLI',
    description: 'Uses your subscription',
    icon: Zap,
    requiresKey: false,
  },
]

const REVIEW_MODES: { mode: ReviewMode; label: string; hint: string }[] = [
  { mode: 'FULL', label: 'Full', hint: 'Static + LLM' },
  { mode: 'STATIC', label: 'Static Only', hint: 'Fast, no LLM' },
  { mode: 'LLM_ONLY', label: 'LLM Only', hint: 'Deep analysis' },
]

function LanguageSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        className="input appearance-none pr-8 cursor-pointer"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {LANGUAGES.map(l => (
          <option key={l} value={l} style={{ background: '#111118' }}>
            {l}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: '#475569' }}
      />
    </div>
  )
}

export default function NewReviewPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<SourceTab>('code')
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('typescript')

  const [diff, setDiff] = useState('')
  const [gitLanguage, setGitLanguage] = useState('typescript')

  const [dirPath, setDirPath] = useState('')
  const [dirLanguage, setDirLanguage] = useState('typescript')

  const [mode, setMode] = useState<ReviewMode>('FULL')
  const [executorType, setExecutorType] = useState<ExecutorType>('CLAUDE_CLI')
  const [apiKey, setApiKey] = useState('')
  const [agentId, setAgentId] = useState('')
  const [taskDescription, setTaskDescription] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const executor = { type: executorType, ...(apiKey ? { apiKey } : {}) }
      let review

      if (tab === 'code') {
        review = await reviewApi.create({
          files: [{ path: `main.${language}`, content: code }],
          language,
          mode,
          executor,
          agentId: agentId || undefined,
        })
      } else if (tab === 'git-diff') {
        review = await reviewApi.createFromGitDiff({
          diff,
          language: gitLanguage,
          mode,
          executor,
          agentId: agentId || undefined,
        })
      } else {
        review = await reviewApi.createFromDirectory({
          directoryPath: dirPath,
          language: dirLanguage,
          mode,
          executor,
          agentId: agentId || undefined,
        })
      }

      toast.success('Review submitted')
      navigate(`/review/${review.reviewId}`)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create review'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">New Review</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
          Submit agent-generated code for AI risk analysis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source card with pill tabs */}
        <div className="card overflow-hidden">
          {/* Pill tab row */}
          <div
            className="flex gap-1 px-4 pt-4 pb-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {SOURCE_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all duration-150 relative"
                style={
                  tab === id
                    ? {
                        color: '#f1f5f9',
                        background: 'rgba(99,102,241,0.1)',
                        borderBottom: '2px solid #6366f1',
                      }
                    : { color: '#64748b' }
                }
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5 space-y-4">
            {tab === 'code' && (
              <>
                <div>
                  <label className="label">Language</label>
                  <LanguageSelect value={language} onChange={setLanguage} />
                </div>
                <div>
                  <label className="label">
                    Code
                    <span className="ml-1.5 text-xs font-normal" style={{ color: '#475569' }}>
                      — paste agent-generated code here
                    </span>
                  </label>
                  <textarea
                    className="input font-mono text-xs h-56 resize-y leading-relaxed"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder={`// Paste agent-generated ${language} code here…`}
                    required
                    spellCheck={false}
                  />
                </div>
              </>
            )}

            {tab === 'git-diff' && (
              <>
                <div>
                  <label className="label">Language</label>
                  <LanguageSelect value={gitLanguage} onChange={setGitLanguage} />
                </div>
                <div>
                  <label className="label">
                    Git Diff
                    <span className="ml-1.5 text-xs font-normal" style={{ color: '#475569' }}>
                      — output of git diff or a PR patch
                    </span>
                  </label>
                  <textarea
                    className="input font-mono text-xs h-56 resize-y leading-relaxed"
                    value={diff}
                    onChange={e => setDiff(e.target.value)}
                    placeholder="diff --git a/src/main.ts b/src/main.ts&#10;--- a/src/main.ts&#10;+++ b/src/main.ts&#10;@@ -1,3 +1,5 @@&#10;…"
                    required
                    spellCheck={false}
                  />
                </div>
              </>
            )}

            {tab === 'directory' && (
              <>
                <div>
                  <label className="label">Language</label>
                  <LanguageSelect value={dirLanguage} onChange={setDirLanguage} />
                </div>
                <div>
                  <label className="label">Directory Path</label>
                  <div className="relative">
                    <FolderOpen
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#475569' }}
                    />
                    <input
                      type="text"
                      className="input pl-9"
                      value={dirPath}
                      onChange={e => setDirPath(e.target.value)}
                      placeholder="/path/to/project"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: '#334155' }}>
                    Server-side path — the review engine reads this directory
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Review Settings */}
        <div className="card card-body space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">Review Settings</h2>

          {/* Task description */}
          <div>
            <label className="label">
              Task Description
              <span className="ml-1.5 text-xs font-normal" style={{ color: '#475569' }}>
                optional — what should this code do?
              </span>
            </label>
            <input
              type="text"
              className="input"
              value={taskDescription}
              onChange={e => setTaskDescription(e.target.value)}
              placeholder="e.g. A REST API handler that creates a user and sends a welcome email"
            />
          </div>

          {/* Executor radio cards */}
          <div>
            <label className="label">Executor</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {EXECUTOR_OPTIONS.map(({ type, label, description, icon: Icon, badge }) => {
                const active = executorType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExecutorType(type)}
                    className="relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                      border: active
                        ? '1px solid rgba(99,102,241,0.35)'
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: active ? '0 0 16px rgba(99,102,241,0.1)' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <Icon
                          size={14}
                          style={{ color: active ? '#818cf8' : '#64748b' }}
                        />
                      </div>
                      {badge && (
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(16,185,129,0.1)',
                            color: '#34d399',
                            border: '1px solid rgba(16,185,129,0.2)',
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: active ? '#f1f5f9' : '#94a3b8' }}
                    >
                      {label}
                    </p>
                    <p className="text-xs" style={{ color: '#475569' }}>{description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* API key (conditional) */}
          {executorType === 'CLAUDE_API' && (
            <div>
              <label className="label">
                API Key
                <span className="ml-1.5 text-xs font-normal" style={{ color: '#475569' }}>
                  optional — uses server default if empty
                </span>
              </label>
              <input
                type="password"
                className="input font-mono"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
              />
            </div>
          )}

          {/* Review mode pills */}
          <div>
            <label className="label">Review Mode</label>
            <div className="flex gap-2">
              {REVIEW_MODES.map(({ mode: m, label, hint }) => {
                const active = mode === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm transition-all duration-150"
                    style={{
                      background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                      border: active
                        ? '1px solid rgba(99,102,241,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: active ? '#a5b4fc' : '#64748b',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {label}
                    <span
                      className="text-xs"
                      style={{ color: active ? '#6366f1' : '#334155' }}
                    >
                      {hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agent ID */}
          <div>
            <label className="label">
              Agent ID
              <span className="ml-1.5 text-xs font-normal" style={{ color: '#475569' }}>optional</span>
            </label>
            <input
              type="text"
              className="input font-mono"
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
              placeholder="agent-abc123"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Submitting…' : 'Run Review'}
          </button>
          {loading && (
            <p className="text-xs animate-fade-in" style={{ color: '#64748b' }}>
              Submitting to review engine…
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
