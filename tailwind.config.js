/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
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
        'neon': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'neon-lg': '0 0 30px -5px rgba(16, 185, 129, 0.45)',
        'blue-glow': '0 0 20px -5px rgba(59, 130, 246, 0.35)',
        'gold-glow': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
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
