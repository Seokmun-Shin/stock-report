import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0f172a", muted: "#64748b" },
        gain: { DEFAULT: "#2563eb", soft: "#eff6ff" },
        loss: { DEFAULT: "#dc2626", soft: "#fef2f2" },
        surface: { DEFAULT: "#ffffff", dim: "#f8fafc" },
        line: "#e2e8f0",
      },
    },
  },
  plugins: [],
};
export default config;
