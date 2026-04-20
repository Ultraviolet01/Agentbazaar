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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "#f5a623",
        background: "#0a0b0d", // Exact Match
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#f5a623", // Amber primary
          foreground: "0 0% 0%",
        },
        secondary: {
          DEFAULT: "#13151a", // Secondary dark
          foreground: "#9ca3af",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#13151a",
          foreground: "#9ca3af",
        },
        accent: {
          DEFAULT: "#f5a623",
          foreground: "#000000",
        },
        card: {
          DEFAULT: "#13151a",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "12px", // Cards
        md: "10px",
        sm: "8px", // Buttons
      },
    },
  },
  plugins: [],
};
export default config;
