import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { saveAuth } from '../lib/auth'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { score, label: 'Good', color: '#10b981' }
  return { score, label: 'Strong', color: '#6366f1' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; username?: string; password?: string }>({})

  const strength = getPasswordStrength(password)

  function validate(): boolean {
    const next: typeof errors = {}
    if (!email) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!username) next.username = 'Username is required'
    else if (username.length < 3) next.username = 'Must be at least 3 characters'
    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Must be at least 8 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const auth = await authApi.register(email, username, password)
      saveAuth(auth)
      navigate('/app/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: '#0d0d16' }}
      >
        <div
          className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-semibold text-text-primary text-base tracking-tight">AgentReview</span>
        </div>

        <div className="relative space-y-5">
          <h2 className="text-3xl font-bold text-text-primary leading-tight">
            Your AI code review
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              starts here.
            </span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
            Join developers who trust AgentReview to catch risky patterns
            in agent-generated code before they cause production incidents.
          </p>

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.12)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#818cf8' }}>
              What you get
            </p>
            {[
              'Unlimited code reviews',
              'Multi-layer LLM + static analysis',
              'Risk scoring and action items',
              'Claude Code CLI integration',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full" style={{ background: '#6366f1' }} />
                <span className="text-sm" style={{ color: '#94a3b8' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: '#1e293b' }}>
          &copy; {new Date().getFullYear()} AgentReview
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="font-semibold text-text-primary">AgentReview</span>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-text-primary mb-1">Create your account</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>Get started with free unlimited reviews</p>
          </div>

          <div className="card-glass p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.email}</p>
                )}
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })) }}
                  placeholder="myusername"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.username}</p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#475569' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.password}</p>
                )}

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all duration-200"
                          style={{
                            background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.06)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2 py-2.5"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-4" style={{ color: '#475569' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: '#818cf8' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
