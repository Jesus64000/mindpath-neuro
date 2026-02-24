/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mindpath: {
          dark:         'var(--color-dark, #1E1B4B)',
          primary:      'var(--color-primary, #6D28D9)',
          primaryHover: 'var(--color-primary-hover, #5B21B6)',
          light:        'var(--color-light, #F5F3FF)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
