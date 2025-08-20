/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef4ff",
          100: "#dfeaff",
          200: "#c2d5ff",
          300: "#9fbaff",
          400: "#7a9dff",
          500: "#5b8eff",
          600: "#4b7ef0",
          700: "#3f6ad1",
          800: "#3456a8",
          900: "#2a467f",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};