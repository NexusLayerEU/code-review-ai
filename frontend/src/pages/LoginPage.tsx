import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { saveAuth } from '../lib/auth'

const FEATURES = [
  { icon: ShieldCheck, text: 'AI-powered risk analysis for agent-generated code' },
  { icon: Zap, text: 'Multi-layer static + LLM review engine' },
  { icon: ShieldCheck, text: 'Hallucination detection and intent drift analysis' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const next: typeof errors = {}
    if (!email) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const auth = await authApi.login(email, password)
      saveAuth(auth)
      navigate('/app/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: '#0d0d16' }}
      >
        {/* Animated gradient blobs */}
        <div
          className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-semibold text-text-primary text-base tracking-tight">AgentReview</span>
        </div>

        {/* Tagline */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-text-primary leading-tight mb-3">
              Review agent code<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
              >
                before it ships.
              </span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              Catch hallucinations, intent drift, and risky patterns
              in AI-generated code before they reach production.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  <Icon size={11} style={{ color: '#818cf8' }} />
                </div>
                <span className="text-sm" style={{ color: '#94a3b8' }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs" style={{ color: '#1e293b' }}>
          &copy; {new Date().getFullYear()} AgentReview
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
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
            <h1 className="text-xl font-bold text-text-primary mb-1">Welcome back</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>Sign in to your account to continue</p>
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
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                    placeholder="••••••••"
                    autoComplete="current-password"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2 py-2.5"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-4" style={{ color: '#475569' }}>
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: '#818cf8' }}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
