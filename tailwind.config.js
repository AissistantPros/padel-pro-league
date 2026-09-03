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
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'sm': ['1rem', { lineHeight: '1.5rem' }],        // 16px
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        'xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }],   // 28px
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
        '4xl': ['2.75rem', { lineHeight: '3rem' }],      // 44px
        '5xl': ['3.5rem', { lineHeight: '3.75rem' }],    // 56px
      },
      colors: {
        ios: {
          bg: '#000000',
          card: '#1C1C1E',
          card2: '#2C2C2E',
          card3: '#3A3A3C',
          separator: '#38383A',
          subtle: '#2C2C2E',
          green: '#30D158',
          blue: '#0A84FF',
          yellow: '#FFD60A',
          orange: '#FF9F0A',
          red: '#FF453A',
          purple: '#BF5AF2',
          gray: '#8E8E93',
          gray2: '#636366',
          gray3: '#48484A',
          gray4: '#3A3A3C',
          gray5: '#2C2C2E',
          gray6: '#1C1C1E',
        },
        padel: {
          dark: '#000000',
          card: '#1C1C1E',
          cardLight: '#2C2C2E',
          neon: '#30D158',      // Apple Mint / Green
          neonBright: '#34D399',
          accent: '#0A84FF',    // Apple Blue
          cyan: '#64D2FF',
          gold: '#FFD60A',
          silver: '#E5E5EA',
          bronze: '#FF9F0A',
          copper: '#AC8E68',
          border: '#2C2C2E',
          surface: '#1C1C1E'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro"', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'ios-sheet': '0 -10px 40px rgba(0, 0, 0, 0.75)',
        'ios-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'ios-glow-green': '0 0 25px rgba(48, 209, 88, 0.3)',
        'ios-glow-blue': '0 0 25px rgba(10, 132, 255, 0.3)',
        'ios-glow-gold': '0 0 25px rgba(255, 214, 10, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
