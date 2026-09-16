import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        border: 'var(--border-color)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        'team-primary': 'var(--team-primary)',
        'team-secondary': 'var(--team-secondary)',
        'field-grass': 'var(--field-grass)',
        'field-infield': 'var(--field-infield)',
        'field-dirt': 'var(--field-dirt)',
        'field-line': 'var(--field-line)',
      },
    },
  },
  plugins: [],
} satisfies Config;
