/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#F5B700',
          yellowDark: '#D99F00',
          soft: '#FBF8EE',
          border: '#EEE7CF',
          red: '#D7263D',
          redDark: '#B81D31',
          dark: '#1F2430',
          muted: '#667085',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
