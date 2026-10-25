import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#123D2B", 700: "#1a5039", 900: "#0c2a1e" },
        ivory: { DEFAULT: "#FAF8F2", 200: "#F3EFE4" },
        gold: { DEFAULT: "#C5A66A", 600: "#a98a4f" },
        sage: { DEFAULT: "#A8B69A", 200: "#dfe5d8" },
        beige: "#EDE4D3",
      },
      fontFamily: {
        sans: ["var(--font-ibm)", "system-ui", "sans-serif"],
        display: ["var(--font-amiri)", "serif"],
        latin: ["var(--font-cormorant)", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(18,61,43,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
