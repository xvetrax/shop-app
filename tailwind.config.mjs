/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,css}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#faf5f0",
          100: "#f3e9dd",
          200: "#e6d4bf"
        },
        cocoa: {
          600: "#7c5a3c",
          700: "#5f422a"
        }
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
