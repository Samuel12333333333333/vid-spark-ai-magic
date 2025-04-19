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
          DEFAULT: "#4F46E5", // Electric Indigo
          light: "#6366F1",
          dark: "#4338CA",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "#06B6D4", // Vibrant Sky/Teal
          light: "#22D3EE",
          dark: "#0891B2",
          foreground: "hsl(var(--secondary-foreground))"
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
          DEFAULT: "#06B6D4", // Same as secondary for consistency
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        success: "#10B981", // Success green
        warning: "#F59E0B", // Warning amber
        // Update smartvid colors to match new palette
        smartvid: {
          50: "#F9FAFB",  // Light mode background
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#4F46E5", // Primary brand color
          500: "#06B6D4", // Accent color
          600: "#4338CA",
          700: "#0891B2",
          800: "#1E293B", // Dark mode surface
          900: "#0F172A", // Dark mode background
          purple: "#4F46E5",
          indigo: "#6366F1"
        }
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
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shine: "shine 8s ease-in-out infinite",
        "gradient-xy": "gradient-xy 15s ease infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
