/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      black: "#222222",
      gray: "#dedede",
      red: "#ff0000",
      white: "#ffffff",
    },
    fontFamily: {
      monospace: ["monospace", "sans-serif"],
    },
    extend: {},
  },
  plugins: [],
};
