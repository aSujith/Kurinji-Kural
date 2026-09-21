/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kurinji: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          500: "#8b5cf6",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        forest: {
          50: "#f4f9f4",
          500: "#15803d",
          600: "#166534",
          700: "#14532d",
        },
        amber: {
          500: "#f59e0b",
          600: "#d97706",
        }
      },
    },
  },
  plugins: [],
};
