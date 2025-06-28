/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00B3B0', // Turquesa principal
          50: '#E6FAFA',
          100: '#CCF5F5',
          200: '#99EBEB',
          300: '#66E0E0',
          400: '#33D6D6',
          500: '#00CCCC',
          600: '#00B3B0', // Color corporativo principal
          700: '#008F8C',
          800: '#006B69',
          900: '#004746',
        },
        cyan: {
          DEFAULT: '#0CA5E9', // Cyan principal
          50: '#E6F6FD',
          100: '#CCE8FA',
          200: '#99D1F5',
          300: '#66BBEF',
          400: '#33A4EA',
          500: '#0CA5E9',
          600: '#0B8CC8',
          700: '#0970A0',
          800: '#065478',
          900: '#043850',
        },
      },
    },
  },
  plugins: [],
}

