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
        // Official Bubur Khalid Brand Palette
        spicy: {
          ember: "#EE3F24",
          hover: "#D6331A",
          light: "#FEECE9",
        },
        noodle: {
          cream: "#FFEFCB",
          light: "#FFF8E7",
          dark: "#EAD6A5",
        },
        matcha: {
          leaf: "#023820",
          deep: "#012213",
          surface: "#0A4D2E",
          light: "#E7F0EB",
        },
        yolk: {
          blaze: "#F9A11B",
          light: "#FEF4E0",
          dark: "#D6840B",
        },
        tofu: {
          silkblaze: "#FFF4E6",
          card: "#FFFFFF",
          warm: "#FDF7EE",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(2, 56, 32, 0.06)",
        card: "0 4px 20px rgba(2, 56, 32, 0.08)",
        floating: "0 10px 30px rgba(2, 56, 32, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
