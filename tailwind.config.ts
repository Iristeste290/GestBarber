import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Premium Gold Colors
        gold: {
          DEFAULT: "hsl(var(--gold-main))",
          main: "hsl(var(--gold-main))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        // Status Colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        // P2 FIX: Semantic colors for conversion components
        opportunity: {
          DEFAULT: "hsl(var(--opportunity))",
          foreground: "hsl(var(--opportunity-foreground))",
          muted: "hsl(var(--opportunity-muted) / 0.2)",
        },
        loss: {
          DEFAULT: "hsl(var(--loss))",
          foreground: "hsl(var(--loss-foreground))",
        },
        "alert-weak": {
          DEFAULT: "hsl(var(--alert-weak))",
          foreground: "hsl(var(--alert-weak-foreground))",
        },
        "alert-inactive": {
          DEFAULT: "hsl(var(--alert-inactive))",
          foreground: "hsl(var(--alert-inactive-foreground))",
        },
        "alert-slots": {
          DEFAULT: "hsl(var(--alert-slots))",
          foreground: "hsl(var(--alert-slots-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        'gold': '0 4px 20px hsl(43 33% 63% / 0.15)',
        'gold-lg': '0 8px 30px hsl(43 33% 63% / 0.2)',
        'premium': '0 4px 12px hsl(0 0% 0% / 0.4)',
        'premium-lg': '0 8px 24px hsl(0 0% 0% / 0.5)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, hsl(43 33% 63%), hsl(43 50% 77%))',
        'gradient-gold-subtle': 'linear-gradient(135deg, hsl(43 33% 63% / 0.1), hsl(43 50% 77% / 0.05))',
        'gradient-dark': 'linear-gradient(180deg, hsl(0 0% 4%), hsl(0 0% 7%))',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "gold-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 10px hsl(43 33% 63% / 0.1)",
          },
          "50%": {
            boxShadow: "0 0 20px hsl(43 33% 63% / 0.25)",
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
