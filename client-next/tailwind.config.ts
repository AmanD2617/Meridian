import type { Config } from 'tailwindcss';

/**
 * Meridian design tokens — single source of truth for the whole app.
 *
 * Colors follow a simple mental model:
 *   - `brand.*`    → indigo→violet primary gradient stops
 *   - `surface.*`  → sidebar (dark) + content (light) base colors
 *   - `ink.*`      → text color ramp
 *   - Status (`success`, `warning`, `danger`, `ai`) → semantic accents
 *
 * Radius defaults to 2xl cards. Shadows are soft and layered.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // indigo primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          violet: '#8b5cf6',
        },
        surface: {
          sidebar:   '#0b1020', // deep indigo-black
          sidebarHi: '#151b34', // hover / active block on sidebar
          content:   '#f7f8fb', // light main area
          card:      '#ffffff',
          muted:     '#f1f3f9',
        },
        ink: {
          50:  '#f8fafc',
          100: '#eef1f7',
          200: '#d9dfea',
          300: '#b0b8cc',
          400: '#7f8aa6',
          500: '#5a6585',
          600: '#3e4766',
          700: '#2a3350',
          800: '#1a2038',
          900: '#0f1428',
        },
        success: {
          DEFAULT: '#10b981',
          soft:    '#d1fae5',
          ink:     '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft:    '#fef3c7',
          ink:     '#92400e',
        },
        danger: {
          DEFAULT: '#f43f5e',
          soft:    '#ffe4e6',
          ink:     '#9f1239',
        },
        ai: {
          DEFAULT: '#6366f1',
          soft:    '#eef2ff',
          ink:     '#3730a3',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card:    '0 1px 2px 0 rgb(15 20 40 / 0.04), 0 1px 3px 0 rgb(15 20 40 / 0.06)',
        soft:    '0 4px 12px -2px rgb(15 20 40 / 0.08), 0 2px 6px -2px rgb(15 20 40 / 0.05)',
        lift:    '0 12px 32px -12px rgb(15 20 40 / 0.18), 0 4px 10px -4px rgb(15 20 40 / 0.08)',
        glow:    '0 0 0 1px rgb(99 102 241 / 0.4), 0 8px 24px -8px rgb(99 102 241 / 0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.10) 100%)',
        'hero-grid': 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.25)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.25s ease-out both',
        'pulse-dot':'pulse-dot 1.6s ease-in-out infinite',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
