/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#0F766E',
        'accent-dark': '#115E59',
        'accent-soft': '#DDF7F1',
        warn: '#FFF7ED',
        muted: '#4B5563',
      }
    },
  },
  plugins: [],
}
