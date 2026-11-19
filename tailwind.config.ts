import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          DEFAULT: "#6B3A2A",
          dark: "#4A2718",
          deep: "#3E241A",
          light: "#8B5A44",
        },
        cream: "#FAF6F0",
        sand: "#F5EFE6",
        gold: {
          DEFAULT: "#C9A227",
          dark: "#A9861F",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
