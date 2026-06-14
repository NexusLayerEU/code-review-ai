import { AuthResponse, User } from '../types'

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem('token', auth.token)
  localStorage.setItem('user', JSON.stringify({ email: auth.email, username: auth.username, role: auth.role }))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getUser(): User | null {
  const stored = localStorage.getItem('user')
  if (!stored) return null
  try { return JSON.parse(stored) } catch { return null }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}
