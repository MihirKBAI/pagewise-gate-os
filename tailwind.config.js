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
        os: {
          hit: '#10b981',      // Emerald green
          fault: '#ef4444',    // Rose red
          candidate: '#f59e0b',// Amber
          neutral: '#3b82f6',  // Blue
          purple: '#8b5cf6',   // Violet
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
