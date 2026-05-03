/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#a3e635',
        'accent-dim': '#84cc16',
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#111111',
        'bg-card': '#1a1a1a',
        'bg-elevated': '#222222',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#525252',
        border: '#2a2a2a',
      },
    },
  },
  plugins: [],
}
