/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B6E4F",
          dark: "#094D38",
          light: "#E8F5EE",
        },
        gold: {
          DEFAULT: "#FFD166",
          dark: "#E6B84D",
        },
        background: "#F0FAF4",
        surface: "#FFFFFF",
        text: {
          primary: "#1A1A2E",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        error: "#E63946",
        success: "#10B981",
        warning: "#F59E0B",
        border: "#E5E7EB",
      },
    },
  },
  plugins: [],
};
