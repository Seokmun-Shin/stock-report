import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0f172a", muted: "#64748b" },
        /** gain=상승·이익(빨강), loss=하락·손실(파랑) — globals.css 변수와 동기화 */
        gain: { DEFAULT: "var(--market-up)", soft: "var(--market-up-soft)" },
        loss: { DEFAULT: "var(--market-down)", soft: "var(--market-down-soft)" },
        surface: { DEFAULT: "#ffffff", dim: "#f8fafc" },
        line: "#e2e8f0",
      },
    },
  },
  plugins: [],
};
export default config;
