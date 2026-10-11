import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        ink: 'var(--color-ink)',
        primary: 'var(--color-primary)',
      },
      fontFamily: {
        sans: 'var(--font-body)',
      },
    },
  },
  plugins: [],
} satisfies Config;
