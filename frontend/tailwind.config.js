/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg:      '#f0ebe0',
        surface: '#faf8f3',
        warm:    '#ede8db',
        border:  '#e0d9cc',
        ink:     '#2d2a24',
        muted:   '#6b6456',
        faint:   '#9e9484',
        green:   { DEFAULT:'#4a7c59', bg:'#e8f0eb', text:'#2e5c3e' },
        red:     { DEFAULT:'#b84040', bg:'#f5e8e8', text:'#8b2020' },
        amber:   { DEFAULT:'#c07a30', bg:'#f5eedf', text:'#8b5a1a' },
        blue:    { DEFAULT:'#3a6a9a', bg:'#e8eff8', text:'#1e4a7a' },
      },
      borderRadius: { sm:'8px', DEFAULT:'12px', lg:'18px', xl:'24px' },
      boxShadow: {
        sm: '0 1px 3px rgba(60,50,30,0.08)',
        md: '0 4px 12px rgba(60,50,30,0.10)',
        lg: '0 8px 24px rgba(60,50,30,0.14)',
      },
    },
  },
  plugins: [],
}
