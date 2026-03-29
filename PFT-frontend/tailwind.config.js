/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        background: "#f6f8ff",
        card: "#ffffff",
        primary: "#2f3da8",
        muted: "#6a7391"
      },
      boxShadow: {
        soft: "0 12px 40px -14px rgba(41, 59, 158, 0.28)",
        card: "0 10px 30px -14px rgba(15, 23, 42, 0.22)"
      },
      borderRadius: {
        xl2: "20px"
      }
    }
  },
  plugins: []
};