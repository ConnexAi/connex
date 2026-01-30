import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        connex: {
          navy: "#0b1c2d",
          offwhite: "#f5f5f5",
          wine: "#6a0000",
          accent: "#337ca0",
          gray: "#6b7280",
          border: "#d1d5db",
        },
      },
    },
  },
  plugins: [],
};

export default config;
