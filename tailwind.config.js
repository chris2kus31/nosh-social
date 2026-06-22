/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Nosh brand palette (from the web app gradients) — extend as design firms up
        nosh: {
          maroon: '#590219',
          plum: '#5E4F73',
          brown: '#3d2102',
          rust: '#733702',
        },
      },
    },
  },
  plugins: [],
};
