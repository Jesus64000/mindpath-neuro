/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mindpath: {
          dark: '#1E1B4B', // El fondo oscuro del panel izquierdo
          primary: '#6D28D9', // El violeta sólido del botón "Iniciar sesión"
          primaryHover: '#5B21B6',
          light: '#F5F3FF', // El fondo sutil de los inputs
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Asumiendo tipografía limpia y moderna
      }
    },
  },
  plugins: [],
}

