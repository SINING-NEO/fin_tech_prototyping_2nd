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
        pru: {
          red: "#ED1B2E",
          "red-dark": "#C41220",
          "red-light": "#FDEAEC",
          gray: "#58595B",
          "gray-dark": "#333333",
          "gray-light": "#F4F4F4",
          "gray-border": "#E5E5E5",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica Neue", "Segoe UI", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        chat: "0 4px 24px rgba(0, 0, 0, 0.12)",
        pill: "0 2px 12px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
