import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Terminal, Key, FolderOpen, Download, Play, ExternalLink } from 'lucide-react'

const SKILL_CONTENT = `---
name: agentreview-tasks
description: Scan local projects and send them to AgentReview for persistent storage and viewing, or poll for review tasks queued from the web UI.
triggers:
  - /agentreview-scan
  - /agentreview-tasks
  - /agentreview-init
  - /agentreview-status
  - /ar-scan
  - /ar-tasks
---

# AgentReview Skill

You are the AgentReview local agent. You analyze code with your full AI capabilities and push results to the AgentReview platform where users can browse findings, trends, and decisions.

The user does **not** need to interact with the web UI to start a scan — they just run this skill. The platform is read-only for viewing results.

---

## Configuration

On first use, ask the user for:
1. **API base URL** — the AgentReview backend, e.g. \`http://192.168.68.111:8200\`
2. **API key** — format \`ar_...\`, generated in AgentReview → Settings → API Keys

Store these in the session. Check for \`.agentreview.yml\` in the current directory first — if it exists, read it instead of asking.

\`.agentreview.yml\` format:
\`\`\`yaml
server: http://192.168.68.111:8200
# api_key is intentionally NOT stored in this file (use env var AR_API_KEY or enter at runtime)
project: my-project-name
language: java
task: "This service handles user authentication and JWT token management"
exclude:
  - "*.test.*"
  - "*.spec.*"
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/build/**"
  - "**/.git/**"
  - "**/target/**"
  - "**/vendor/**"
  - "**/__pycache__/**"
\`\`\`

If \`AR_API_KEY\` environment variable is set, use it automatically.

---

## Commands

### \`/agentreview-scan [path] [options]\`
**Scan a local project and publish results to AgentReview.**

Options:
- \`[path]\` — directory to scan (default: current directory \`.\`)
- \`--language <lang>\` — override language detection
- \`--task <description>\` — what the code is supposed to do
- \`--changed\` — scan only files changed since last git commit
- \`--staged\` — scan only git-staged files
- \`--watch\` — scan on every \`git commit\`

**Execution steps:**

**Step 1 — Discover files**
Run:
\`\`\`bash
git -C <path> ls-files --cached --others --exclude-standard 2>/dev/null || find <path> -type f
\`\`\`
Filter to source files only. Skip node_modules, dist, build, .git, target, vendor, __pycache__, .next, coverage. Skip files >150KB. Cap at 30 files.

**Step 2 — Detect language**
If not specified, detect from file extensions.

**Step 3 — Read files**
Use the Read tool. Track total chars. Stop at 200,000 chars.

**Step 4 — Register the scan**
\`\`\`bash
curl -s -X POST \\
  -H "X-API-Key: <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"projectName":"<name>","language":"<lang>","taskDescription":"<task>","files":[...]}' \\
  <SERVER>/api/v1/skill/scan
\`\`\`
Returns \`{"reviewId": "uuid", "status": "PROCESSING"}\`.

**Step 5 — Analyze**
Multi-pass analysis:
- **Pass A — Security**: hardcoded secrets, injection, path traversal, weak crypto, SSRF, XSS
- **Pass B — AI risks**: hallucination, intent drift, confidence bugs, mirror test, version blindness
- **Pass C — Quality**: broad exception catches, N+1 queries, null dereferences, resource leaks

**Step 6 — Build verdict**
Risk score: CRITICAL=25, HIGH=15, MEDIUM=8, LOW=3, INFO=1 (×confidence: HIGH=1.0, MEDIUM=0.7, LOW=0.4). Cap 100.
Recommendation: ≤25 → PASS, 26–75 → WARN, ≥76 → BLOCK.

**Step 7 — Post results**
\`\`\`bash
curl -s -X POST \\
  -H "X-API-Key: <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"findings":[...],"riskScore":45,"recommendation":"WARN","summary":"...","durationMs":8200}' \\
  <SERVER>/api/v1/skill/tasks/<REVIEW_ID>/complete
\`\`\`

**Step 8 — Print summary**
\`\`\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AgentReview Scan Complete
  Project:   my-project (23 files)
  Risk:      45 / 100  →  WARN
  Findings:  8  (2 HIGH, 4 MEDIUM, 2 LOW)
  View:  http://<server>:3200/app/review/<id>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`

---

### \`/agentreview-tasks\`
**Poll for tasks queued from the AgentReview web UI.**

Loops every 30 seconds, picks up PENDING reviews, analyzes them, posts results back.

---

### \`/agentreview-init [path]\`
**Set up a project config file.**

Creates \`.agentreview.yml\` in the project directory. API key is NOT stored here — use \`export AR_API_KEY=ar_...\`.

---

### \`/agentreview-status [review-id]\`
**Check review status or list recent reviews.**

---

## Behaviour rules

- **Never store the API key in \`.agentreview.yml\`**
- **Respect file size limits**: skip files >150KB, total >200K chars
- **Cap findings**: at most 50 (drop lowest-severity if over limit)
- **On network error**: retry once after 5s, then stop`

const INSTALL_STEPS = [
  {
    icon: Download,
    title: 'Install Claude Code',
    description: 'Install the Claude Code CLI on your laptop.',
    code: 'npm install -g @anthropic-ai/claude-code',
    note: 'Requires Node.js 18+. After install, run `claude` to verify.',
  },
  {
    icon: FolderOpen,
    title: 'Create the skill directory',
    description: 'Skills live under your Claude config folder.',
    code: 'mkdir -p ~/.claude/skills/agentreview-tasks',
    note: 'On Windows use: %USERPROFILE%\\.claude\\skills\\agentreview-tasks',
  },
  {
    icon: Copy,
    title: 'Copy SKILL.md',
    description: 'Save the skill file (copy the content from below).',
    code: '# Copy from the code block below, then:\nnano ~/.claude/skills/agentreview-tasks/SKILL.md',
    note: 'Paste the full content from the "Skill File" section below, then save.',
  },
  {
    icon: Key,
    title: 'Generate an API key',
    description: 'Create a key in AgentReview Settings → API Keys.',
    code: 'export AR_API_KEY=ar_your_key_here',
    note: 'The key is shown only once — save it in your shell profile or .env file.',
  },
  {
    icon: Play,
    title: 'Scan your first project',
    description: 'Open Claude Code inside any project folder and run the skill.',
    code: 'cd /path/to/your/project\nclaude\n# Inside Claude Code:\n/agentreview-scan .',
    note: 'Results appear instantly on this platform under Dashboard.',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
      style={{
        background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
        border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
        color: copied ? '#34d399' : '#94a3b8',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function ClaudeSkillPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Terminal size={16} style={{ color: '#818cf8' }} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Claude Code Skill</h1>
        </div>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Run AI code reviews directly from your laptop — no server-side LLM cost, full Claude capabilities.
        </p>
      </div>

      {/* How it works banner */}
      <div
        className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary mb-0.5">How it works</p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            Install the skill on your laptop → run <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#a5b4fc' }}>/agentreview-scan</code> in any Claude Code session → findings are pushed to this platform and viewable on your Dashboard.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-medium" style={{ color: '#64748b' }}>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: '#818cf8' }}>0</div>
            <div>server cost</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: '#34d399' }}>3</div>
            <div>analysis passes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>30</div>
            <div>files per scan</div>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="card card-body">
        <h2 className="text-sm font-semibold text-text-primary mb-5">Installation</h2>
        <div className="space-y-5">
          {INSTALL_STEPS.map(({ icon: Icon, title, description, code, note }, i) => (
            <div key={i} className="flex gap-4">
              {/* Step number + line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: '#818cf8',
                  }}
                >
                  {i + 1}
                </div>
                {i < INSTALL_STEPS.length - 1 && (
                  <div className="w-px flex-1 mt-2" style={{ background: 'rgba(255,255,255,0.06)', minHeight: '24px' }} />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon size={13} style={{ color: '#818cf8' }} />
                  <span className="text-sm font-medium text-text-primary">{title}</span>
                </div>
                <p className="text-xs mb-2.5" style={{ color: '#64748b' }}>{description}</p>
                <div
                  className="rounded-lg px-4 py-3 font-mono text-xs relative"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="absolute top-2 right-2">
                    <CopyButton text={code} />
                  </div>
                  <pre className="text-emerald-400 whitespace-pre-wrap pr-16">{code}</pre>
                </div>
                {note && (
                  <p className="mt-1.5 text-xs" style={{ color: '#475569' }}>
                    {note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA to Settings */}
        <div
          className="mt-4 rounded-lg px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <Key size={14} style={{ color: '#818cf8' }} />
          <p className="text-xs flex-1" style={{ color: '#64748b' }}>
            Don't have an API key yet?
          </p>
          <Link
            to="/app/settings"
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#818cf8' }}
          >
            Generate one in Settings
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Available commands */}
      <div className="card card-body">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Available Commands</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { cmd: '/agentreview-scan [path]', desc: 'Scan a local project and push findings', badge: 'Primary' },
            { cmd: '/agentreview-tasks', desc: 'Poll and process tasks queued from the web UI', badge: null },
            { cmd: '/agentreview-init [path]', desc: 'Create a .agentreview.yml config file', badge: null },
            { cmd: '/agentreview-status [id]', desc: 'Check review status or list recent scans', badge: null },
            { cmd: '/ar-scan', desc: 'Short alias for /agentreview-scan', badge: 'Alias' },
            { cmd: '/ar-tasks', desc: 'Short alias for /agentreview-tasks', badge: 'Alias' },
          ].map(({ cmd, desc, badge }) => (
            <div
              key={cmd}
              className="rounded-lg px-3.5 py-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs font-mono" style={{ color: '#a5b4fc' }}>{cmd}</code>
                {badge && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: badge === 'Primary' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
                      color: badge === 'Primary' ? '#818cf8' : '#475569',
                      border: badge === 'Primary' ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: '#475569' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skill file */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Skill File</h2>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              Save this as <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#a5b4fc' }}>~/.claude/skills/agentreview-tasks/SKILL.md</code>
            </p>
          </div>
          <CopyButton text={SKILL_CONTENT} />
        </div>
        <div
          className="rounded-lg overflow-auto max-h-[480px]"
          style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap" style={{ color: '#94a3b8' }}>
            {SKILL_CONTENT}
          </pre>
        </div>
      </div>

      {/* Quick reference */}
      <div className="card card-body">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Reference</h2>
        <div className="space-y-2 text-xs" style={{ color: '#64748b' }}>
          <div className="flex gap-2">
            <span style={{ color: '#475569' }}>1.</span>
            <span>Open any project in your terminal and start Claude Code with <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#a5b4fc' }}>claude</code></span>
          </div>
          <div className="flex gap-2">
            <span style={{ color: '#475569' }}>2.</span>
            <span>Type <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#a5b4fc' }}>/agentreview-scan .</code> — Claude will ask for your server URL and API key on first run</span>
          </div>
          <div className="flex gap-2">
            <span style={{ color: '#475569' }}>3.</span>
            <span>Or set <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#a5b4fc' }}>AR_API_KEY=ar_...</code> in your environment and create <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#a5b4fc' }}>.agentreview.yml</code> with your server URL to skip the prompts</span>
          </div>
          <div className="flex gap-2">
            <span style={{ color: '#475569' }}>4.</span>
            <span>Results appear on your <Link to="/app/dashboard" className="underline" style={{ color: '#818cf8' }}>Dashboard</Link> within seconds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
