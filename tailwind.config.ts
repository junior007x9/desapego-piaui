import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Definição das novas cores baseadas na sua logo
        primary: {
          DEFAULT: '#4c1d95', // ROXO ESCURO (Textos principais, links) - Ex: Purple 950
          dark: '#3b0764',    // Roxo ainda mais escuro para hovers
        },
        accent: {
          DEFAULT: '#9333ea', // ROXO MAIS CLARO (Botões, Ações) - Ex: Purple 600
          dark: '#7e22ce',    // Hover do botão (Purple 700)
        },
        secondary: '#F3F4F6', // Cinza claro mantido
      },
    },
  },
  plugins: [],
};
export default config;