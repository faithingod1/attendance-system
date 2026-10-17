import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#176c57',
          hover: '#115140',
          dark: '#193b35',
        },
        ink: '#193b35',
        muted: '#586961',
        soft: '#e9f3ec',
        danger: '#a72c32',
        warning: '#765314',
        border: '#d6ded8',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
