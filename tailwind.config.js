const token = (name) => `var(${name})`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        primary: token("--color-primary"),
        success: token("--color-success"),
        warning: token("--color-warning"),
        danger: token("--color-danger"),
        muted: token("--color-muted"),
        bg: token("--color-bg"),
        text: token("--color-text"),
        surface: "#FFFFFF",
        surfaceDark: "#0F1116",
        border: "rgba(0,0,0,0.08)",
        borderDark: "rgba(255,255,255,0.12)",
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
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
      },
    },
  },
  plugins: [],
};
