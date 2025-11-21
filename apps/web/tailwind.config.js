/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fridge: {
          primary: '#0EA5E9',      // Sky blue - główny kolor lodówki
          secondary: '#06B6D4',    // Cyan
          accent: '#3B82F6',       // Bright blue
          dark: '#0C4A6E',         // Dark blue
          light: '#E0F2FE',        // Light blue background
          ice: '#F0F9FF',          // Ice white
          cold: '#BAE6FD',         // Cold blue
        },
      },
    },
  },
  plugins: [],
}
