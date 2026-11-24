/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode dikontrol oleh class `.app-dark` pada <html> (lihat stores/theme).
  darkMode: ['selector', '.app-dark'],
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Nilai sama dengan --font-family / --font-mono (styles/tokens/_typography.scss).
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      screens: {
        // Sesuai docs/07-responsive-guideline.md
        md: '768px', // tablet
        lg: '1024px', // laptop
        xl: '1440px', // desktop
      },
      maxWidth: {
        page: '1600px',
      },
    },
  },
  plugins: [],
}
