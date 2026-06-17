/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode dikontrol oleh class `.app-dark` pada <html> (lihat stores/theme).
  darkMode: ['selector', '.app-dark'],
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
