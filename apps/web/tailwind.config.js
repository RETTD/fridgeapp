/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
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
        // Semantic colors that automatically adapt to dark mode
        bg: {
          primary: 'var(--background)',
          card: 'var(--card-bg)',
          nav: 'var(--nav-bg)',
          input: 'var(--input-bg)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          card: 'var(--card-border)',
          nav: 'var(--nav-border)',
          input: 'var(--input-border)',
        },
      },
      backgroundColor: {
        'card': 'var(--card-bg)',
        'nav': 'var(--nav-bg)',
        'input': 'var(--input-bg)',
      },
      textColor: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'muted': 'var(--text-muted)',
      },
      borderColor: {
        'card': 'var(--card-border)',
        'nav': 'var(--nav-border)',
        'input': 'var(--input-border)',
      },
    },
  },
  plugins: [],
}
