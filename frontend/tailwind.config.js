/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy scale — the app's base surface colors in dark mode.
        navy: {
          950: '#0B1220',
          900: '#0F1A2E',
          800: '#131B2E',
          700: '#1B2740',
          600: '#293A5C',
        },
        // Signature accents, used deliberately and sparingly.
        teal: {
          400: '#3DDCB8',
          500: '#00C9A7',
          600: '#00A98F',
        },
        sky: {
          400: '#4FC3F7',
          500: '#29B0EE',
        },
        slate: {
          150: '#EAEEF4',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 201, 167, 0.15), 0 8px 24px -8px rgba(0, 201, 167, 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
