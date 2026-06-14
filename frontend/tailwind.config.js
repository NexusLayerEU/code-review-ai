/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0f',
        surface: '#111118',
        card: '#16161f',
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          soft: 'rgba(99,102,241,0.12)',
          glow: 'rgba(99,102,241,0.15)',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          soft: 'rgba(139,92,246,0.12)',
        },
        'text-primary': '#f1f5f9',
        'text-muted': '#64748b',
        'border-subtle': 'rgba(255,255,255,0.06)',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'accent-gradient-subtle': 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99,102,241,0.12)',
        'glow': '0 0 20px rgba(99,102,241,0.15)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(99,102,241,0.1)' },
          '50%': { boxShadow: '0 0 24px rgba(99,102,241,0.3)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
}
