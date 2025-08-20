// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // шкала primary для bg-primary-600 / hover:bg-primary-700 и т.д.
        primary: {
          50:  "#f2f7ff",
          100: "#e6f0ff",
          200: "#cce0ff",
          300: "#99c2ff",
          400: "#66a3ff",
          500: "#3385ff",
          600: "#2563eb", // используется как bg-primary-600
          700: "#1d4ed8", // используется как hover:bg-primary-700
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      boxShadow: {
        // даст утилиту shadow-soft
        soft: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        '2xl': '1rem',
      },
      transitionTimingFunction: {
        'soft': 'cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;