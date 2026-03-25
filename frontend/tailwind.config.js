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
          primary:      'rgb(var(--color-primary-rgb, 109 40 217) / <alpha-value>)',
          primaryHover: 'rgb(var(--color-primary-hover-rgb, 91 33 182) / <alpha-value>)',
          light:        'var(--color-light, #F5F3FF)',
        }
      },
      fontFamily: {
        sans: ['var(--system-font)', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
