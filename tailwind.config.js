/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores del Logo - Branding Principal
        'brand-cyan': {
          DEFAULT: '#00E5FF', // Cyan eléctrico del logo
          50: '#E0FCFF',
          100: '#B8F5FF',
          200: '#85EDFF',
          300: '#52E5FF',
          400: '#1FDDFF',
          500: '#00E5FF', // Principal
          600: '#00B8D4', // Hover
          700: '#008BA3',
          800: '#005E70',
          900: '#00313D',
        },
        'brand-navy': {
          DEFAULT: '#0B1120', // Navy oscuro del logo
          50: '#E8EAF0',
          100: '#C5CAD9',
          200: '#9EA6BF',
          300: '#7782A5',
          400: '#596791',
          500: '#3B4C7D',
          600: '#2D3A5E',
          700: '#1F2840',
          800: '#151C2E',
          900: '#0B1120', // Principal (más oscuro)
        },
        // Colores legacy (mantener compatibilidad)
        primary: {
          DEFAULT: '#00E5FF', // Actualizado a cyan del logo
          50: '#E0FCFF',
          100: '#B8F5FF',
          200: '#85EDFF',
          300: '#52E5FF',
          400: '#1FDDFF',
          500: '#00E5FF',
          600: '#00B8D4',
          700: '#008BA3',
          800: '#005E70',
          900: '#00313D',
        },
        cyan: {
          DEFAULT: '#00E5FF', // Actualizado a cyan del logo
          50: '#E0FCFF',
          100: '#B8F5FF',
          200: '#85EDFF',
          300: '#52E5FF',
          400: '#1FDDFF',
          500: '#00E5FF',
          600: '#00B8D4',
          700: '#008BA3',
          800: '#005E70',
          900: '#00313D',
        },
        // Sistema de alertas corregido
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'soft-md': '0 6px 25px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'brand': '0 4px 20px rgba(0, 229, 255, 0.15)',
        'brand-lg': '0 8px 30px rgba(0, 229, 255, 0.25)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

