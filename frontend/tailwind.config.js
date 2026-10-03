/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          darkest: '#030014',
          darker: '#080419',
          dark: '#0d0722',
          card: '#120a2e',
          border: '#231247',
          hover: '#1d1042',
        },
        sar: {
          purple: '#9d4edd',
          deepPurple: '#7b2cbf',
          cyan: '#00f0ff',
          blue: '#4895ef',
          indigo: '#3a0ca3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(157, 78, 221, 0.3), 0 0 20px rgba(0, 240, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(157, 78, 221, 0.7), 0 0 35px rgba(0, 240, 255, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
