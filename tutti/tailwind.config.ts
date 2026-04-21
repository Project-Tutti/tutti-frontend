import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 커스텀 색상
        "bg-deep": "#05070a",
        surface: "#0f1218",
        "sidebar-bg": "#0a0c10",
        "accent-blue": "#3b82f6",
        "border-color": "#1e293b",
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Pretendard Variable",
          "Pretendard",
          "sans-serif",
        ],
      },
      zIndex: {
        100: "100",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-lg": "0 0 30px rgba(59, 130, 246, 0.4)",
        "glow-sm": "0 0 15px rgba(59, 130, 246, 0.5)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      spacing: {
        18: "72px",
        77: "308px",
      },
    },
  },
  plugins: [],
};

export default config;
