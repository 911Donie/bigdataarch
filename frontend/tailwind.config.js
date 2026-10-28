/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noc: {
          bg: '#0b1120',
          card: '#131e32',
          cardHover: '#18263f',
          border: '#1e2e48',
          cyan: '#06b6d4',
          cyanLight: '#22d3ee',
          violet: '#8b5cf6',
          violetLight: '#a78bfa',
          amber: '#f59e0b',
          rose: '#ef4444',
          emerald: '#10b981',
          textMuted: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
}
