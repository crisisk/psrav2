import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './demo/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Sevensa Brand Primary
        'sevensa-teal': {
          50: '#E5F9F7',
          100: '#CCF3EF',
          200: '#99E7DF',
          300: '#66DBCF',
          400: '#33CFBF',
          500: '#00A896', // PRIMARY
          600: '#008678',
          700: '#00645A',
          800: '#00433C',
          900: '#00211E',
          DEFAULT: '#00A896',
        },

        // Sevensa Brand Secondary
        'sevensa-dark': {
          50: '#E8EAEC',
          100: '#D1D5D9',
          200: '#A3ABB3',
          300: '#75818D',
          400: '#475767',
          500: '#2D3A45', // SECONDARY
          600: '#242E37',
          700: '#1B2329',
          800: '#12171C',
          900: '#090C0E',
          DEFAULT: '#2D3A45',
        },

        // Semantic Colors
        success: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
        },
        error: {
          DEFAULT: '#F44336',
          light: '#E57373',
          dark: '#D32F2F',
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFB74D',
          dark: '#F57C00',
        },
        info: {
          DEFAULT: '#00A896',
          light: '#33CFBF',
          dark: '#008678',
        },

        // Functional Colors - Light Mode
        bg: {
          base: '#FFFFFF',
          surface: '#F8F9FA',
          muted: '#E9ECEF',
          hover: '#DEE2E6',
        },
        text: {
          primary: '#2D3A45',
          secondary: '#6C757D',
          muted: '#ADB5BD',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#DEE2E6',
          muted: '#E9ECEF',
          strong: '#ADB5BD',
        },

        // Dark Mode Colors
        dark: {
          bg: {
            base: '#0F1419',
            surface: '#1A1F26',
            muted: '#242A33',
            hover: '#2E3740',
          },
          text: {
            primary: '#F8F9FA',
            secondary: '#ADB5BD',
            muted: '#6C757D',
          },
          border: {
            DEFAULT: '#2E3740',
            muted: '#242A33',
            strong: '#475767',
          },
        },

        // Legacy support
        brand: '#00A896',
        'brand-on': '#FFFFFF',
        danger: '#F44336',
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },

      boxShadow: {
        'xs': '0 1px 2px 0 rgba(45, 58, 69, 0.05)',
        'sm': '0 1px 3px 0 rgba(45, 58, 69, 0.1), 0 1px 2px 0 rgba(45, 58, 69, 0.06)',
        'DEFAULT': '0 4px 6px -1px rgba(45, 58, 69, 0.1), 0 2px 4px -1px rgba(45, 58, 69, 0.06)',
        'md': '0 10px 15px -3px rgba(45, 58, 69, 0.1), 0 4px 6px -2px rgba(45, 58, 69, 0.05)',
        'lg': '0 20px 25px -5px rgba(45, 58, 69, 0.1), 0 10px 10px -5px rgba(45, 58, 69, 0.04)',
        'xl': '0 25px 50px -12px rgba(45, 58, 69, 0.25)',
        'soft': '0 8px 30px rgba(0,0,0,0.06)',
        'card': '0 2px 10px rgba(45,58,69,0.07)',
      },

      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        'full': '9999px',
      },

      transitionDuration: {
        DEFAULT: '200ms',
        'fast': '150ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'ease-in-out',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config

export default config
