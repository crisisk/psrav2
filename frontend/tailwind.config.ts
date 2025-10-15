import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sevensa: {
          teal: '#00A896',
          'teal-dark': '#008577',
          'teal-light': '#33BBA9',
          dark: '#2D3A45',
          'dark-light': '#3F4E5A',
          light: '#F8F9FA',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '2rem',       // 32px
        '4xl': '3rem',       // 48px
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
      },
      boxShadow: {
        'sevensa': '0 4px 6px -1px rgba(0, 168, 150, 0.1), 0 2px 4px -1px rgba(0, 168, 150, 0.06)',
        'sevensa-lg': '0 10px 15px -3px rgba(0, 168, 150, 0.1), 0 4px 6px -2px rgba(0, 168, 150, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
export default config
