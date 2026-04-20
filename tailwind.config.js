/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',    // bg-slate-900 oscuro principal
        surface: '#1e293b',       // bg-slate-800 tarjetas y sidebar
        primary: '#3b82f6',       // bg-blue-500 acento principal
        primaryDark: '#2563eb',
        textLight: '#f8fafc',     // text-slate-50
        textMuted: '#94a3b8',     // text-slate-400
        success: '#10b981',       // bg-emerald-500
        danger: '#ef4444',        // bg-red-500
        warning: '#f59e0b',       // bg-amber-500
      }
    },
  },
  plugins: [],
}
