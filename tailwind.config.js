/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["inter", "sans-serif", "Helvetica", "Arial"],
        "open-sans": ["Open Sans", "Helvetica", "Arial", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        accent: "#3498db",
        dark: "#141213",
        "dark-alt": "#1a1a1d",
        "dark-shade": "#232325",
        // "dark-shade": "#17171b",
        gray: "#D1D1D1",
        "light-blue": "#B0D4FF",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
