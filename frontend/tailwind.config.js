export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#0d0f14',
        bg2:    '#141720',
        bg3:    '#1c2030',
        card:   '#1e2235',
        accent: '#5b8af5',
        green:  '#3ecf8e',
        orange: '#f5a623',
        red:    '#e85d5d',
        purple: '#9b7ef8',
        muted:  '#8890a8',
        dim:    '#555d75',
      },
      fontFamily: { sans: ['DM Sans','sans-serif'], mono: ['DM Mono','monospace'] },
    }
  },
  plugins: []
}
