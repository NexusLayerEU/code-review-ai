import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Plus,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { clearAuth, getUser } from '../../lib/auth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/review/new', label: 'New Review', icon: Plus },
  { to: '/rules', label: 'Rules', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  review: 'Review',
  new: 'New Review',
  rules: 'Rules',
  analytics: 'Analytics',
  settings: 'Settings',
}

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map(seg => BREADCRUMB_MAP[seg] ?? seg)
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L4 5.5V11C4 15.418 7.582 19.5 12 21C16.418 19.5 20 15.418 20 11V5.5L12 2Z"
        fill="url(#shield-gradient)"
        opacity="0.9"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shield-gradient" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const breadcrumbs = getBreadcrumbs(location.pathname)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?'

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 flex-shrink-0">
          <ShieldIcon className="w-full h-full" />
        </div>
        <span className="font-semibold text-text-primary text-sm tracking-tight">AgentReview</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? 'text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'rgba(99,102,241,0.12)',
                    boxShadow: 'inset 2px 0 0 #6366f1',
                  }
                : {}
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className={isActive ? 'text-accent' : ''}
                  style={isActive ? { color: '#818cf8' } : {}}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.username}</p>
            <p className="text-xs truncate" style={{ color: '#475569' }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost w-full justify-start text-sm mt-0.5 hover:text-danger"
          style={{ color: '#475569' }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-56 flex-shrink-0 flex-col"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative w-56 flex-shrink-0 flex-col animate-slide-up"
            style={{ background: 'var(--bg-surface)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header
          className="flex items-center gap-3 px-6 py-3 flex-shrink-0"
          style={{
            background: 'rgba(10,10,15,0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <span style={{ color: '#334155' }}>AgentReview</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight size={13} style={{ color: '#1e293b' }} />
                <span
                  className={i === breadcrumbs.length - 1 ? 'font-medium' : ''}
                  style={{ color: i === breadcrumbs.length - 1 ? '#94a3b8' : '#334155' }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
