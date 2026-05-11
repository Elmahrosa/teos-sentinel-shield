import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#0a0a0a',
        surface: '#111113',
        surface2: '#18181c',
        'surface-3': '#1e1e22',
        border: 'rgba(255,255,255,0.07)',
        'border-bright': 'rgba(255,255,255,0.12)',
        red: '#e63333',
        'red-dim': 'rgba(230,51,51,0.12)',
        amber: '#e6a020',
        'amber-dim': 'rgba(230,160,32,0.12)',
        green: '#22c55e',
        'green-dim': 'rgba(34,197,94,0.1)',
        white: '#f0ede8',
        muted: 'rgba(240,237,232,0.45)',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"Syne"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
