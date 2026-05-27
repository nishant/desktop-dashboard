import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Semantic theme tokens ─────────────────────────────────────────
        // Each maps to a CSS custom property (RGB triple) set by [data-theme].
        // Supports opacity modifiers: bg-th-surface/50, text-th-hi/80, etc.
        'th-bg':          'rgb(var(--t-bg)          / <alpha-value>)',
        'th-surface':     'rgb(var(--t-surface)     / <alpha-value>)',
        'th-elevated':    'rgb(var(--t-elevated)    / <alpha-value>)',
        'th-overlay':     'rgb(var(--t-overlay)     / <alpha-value>)',
        'th-line':        'rgb(var(--t-line)        / <alpha-value>)',
        'th-hi':          'rgb(var(--t-hi)          / <alpha-value>)',
        'th-2':           'rgb(var(--t-2)           / <alpha-value>)',
        'th-3':           'rgb(var(--t-3)           / <alpha-value>)',
        'th-ghost':       'rgb(var(--t-ghost)       / <alpha-value>)',
        'th-accent':      'rgb(var(--t-accent)      / <alpha-value>)',
        'th-bar':         'rgb(var(--t-bar)         / <alpha-value>)',
        // inverted pair for "today" pill, active toggles, etc.
        'th-invert-bg':   'rgb(var(--t-invert-bg)   / <alpha-value>)',
        'th-invert-text': 'rgb(var(--t-invert-text) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
