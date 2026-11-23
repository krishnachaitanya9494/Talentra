/** @type {import('tailwindcss').Config} */
import defaultColors from 'tailwindcss/colors';

// Export Tailwind CSS configuration object.
export default {
  // Enable class-based dark mode toggling using the 'dark' CSS class on html/body.
  darkMode: 'class',
  // Specify paths to all template and component files containing Tailwind utility classes.
  content: [
    // Include the root HTML file.
    "./index.html",
    // Include all JavaScript and JSX source files.
    "./src/**/*.{js,ts,jsx,tsx}",
    "../feature-modules/0[1-6]-*/frontend/**/*.{js,ts,jsx,tsx}",
  ],
  // Extend default Tailwind theme tokens.
  theme: {
    extend: {
      // Custom color palette tailored for modern AI-first SaaS design.
      colors: {
        // Override dark slate shades with neutral carbon/black (zero blue/navy tint in dark mode).
        slate: {
          ...defaultColors.slate,
          700: '#27272A',
          800: '#141416',
          900: '#09090B',
          950: '#000000',
        },
        // Dark navy primary palette for typography and prominent headers.
        navy: {
          950: '#070C18', // Deepest canvas navy
          900: '#0F172A', // Main dark navy text
          800: '#1E293B', // Slate navy secondary headers
          700: '#334155', // Muted navy text
          600: '#475569', // Subtle text
          500: '#64748B', // Neutral placeholder
        },
        // Muted forest green is the single interface accent.
        brand: {
          50: '#F0F5F0',
          100: '#DDE9DF',
          200: '#C3D6C6',
          300: '#A4BEA9',
          400: '#73977B',
          500: '#4E8059',
          600: '#3B6B47',
          700: '#2F573A',
          800: '#264832',
          900: '#1E3C28',
          950: '#13271A',
        },
        indigo: {
          50: '#F0F5F0',
          100: '#DDE9DF',
          200: '#C3D6C6',
          300: '#A4BEA9',
          400: '#73977B',
          500: '#4E8059',
          600: '#3B6B47',
          700: '#2F573A',
          800: '#264832',
          900: '#1E3C28',
          950: '#13271A',
        },
        purple: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
        // Neutral alias for secondary emphasis; status colors remain semantic.
        accent: {
          50: '#F4F4F5',
          100: '#E4E4E7',
          200: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          900: '#27272A',
          950: '#18181B',
        },
        // Clean neutral background canvas supporting both light and dark themes.
        surface: {
          50: '#F6F7F5',
          100: '#EFF1EE',
          200: '#E1E5E0',
          card: '#FFFFFF',
          dark: '#121512',
          darkCanvas: '#121512',
          darkCard: '#191D19',
          darkCardSecondary: '#222722',
          darkHover: '#282E28',
          darkBorder: '#303630',
        }
      },
      // Use one interface family for consistent, quiet typography.
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xl: '0.625rem',
        '2xl': '0.875rem',
        '3xl': '1rem',
      },
      // Centralized application-wide typography scale tokens.
      fontSize: {
        'page-title': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }], // 30px (28-32px range)
        'section-title': ['1.375rem', { lineHeight: '1.28', letterSpacing: '-0.015em', fontWeight: '700' }], // 22px (22-24px range)
        'card-title': ['1.1875rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }], // 19px (18-20px range)
        'kpi-value': ['2.125rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }], // 34px (30-36px range)
        'kpi-label': ['0.9375rem', { lineHeight: '1.4', fontWeight: '500' }], // 15px (14-16px range)
        'table-header': ['0.90625rem', { lineHeight: '1.4', fontWeight: '600' }], // 14.5px (14-15px range)
        'table-body': ['0.9375rem', { lineHeight: '1.5', fontWeight: '400' }], // 15px (15-16px range)
        'form-label': ['0.9375rem', { lineHeight: '1.45', fontWeight: '500' }], // 15px (15-16px range)
        'input-text': ['1rem', { lineHeight: '1.5', fontWeight: '400' }], // 16px
        'btn-text': ['0.9375rem', { lineHeight: '1.4', fontWeight: '600' }], // 15px (15-16px range)
        'nav-item': ['0.9375rem', { lineHeight: '1.4', fontWeight: '500' }], // 15px (15-16px range)
        'helper-text': ['0.84375rem', { lineHeight: '1.5', fontWeight: '400' }], // 13.5px (13-14px range)
        'badge-text': ['0.8125rem', { lineHeight: '1.3', fontWeight: '500' }], // 13px (13-14px range)
      },
      // Neutral elevation only; avoid colored glow effects.
      boxShadow: {
        'subtle': '0 1px 2px rgba(24, 32, 25, 0.05)',
        'card': '0 1px 3px rgba(24, 32, 25, 0.06)',
        'card-hover': '0 4px 10px rgba(24, 32, 25, 0.08)',
        'dropdown': '0 8px 20px rgba(24, 32, 25, 0.12)',
        'glow-brand': '0 1px 3px rgba(24, 32, 25, 0.08)',
        'glow-accent': '0 1px 3px rgba(24, 32, 25, 0.08)',
      }
    },
  },
  // Plugins configuration.
  plugins: [],
};
