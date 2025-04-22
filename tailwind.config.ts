import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#6366F1", // SmartVid purple
          light: "#818CF8",
          dark: "#4F46E5",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "#06B6D4", // Vibrant Sky/Teal
          light: "#22D3EE",
          dark: "#0891B2",
          foreground: "hsl(var(--secondary-foreground))"
        },
        success: {
          DEFAULT: "#10B981", // Success green
          foreground: "hsl(var(--success-foreground))"
        },
        warning: {
          DEFAULT: "#F59E0B", // Warning amber
          foreground: "hsl(var(--warning-foreground))"
        },
        destructive: {
          DEFAULT: "#EF4444", // Error red
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "#6B7280", // Secondary text
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "#6366F1", // Same as primary for consistency
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        shine: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center"
          }
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)"
          },
          "50%": {
            transform: "translateY(-20px) translateX(10px)"
          }
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "0.6",
            transform: "scale(1)"
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.05)"
          }
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0"
          },
          "100%": {
            backgroundPosition: "200% 0"
          }
        },
        typing: {
          from: { width: "0" },
          to: { width: "100%" }
        },
        "blink-caret": {
          from: { borderColor: "transparent" },
          "50%": { borderColor: "currentColor" },
          to: { borderColor: "transparent" }
        },
        slideDownAndFade: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeftAndFade: {
          from: { opacity: '0', transform: 'translateX(4px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUpAndFade: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRightAndFade: {
          from: { opacity: '0', transform: 'translateX(-4px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shine: "shine 8s ease-in-out infinite",
        "gradient-xy": "gradient-xy 15s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        shimmer: "shimmer 3s infinite",
        typing: "typing 3.5s steps(40, end)",
        "blink-caret": "blink-caret 0.75s step-end infinite",
        slideDownAndFade: 'slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideLeftAndFade: 'slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideUpAndFade: 'slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideRightAndFade: 'slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: '#6366F1', // Primary color for links
              '&:hover': {
                color: '#4F46E5', // Darker shade on hover
              },
              textDecoration: 'underline',
            },
            h1: {
              fontWeight: 700,
            },
            h2: {
              fontWeight: 700,
            },
            h3: {
              fontWeight: 600,
            },
            h4: {
              fontWeight: 600,
            },
          },
        },
      },
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
} satisfies Config;
