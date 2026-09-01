/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.8125rem', { lineHeight: '1.125rem' }], // 13px
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px (raised from 12px)
        'sm': ['1rem', { lineHeight: '1.5rem' }],        // 16px (raised from 14px - per user request!)
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px (raised from 16px)
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px (raised from 18px)
        'xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px (raised from 20px)
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }],   // 28px (raised from 24px)
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px (raised from 30px)
        '4xl': ['2.75rem', { lineHeight: '3rem' }],      // 44px (raised from 36px)
        '5xl': ['3.5rem', { lineHeight: '3.75rem' }],    // 56px (raised from 48px)
      },
      colors: {
        padel: {
          dark: '#0B0F19',
          card: '#121826',
          cardLight: '#1E293B',
          neon: '#10B981',      // vibrant emerald / electric neon green
          neonBright: '#34D399',
          accent: '#3B82F6',    // premier blue
          cyan: '#06B6D4',
          gold: '#F59E0B',
          silver: '#94A3B8',
          bronze: '#B45309',
          copper: '#D97706',
          border: '#1F2937',
          surface: '#182234'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'neon-lg': '0 0 30px -5px rgba(16, 185, 129, 0.5)',
        'blue-glow': '0 0 20px -5px rgba(59, 130, 246, 0.4)',
        'gold-glow': '0 0 25px -5px rgba(245, 158, 11, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.35s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
