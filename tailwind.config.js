/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#c00000',
        'primary-dark': '#8b0000',
      }
    }
  },
  plugins: []
}
