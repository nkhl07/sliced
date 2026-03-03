import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme (existing Operator Dashboard / Voice Ordering)
        background: '#0a0c12',
        surface: '#13151f',
        'surface-2': '#1c1f2e',
        'surface-3': '#252839',
        gold: '#c9a96e',
        'gold-light': '#e0c08a',
        'gold-dark': '#a07840',
        jade: '#4ade80',
        crimson: '#f87171',
        amber: '#fbbf24',
        muted: '#6b7280',
        'text-primary': '#f0ede8',
        'text-secondary': '#9ca3af',

        // Warm organic theme (Guest Portal / Owner Portal / Landing)
        'warm-bg': '#FDFCF8',
        'deep-stone': '#1C1917',
        'apple-red': '#CC0000',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1.2s steps(3) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        typing: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
