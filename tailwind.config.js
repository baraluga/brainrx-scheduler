/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecf7fd',
          100: '#d8eefd',
          200: '#b3def9',
          300: '#8bccf3',
          400: '#60b7ea',
          500: '#3ea5e0', // requested primary
          600: '#2f8ec2',
          700: '#26729c',
          800: '#205e81',
        },
        ink: {
          900: '#1f2937', // slate-800-ish for strong headings
          700: '#374151',
          600: '#4b5563',
          500: '#6b7280', // body text
          400: '#9ca3af', // secondary text
        },
        warm: {
          50: '#fff7ed', // peachy background option
          100: '#ffedd5',
        }
      }
    },
  },
  plugins: [],
}