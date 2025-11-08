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
        surface: token("--color-surface"),
        surfaceDark: token("--color-surface-dark"),
        border: token("--color-border"),
        borderDark: token("--color-border-dark"),
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-foreground": "rgb(var(--card-foreground) / <alpha-value>)",
        popover: "rgb(var(--popover) / <alpha-value>)",
        "popover-foreground": "rgb(var(--popover-foreground) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        "secondary-foreground": "rgb(var(--secondary-foreground) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        "destructive-foreground": "rgb(var(--destructive-foreground) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
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
