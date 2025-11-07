/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        primary: "#2D5BFF",
        success: "#0FA958",
        warning: "#E2B62B",
        danger: "#D83A3A",
        muted: "#6B7280",
        bg: "#F9FAFB",
        text: "#111827",
      },
      spacing: {
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      borderRadius: {
        md: "12px",
        xl: "16px",
      },
      boxShadow: {
        subtle: "0 2px 4px rgba(0,0,0,0.08)",
        header: "0 2px 8px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
