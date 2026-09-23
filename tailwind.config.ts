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
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Sora', 'system-ui', '-apple-system', 'sans-serif'],
				display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					neon: 'hsl(var(--primary-neon))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				danger: 'hsl(var(--danger))',
				magenta: {
					DEFAULT: 'hsl(var(--magenta))',
					soft: 'hsl(var(--magenta-soft))'
				},
				cyan: {
					DEFAULT: 'hsl(var(--cyan))',
					soft: 'hsl(var(--cyan-soft))'
				},
				violet: 'hsl(var(--violet))',
				amber: 'hsl(var(--amber))',
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					sunken: 'hsl(var(--surface-sunken))',
					deep: 'hsl(var(--surface-deep))'
				},
				faint: 'hsl(var(--faint-foreground))',
				dim: 'hsl(var(--dim-foreground))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				card: 'var(--radius-card)',
				button: 'var(--radius-button)',
				pill: 'var(--radius-pill)',
				habit: 'var(--radius-habit)',
			},
			boxShadow: {
				'glow-magenta': 'var(--glow-magenta)',
				'glow-cyan': 'var(--glow-cyan)',
				'glow-violet': 'var(--glow-violet)',
			},
			transitionDuration: {
				'smooth': '200ms'
			},
			transitionTimingFunction: {
				'smooth': 'ease-in-out'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'neon-ignite': {
					'0%': { opacity: '0.15' },
					'12%': { opacity: '0.95' },
					'20%': { opacity: '0.25' },
					'30%': { opacity: '1' },
					'38%': { opacity: '0.45' },
					'48%, 100%': { opacity: '1' },
				},
				'glow-pulse': {
					'0%': { boxShadow: '0 0 0 0 rgba(255, 46, 151, 0.45)' },
					'50%': { boxShadow: '0 0 22px 8px rgba(255, 46, 151, 0.16)' },
					'100%': { boxShadow: '0 0 0 0 rgba(255, 46, 151, 0)' },
				},
				'check-pop': {
					'0%': { transform: 'scale(0.85)', opacity: '0.5' },
					'60%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'neon-ignite': 'neon-ignite 520ms steps(1, end) 1',
				'glow-pulse': 'glow-pulse 450ms ease-out',
				'check-pop': 'check-pop 180ms ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
