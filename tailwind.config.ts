import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Tokens are RGB channels in index.css, so `<alpha-value>` lets every
      // opacity modifier (bg-card/60, border-border/40, fill-team-primary/20)
      // resolve instead of being silently dropped.
      colors: {
        page: 'rgb(var(--bg-page) / <alpha-value>)',
        card: 'rgb(var(--bg-card) / <alpha-value>)',
        'card-hover': 'rgb(var(--bg-card-hover) / <alpha-value>)',
        border: 'rgb(var(--border-color) / <alpha-value>)',
        main: 'rgb(var(--text-main) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        'team-primary': 'rgb(var(--team-primary) / <alpha-value>)',
        'team-secondary': 'rgb(var(--team-secondary) / <alpha-value>)',
        'field-grass': 'rgb(var(--field-grass) / <alpha-value>)',
        'field-infield': 'rgb(var(--field-infield) / <alpha-value>)',
        'field-dirt': 'rgb(var(--field-dirt) / <alpha-value>)',
        'field-line': 'rgb(var(--field-line) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config;
