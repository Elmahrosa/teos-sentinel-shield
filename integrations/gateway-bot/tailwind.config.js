/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#e8c84a',
          500: '#d4af37',
          600: '#b8961e',
        },
      },
    },
  },
  plugins: [],
};
