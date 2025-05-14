/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'diet-green': '#4CAF50',
        'diet-blue': '#4FC3F7',
        'diet-orange': '#FF9800',
        'diet-gray': '#F5F5F5',
      },
      animation: {
        'bounce-slow': 'bounce 2s linear infinite',
      }
    },
  },
  plugins: [],
} 