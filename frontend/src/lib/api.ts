import axios from 'axios'
import { AuthResponse, Review, ReviewListItem } from '../types'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, username, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}

export const reviewApi = {
  create: (data: object) => api.post<Review>('/reviews', data).then(r => r.data),
  createFromDirectory: (data: object) => api.post<Review>('/reviews/directory', data).then(r => r.data),
  createFromGitDiff: (data: object) => api.post<Review>('/reviews/git-diff', data).then(r => r.data),
  get: (id: string) => api.get<Review>(`/reviews/${id}`).then(r => r.data),
  list: (params?: object) => api.get<{ reviews: ReviewListItem[], total: number, page: number, size: number }>('/reviews', { params }).then(r => r.data),
  getStatus: (id: string) => api.get(`/reviews/${id}/status`).then(r => r.data),
}

export const analyticsApi = {
  getAgentAnalytics: (agentId: string) => api.get(`/analytics/agents/${agentId}`).then(r => r.data),
  getSummary: () => api.get('/analytics/summary').then(r => r.data),
}

export const rulesApi = {
  list: () => api.get('/rules').then(r => r.data),
  toggle: (ruleId: string, enabled: boolean) => api.post(`/rules/${ruleId}/toggle`, { enabled }).then(r => r.data),
  createRuleSet: (data: object) => api.post('/rule-sets', data).then(r => r.data),
}

export default api
