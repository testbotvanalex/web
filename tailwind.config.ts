// tailwind.config.ts
import type { Config } from "tailwindcss"
import forms from "@tailwindcss/forms"
import typography from "@tailwindcss/typography"
import aspectRatio from "@tailwindcss/aspect-ratio"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ← у тебя тут уже есть colors.primary — оставь
      boxShadow: {
        soft: "0 8px 30px rgba(2, 6, 23, 0.06)",       // мягкая тень
        "soft-hover": "0 12px 40px rgba(2, 6, 23, 0.10)", // по желанию для hover
      },
    },
  },
  plugins: [forms, typography, aspectRatio],
}
export default config