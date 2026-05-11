import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sew-green": {
          DEFAULT: "#2D5016",
          light: "#3d6b1f",
          dark: "#1e3610",
        },
        "sew-cream": {
          DEFAULT: "#FAF7F0",
          dark: "#F0EAD6",
        },
        "sew-gold": {
          DEFAULT: "#C8922A",
          light: "#e0a830",
          dark: "#a07520",
        },
        "sew-slate": "#2C3E2D",
        "sew-tan": "#8B7355",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
