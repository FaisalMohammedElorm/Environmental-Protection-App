import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canopy: {
          DEFAULT: "#0F2A1D",
          50: "#E8EFEA",
          100: "#C7D9CD",
          200: "#9FBEA9",
          300: "#6E9A7C",
          400: "#3F7455",
          500: "#1F7A4D",
          600: "#175C3A",
          700: "#123524",
          800: "#0C241A",
          900: "#081712"
        },
        moss: {
          DEFAULT: "#4FA66B",
          light: "#7FC494",
          dark: "#2E7A48"
        },
        mist: {
          DEFAULT: "#EAF3EC",
          dim: "#DCEBE1"
        },
        paper: "#FBFDFB",
        alert: {
          amber: "#E2933C",
          clay: "#C1523A"
        }
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        contour: "url('/textures/contour.svg')"
      },
      keyframes: {
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "75%, 100%": { transform: "scale(2.4)", opacity: "0" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "ping-slow": "ping-slow 2.5s cubic-bezier(0,0,0.2,1) infinite",
        rise: "rise 0.6s ease-out forwards"
      }
    }
  },
  plugins: []
};

export default config;
