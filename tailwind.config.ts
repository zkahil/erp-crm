import type { Config } from "tailwindcss";

const v = (n: string) => `var(--${n})`;

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: v("canvas"), surface: v("surface"), sunken: v("sunken"), line: v("line"),
        ink: v("ink"), muted: v("muted"),
        brand: v("brand"), "brand-soft": v("brand-soft"),
        ok: v("ok"), "ok-soft": v("ok-soft"),
        warn: v("warn"), "warn-soft": v("warn-soft"),
        bad: v("bad"), "bad-soft": v("bad-soft"),
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
