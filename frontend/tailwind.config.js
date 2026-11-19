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
        // Subtle emerald / mint green accent palette for AI highlights and status.
        brand: {
          50: '#ECFDF5',  // Very light mint green background for badges/panels
          100: '#D1FAE5', // Soft green accent background
          200: '#A7F3D0', // Green border accent
          500: '#10B981', // Core brand green
          600: '#059669', // Darker brand green for buttons & focus
          700: '#047857', // High-contrast green text
          900: '#064E3B', // Deep dark green for dark mode pills
        },
        // Indigo / Electric Violet secondary palette for AI Intelligence, Analytics & visual depth.
        accent: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81',
          950: '#1E1B4B',
        },
        // Clean neutral background canvas supporting both light and dark themes.
        surface: {
          50: '#F8FAFC',  // Main app neutral canvas (light)
          100: '#F1F5F9', // Slightly darkened border/card hover (light)
          200: '#E2E8F0', // Border divider (light)
          card: '#FFFFFF', // Clean white card background (light)
          // True neutral pitch-black & carbon-zinc surfaces for Dark Mode (no navy tint).
          darkCanvas: '#000000', // True black main canvas
          darkCard: '#0A0A0A',   // Deep carbon-black primary card background
          darkBorder: '#1F1F23', // Neutral dark zinc border
          darkHover: '#17171A',  // Neutral elevated hover state
        }
      },
      // Configure crisp enterprise typography hierarchy.
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
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
      // Multi-layered enterprise shadows and subtle emerald AI glow tokens.
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        'card': '0 2px 6px -1px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(15, 23, 42, 0.12), 0 4px 10px -4px rgba(16, 185, 129, 0.10)',
        'dropdown': '0 14px 28px -6px rgba(15, 23, 42, 0.14), 0 4px 10px -4px rgba(15, 23, 42, 0.06)',
        'glow-brand': '0 6px 20px -4px rgba(16, 185, 129, 0.28), 0 2px 6px -1px rgba(16, 185, 129, 0.16)',
        'glow-accent': '0 6px 20px -4px rgba(99, 102, 241, 0.28), 0 2px 6px -1px rgba(99, 102, 241, 0.16)',
      }
    },
  },
  // Plugins configuration.
  plugins: [],
};
