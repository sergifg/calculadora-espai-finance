import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        espai: {
          naranja: '#f58134',
          'naranja-dark': '#d96a1a',
          azul: '#002F4F',
          'azul-mid': '#293C5B',
          'azul-light': '#35415b',
          gris: '#f2f4f7',
          'gris-borde': '#e3e7f0',
          texto: '#231f20',
          'texto-suave': '#727f9f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
