/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        accent: "#6A1E55",
        dark: "#17171b",
        // dark: "#1A1A1D",
        "dark-shade": "#141213",
        // plum: "#051F17",
        plum: "#3B1C32",
        "plum-light": "#A64D79",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
