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
        background: '#0B0F19',
        surface: '#111827',
        'surface-light': '#1F2937',
        'surface-border': '#374151',
        brand: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
        speed: {
          download: '#38BDF8', // Cyan-Blue
          upload: '#A855F7',   // Purple
          latency: '#F59E0B',  // Amber
          jitter: '#10B981',   // Emerald
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
