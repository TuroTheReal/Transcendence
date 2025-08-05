/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts}",
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'system': ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          500: '#646cff',
          600: '#535bf2',
          700: '#4a4af0',
        },
        neon: {
          green: '#00ff41',
          purple: '#a855f7',
          blue: '#3b82f6',
          pink: '#ec4899',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 0.1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 4px' },
        },
      },
      dropShadow: {
        'neon-green': ['0 0 5px #00ff41', '0 0 10px #00ff41', '0 0 15px #00ff41', '0 0 20px #00ff41'],
        'neon-purple': ['0 0 5px #a855f7', '0 0 10px #a855f7', '0 0 15px #a855f7', '0 0 20px #a855f7'],
        'neon-blue': ['0 0 5px #3b82f6', '0 0 10px #3b82f6', '0 0 15px #3b82f6', '0 0 20px #3b82f6'],
      },
      boxShadow: {
        'neon-green': '0 0 10px #00ff41, inset 0 0 10px #00ff41',
        'neon-purple': '0 0 10px #a855f7, inset 0 0 10px #a855f7',
        'neon-blue': '0 0 10px #3b82f6, inset 0 0 10px #3b82f6',
        'neon-green-lg': '0 0 20px #00ff41, inset 0 0 20px #00ff41',
        'neon-purple-lg': '0 0 20px #a855f7, inset 0 0 20px #a855f7',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} 