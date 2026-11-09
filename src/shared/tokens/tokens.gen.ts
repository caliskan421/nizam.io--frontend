// BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. Kaynak: tokens/design-system.tokens.json + design/web-tokens.json; `pnpm gen:tokens`.

/** Kaynak pini: https://github.com/caliskan421/nizam.io--mobile@49593388d089a4ce0c2a17cafd423c9c75d6556c — docs/design/design sytem/tokens.json (blob 2e1521ab9fe632f81f418ed085d5ba0330c35bc6). */
export const DESIGN_TOKEN_PIN = {
  "repo": "https://github.com/caliskan421/nizam.io--mobile",
  "commit": "49593388d089a4ce0c2a17cafd423c9c75d6556c",
  "path": "docs/design/design sytem/tokens.json",
  "blob": "2e1521ab9fe632f81f418ed085d5ba0330c35bc6"
} as const

/** Temalar; ilki varsayılan (K9 "koyu varsayılan"). */
export const TOKEN_THEMES = ['dark', 'light'] as const
export const DEFAULT_THEME = 'dark' as const

/** Ad → { grup, köken, koyu, açık }. Değerler CSS’e hazırdır (başvurular var(--ad)). */
export const TOKENS = {
  "bg-base": {
    "group": "color",
    "origin": "source",
    "dark": "#0b0b0b",
    "light": "#f6f6f3"
  },
  "bg-surface": {
    "group": "color",
    "origin": "source",
    "dark": "#151515",
    "light": "#ffffff"
  },
  "bg-raised": {
    "group": "color",
    "origin": "source",
    "dark": "#1f1f1f",
    "light": "#f1f1ed"
  },
  "bg-overlay": {
    "group": "color",
    "origin": "source",
    "dark": "#2a2a2a",
    "light": "#e7e7e2"
  },
  "border-subtle": {
    "group": "color",
    "origin": "source",
    "dark": "#262626",
    "light": "#e5e5df"
  },
  "border-strong": {
    "group": "color",
    "origin": "source",
    "dark": "#3a3a3a",
    "light": "#d0d0c9"
  },
  "border-control": {
    "group": "color",
    "origin": "source",
    "dark": "#6b6b6b",
    "light": "#96968f"
  },
  "ink": {
    "group": "color",
    "origin": "source",
    "dark": "#f5f5f5",
    "light": "#161615"
  },
  "ink-muted": {
    "group": "color",
    "origin": "source",
    "dark": "#a1a1a1",
    "light": "#5c5c57"
  },
  "ink-faint": {
    "group": "color",
    "origin": "source",
    "dark": "#8a8a8a",
    "light": "#71716b"
  },
  "accent": {
    "group": "color",
    "origin": "source",
    "dark": "#c8f53c",
    "light": "#c8f53c"
  },
  "accent-ink": {
    "group": "color",
    "origin": "source",
    "dark": "#0b0b0b",
    "light": "#161615"
  },
  "accent-top": {
    "group": "color",
    "origin": "source",
    "dark": "#d8f866",
    "light": "#d8f866"
  },
  "accent-text": {
    "group": "color",
    "origin": "source",
    "dark": "#c8f53c",
    "light": "#4a6a00"
  },
  "focus-ring": {
    "group": "color",
    "origin": "source",
    "dark": "#c8f53c",
    "light": "#4a6a00"
  },
  "violet": {
    "group": "color",
    "origin": "source",
    "dark": "#9b30d9",
    "light": "#7a26c1"
  },
  "on-violet": {
    "group": "color",
    "origin": "source",
    "dark": "#ffffff",
    "light": "#ffffff"
  },
  "gold": {
    "group": "color",
    "origin": "source",
    "dark": "#ffd166",
    "light": "#a86f00"
  },
  "on-gold": {
    "group": "color",
    "origin": "source",
    "dark": "#0b0b0b",
    "light": "#ffffff"
  },
  "danger": {
    "group": "color",
    "origin": "source",
    "dark": "#ff5a5a",
    "light": "#d02b2b"
  },
  "on-danger": {
    "group": "color",
    "origin": "source",
    "dark": "#0b0b0b",
    "light": "#ffffff"
  },
  "btn-top": {
    "group": "color",
    "origin": "source",
    "dark": "#323232",
    "light": "#ffffff"
  },
  "btn-bottom": {
    "group": "color",
    "origin": "source",
    "dark": "#262626",
    "light": "#f4f4f0"
  },
  "btn-border": {
    "group": "color",
    "origin": "source",
    "dark": "#3c3c3c",
    "light": "#d5d5ce"
  },
  "surface-top": {
    "group": "color",
    "origin": "source",
    "dark": "#1c1c1c",
    "light": "#ffffff"
  },
  "edge-light": {
    "group": "color",
    "origin": "source",
    "dark": "#ffffff12",
    "light": "#ffffffcc"
  },
  "scrim": {
    "group": "color",
    "origin": "source",
    "dark": "#0000008c",
    "light": "#16161566"
  },
  "gp-todo": {
    "group": "color",
    "origin": "source",
    "dark": "#b4b7be",
    "light": "#d3d6dc"
  },
  "gp-doing": {
    "group": "color",
    "origin": "source",
    "dark": "#c27ce6",
    "light": "#d2a2ee"
  },
  "gp-review": {
    "group": "color",
    "origin": "source",
    "dark": "#ffd166",
    "light": "#ffdc85"
  },
  "gp-back": {
    "group": "color",
    "origin": "source",
    "dark": "#ff9a85",
    "light": "#ffb4a4"
  },
  "gp-done": {
    "group": "color",
    "origin": "source",
    "dark": "#c8f53c",
    "light": "#d6f56f"
  },
  "gp-late": {
    "group": "color",
    "origin": "source",
    "dark": "#ff7d7d",
    "light": "#ffa0a0"
  },
  "gp-late-line": {
    "group": "color",
    "origin": "source",
    "dark": "#ff5a5a",
    "light": "#d02b2b"
  },
  "gp-ink": {
    "group": "color",
    "origin": "source",
    "dark": "#17181c",
    "light": "#17181c"
  },
  "gp-ink-muted": {
    "group": "color",
    "origin": "source",
    "dark": "#4a4d55",
    "light": "#4a4d55"
  },
  "role-admin": {
    "group": "color",
    "origin": "source",
    "dark": "#e57a9a",
    "light": "#e57a9a"
  },
  "role-koord": {
    "group": "color",
    "origin": "source",
    "dark": "#74c27a",
    "light": "#74c27a"
  },
  "role-uye": {
    "group": "color",
    "origin": "source",
    "dark": "#73a9e3",
    "light": "#73a9e3"
  },
  "glass-bar": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(11, 11, 11, 0.78)",
    "light": "rgba(246, 246, 243, 0.78)"
  },
  "glass-float": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(18, 18, 18, 0.74)",
    "light": "rgba(255, 255, 255, 0.78)"
  },
  "glass-menu": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(24, 24, 24, 0.86)",
    "light": "rgba(255, 255, 255, 0.92)"
  },
  "glass-edge": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(255, 255, 255, 0.08)",
    "light": "rgba(22, 22, 21, 0.10)"
  },
  "glass-ink": {
    "group": "color",
    "origin": "source",
    "dark": "#f5f5f5",
    "light": "#161615"
  },
  "glass-ink-faint": {
    "group": "color",
    "origin": "source",
    "dark": "#8a8a8a",
    "light": "#71716b"
  },
  "nav-highlight": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(255, 255, 255, 0.13)",
    "light": "rgba(22, 22, 21, 0.08)"
  },
  "scrim-soft": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(0, 0, 0, 0.28)",
    "light": "rgba(22, 22, 21, 0.18)"
  },
  "bubble-mine": {
    "group": "color",
    "origin": "source",
    "dark": "#414b22",
    "light": "#f3fdd4"
  },
  "bubble-other": {
    "group": "color",
    "origin": "source",
    "dark": "var(--bg-raised)",
    "light": "var(--bg-raised)"
  },
  "quote-fill": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(255, 255, 255, 0.06)",
    "light": "rgba(22, 22, 21, 0.05)"
  },
  "ref-chip": {
    "group": "color",
    "origin": "source",
    "dark": "#373d23",
    "light": "#ecf2d4"
  },
  "day-chip": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(40, 40, 40, 0.80)",
    "light": "rgba(231, 231, 226, 0.85)"
  },
  "switch-knob": {
    "group": "color",
    "origin": "source",
    "dark": "#ffffff",
    "light": "#ffffff"
  },
  "folder-back": {
    "group": "color",
    "origin": "source",
    "dark": "#6e6e6e",
    "light": "#a8a8a2"
  },
  "folder-front": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(175, 175, 175, 0.55)",
    "light": "rgba(255, 255, 255, 0.60)"
  },
  "folder-front-mid": {
    "group": "color",
    "origin": "source",
    "dark": "rgba(95, 95, 95, 0.55)",
    "light": "rgba(210, 210, 204, 0.55)"
  },
  "avatar-1": {
    "group": "color",
    "origin": "source",
    "dark": "#c8f53c",
    "light": "#c8f53c"
  },
  "avatar-2": {
    "group": "color",
    "origin": "source",
    "dark": "#b39dff",
    "light": "#b39dff"
  },
  "avatar-3": {
    "group": "color",
    "origin": "source",
    "dark": "#ffd166",
    "light": "#ffd166"
  },
  "avatar-4": {
    "group": "color",
    "origin": "source",
    "dark": "#6ec1ff",
    "light": "#6ec1ff"
  },
  "avatar-5": {
    "group": "color",
    "origin": "source",
    "dark": "#ff8a65",
    "light": "#ff8a65"
  },
  "on-avatar": {
    "group": "color",
    "origin": "source",
    "dark": "#121212",
    "light": "#121212"
  },
  "font-sans": {
    "group": "font",
    "origin": "source",
    "dark": "\"Inter\", system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
    "light": "\"Inter\", system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif"
  },
  "font-display": {
    "group": "font",
    "origin": "source",
    "dark": "\"Poppins\", \"Inter\", system-ui, sans-serif",
    "light": "\"Poppins\", \"Inter\", system-ui, sans-serif"
  },
  "font-mono": {
    "group": "font",
    "origin": "source",
    "dark": "\"Geist Mono\", ui-monospace, SFMono-Regular, Menlo, monospace",
    "light": "\"Geist Mono\", ui-monospace, SFMono-Regular, Menlo, monospace"
  },
  "m-greet": {
    "group": "type",
    "origin": "source",
    "dark": "600 30px/36px var(--font-display)",
    "light": "600 30px/36px var(--font-display)"
  },
  "m-greet-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "-0.015em",
    "light": "-0.015em"
  },
  "m-kpi": {
    "group": "type",
    "origin": "source",
    "dark": "600 30px/34px var(--font-display)",
    "light": "600 30px/34px var(--font-display)"
  },
  "m-kpi-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "-0.02em",
    "light": "-0.02em"
  },
  "m-h1": {
    "group": "type",
    "origin": "source",
    "dark": "600 28px/34px var(--font-display)",
    "light": "600 28px/34px var(--font-display)"
  },
  "m-h1-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "-0.015em",
    "light": "-0.015em"
  },
  "m-h1-detail": {
    "group": "type",
    "origin": "source",
    "dark": "600 24px/30px var(--font-display)",
    "light": "600 24px/30px var(--font-display)"
  },
  "m-h1-detail-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "-0.01em",
    "light": "-0.01em"
  },
  "m-sheet-title": {
    "group": "type",
    "origin": "source",
    "dark": "600 20px/26px var(--font-display)",
    "light": "600 20px/26px var(--font-display)"
  },
  "m-title-input": {
    "group": "type",
    "origin": "source",
    "dark": "600 20px/28px var(--font-display)",
    "light": "600 20px/28px var(--font-display)"
  },
  "m-brand": {
    "group": "type",
    "origin": "source",
    "dark": "600 16px/20px var(--font-display)",
    "light": "600 16px/20px var(--font-display)"
  },
  "m-brand-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "-0.01em",
    "light": "-0.01em"
  },
  "m-card-title": {
    "group": "type",
    "origin": "source",
    "dark": "600 16px/22px var(--font-sans)",
    "light": "600 16px/22px var(--font-sans)"
  },
  "m-input": {
    "group": "type",
    "origin": "source",
    "dark": "400 16px/21px var(--font-sans)",
    "light": "400 16px/21px var(--font-sans)"
  },
  "m-message": {
    "group": "type",
    "origin": "source",
    "dark": "400 15px/21px var(--font-sans)",
    "light": "400 15px/21px var(--font-sans)"
  },
  "m-list": {
    "group": "type",
    "origin": "source",
    "dark": "500 15px/20px var(--font-sans)",
    "light": "500 15px/20px var(--font-sans)"
  },
  "m-body": {
    "group": "type",
    "origin": "source",
    "dark": "400 14px/20px var(--font-sans)",
    "light": "400 14px/20px var(--font-sans)"
  },
  "m-nav-label": {
    "group": "type",
    "origin": "source",
    "dark": "600 13px/16px var(--font-sans)",
    "light": "600 13px/16px var(--font-sans)"
  },
  "m-tab": {
    "group": "type",
    "origin": "source",
    "dark": "600 13px/16px var(--font-sans)",
    "light": "600 13px/16px var(--font-sans)"
  },
  "m-caption": {
    "group": "type",
    "origin": "source",
    "dark": "400 12px/16px var(--font-sans)",
    "light": "400 12px/16px var(--font-sans)"
  },
  "m-code": {
    "group": "type",
    "origin": "source",
    "dark": "400 13px/20px var(--font-mono)",
    "light": "400 13px/20px var(--font-mono)"
  },
  "m-kicker": {
    "group": "type",
    "origin": "source",
    "dark": "500 12px/16px var(--font-mono)",
    "light": "500 12px/16px var(--font-mono)"
  },
  "m-kicker-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "0.02em",
    "light": "0.02em"
  },
  "m-mono-sm": {
    "group": "type",
    "origin": "source",
    "dark": "400 11px/14px var(--font-mono)",
    "light": "400 11px/14px var(--font-mono)"
  },
  "m-program": {
    "group": "type",
    "origin": "source",
    "dark": "400 10px/13px var(--font-mono)",
    "light": "400 10px/13px var(--font-mono)"
  },
  "m-program-tracking": {
    "group": "type",
    "origin": "source",
    "dark": "0.02em",
    "light": "0.02em"
  },
  "m-gutter": {
    "group": "spacing",
    "origin": "source",
    "dark": "16px",
    "light": "16px"
  },
  "m-gap-xs": {
    "group": "spacing",
    "origin": "source",
    "dark": "4px",
    "light": "4px"
  },
  "m-gap-sm": {
    "group": "spacing",
    "origin": "source",
    "dark": "8px",
    "light": "8px"
  },
  "m-gap-md": {
    "group": "spacing",
    "origin": "source",
    "dark": "10px",
    "light": "10px"
  },
  "m-gap-lg": {
    "group": "spacing",
    "origin": "source",
    "dark": "18px",
    "light": "18px"
  },
  "m-gap-xl": {
    "group": "spacing",
    "origin": "source",
    "dark": "24px",
    "light": "24px"
  },
  "m-row-pad": {
    "group": "spacing",
    "origin": "source",
    "dark": "14px",
    "light": "14px"
  },
  "m-card-pad": {
    "group": "spacing",
    "origin": "source",
    "dark": "16px",
    "light": "16px"
  },
  "m-r-bubble-tail": {
    "group": "radius",
    "origin": "source",
    "dark": "6px",
    "light": "6px"
  },
  "m-r-folder": {
    "group": "radius",
    "origin": "source",
    "dark": "10px",
    "light": "10px"
  },
  "m-r-tile": {
    "group": "radius",
    "origin": "source",
    "dark": "12px",
    "light": "12px"
  },
  "m-r-attach": {
    "group": "radius",
    "origin": "source",
    "dark": "14px",
    "light": "14px"
  },
  "m-r-group": {
    "group": "radius",
    "origin": "source",
    "dark": "16px",
    "light": "16px"
  },
  "m-r-row": {
    "group": "radius",
    "origin": "source",
    "dark": "18px",
    "light": "18px"
  },
  "m-r-card": {
    "group": "radius",
    "origin": "source",
    "dark": "20px",
    "light": "20px"
  },
  "m-r-flyout": {
    "group": "radius",
    "origin": "source",
    "dark": "26px",
    "light": "26px"
  },
  "m-r-sheet": {
    "group": "radius",
    "origin": "source",
    "dark": "28px",
    "light": "28px"
  },
  "m-r-pill": {
    "group": "radius",
    "origin": "source",
    "dark": "9999px",
    "light": "9999px"
  },
  "m-sh-float": {
    "group": "shadow",
    "origin": "source",
    "dark": "0 12px 32px rgba(0,0,0,0.45)",
    "light": "0 10px 28px rgba(22,22,21,0.14)"
  },
  "m-sh-menu": {
    "group": "shadow",
    "origin": "source",
    "dark": "0 20px 48px rgba(0,0,0,0.55)",
    "light": "0 20px 48px rgba(22,22,21,0.16)"
  },
  "m-sh-drawer": {
    "group": "shadow",
    "origin": "source",
    "dark": "-24px 0 60px rgba(0,0,0,0.45)",
    "light": "-24px 0 60px rgba(22,22,21,0.14)"
  },
  "m-sh-sheet": {
    "group": "shadow",
    "origin": "source",
    "dark": "0 24px 64px rgba(0,0,0,0.6)",
    "light": "0 24px 64px rgba(22,22,21,0.14)"
  },
  "m-sh-thumb": {
    "group": "shadow",
    "origin": "source",
    "dark": "0 1px 2px rgba(0,0,0,0.25)",
    "light": "0 1px 2px rgba(22,22,21,0.12)"
  },
  "m-sh-knob": {
    "group": "shadow",
    "origin": "source",
    "dark": "0 1px 3px rgba(0,0,0,0.35)",
    "light": "0 1px 3px rgba(0,0,0,0.35)"
  },
  "m-tap": {
    "group": "size",
    "origin": "source",
    "dark": "44px",
    "light": "44px"
  },
  "m-appbar": {
    "group": "size",
    "origin": "source",
    "dark": "56px",
    "light": "56px"
  },
  "m-nav": {
    "group": "size",
    "origin": "source",
    "dark": "64px",
    "light": "64px"
  },
  "m-row": {
    "group": "size",
    "origin": "source",
    "dark": "52px",
    "light": "52px"
  },
  "m-tab-h": {
    "group": "size",
    "origin": "source",
    "dark": "36px",
    "light": "36px"
  },
  "m-composer": {
    "group": "size",
    "origin": "source",
    "dark": "40px",
    "light": "40px"
  },
  "m-blur-bar": {
    "group": "blur",
    "origin": "source",
    "dark": "18px",
    "light": "18px"
  },
  "m-blur-chat": {
    "group": "blur",
    "origin": "source",
    "dark": "20px",
    "light": "20px"
  },
  "m-blur-float": {
    "group": "blur",
    "origin": "source",
    "dark": "22px",
    "light": "22px"
  },
  "m-blur-menu": {
    "group": "blur",
    "origin": "source",
    "dark": "24px",
    "light": "24px"
  },
  "m-blur-folder": {
    "group": "blur",
    "origin": "source",
    "dark": "8px",
    "light": "8px"
  },
  "rp-done-fill": {
    "group": "color",
    "origin": "web",
    "dark": "var(--accent-text)",
    "light": "#7fb800"
  },
  "shadow-card": {
    "group": "shadow",
    "origin": "web",
    "dark": "0 12px 32px rgba(0,0,0,0.5)",
    "light": "0 1px 2px rgba(22,22,21,0.05), 0 6px 20px rgba(22,22,21,0.06)"
  },
  "shadow-sheet": {
    "group": "shadow",
    "origin": "web",
    "dark": "var(--m-sh-sheet)",
    "light": "var(--m-sh-sheet)"
  },
  "rp-seg-on-shadow": {
    "group": "shadow",
    "origin": "web",
    "dark": "inset 0 0 0 1px var(--border-strong)",
    "light": "0 1px 2px rgba(17,17,17,0.08), inset 0 0 0 1px var(--border-subtle)"
  },
  "rp-bubble-them-shadow": {
    "group": "shadow",
    "origin": "web",
    "dark": "none",
    "light": "0 1px 1px rgba(22,22,21,0.06)"
  },
  "space-1": {
    "group": "space",
    "origin": "web",
    "dark": "4px",
    "light": "4px"
  },
  "space-2": {
    "group": "space",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "space-3": {
    "group": "space",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "space-4": {
    "group": "space",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "space-5": {
    "group": "space",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "space-6": {
    "group": "space",
    "origin": "web",
    "dark": "24px",
    "light": "24px"
  },
  "space-8": {
    "group": "space",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "space-10": {
    "group": "space",
    "origin": "web",
    "dark": "40px",
    "light": "40px"
  },
  "space-12": {
    "group": "space",
    "origin": "web",
    "dark": "48px",
    "light": "48px"
  },
  "space-16": {
    "group": "space",
    "origin": "web",
    "dark": "64px",
    "light": "64px"
  },
  "radius-xs": {
    "group": "radius",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "radius-sm": {
    "group": "radius",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "radius-md": {
    "group": "radius",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "radius-lg": {
    "group": "radius",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "radius-xl": {
    "group": "radius",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "radius-full": {
    "group": "radius",
    "origin": "web",
    "dark": "9999px",
    "light": "9999px"
  },
  "control-sm": {
    "group": "size",
    "origin": "web",
    "dark": "36px",
    "light": "36px"
  },
  "control-md": {
    "group": "size",
    "origin": "web",
    "dark": "44px",
    "light": "44px"
  },
  "control-lg": {
    "group": "size",
    "origin": "web",
    "dark": "52px",
    "light": "52px"
  },
  "icon-sm": {
    "group": "size",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "icon-md": {
    "group": "size",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "icon-lg": {
    "group": "size",
    "origin": "web",
    "dark": "24px",
    "light": "24px"
  },
  "focus-ring-width": {
    "group": "focus",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "focus-ring-offset": {
    "group": "focus",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "text-display-xl": {
    "group": "text",
    "origin": "web",
    "dark": "600 48px/52px var(--font-display)",
    "light": "600 48px/52px var(--font-display)"
  },
  "text-display-lg": {
    "group": "text",
    "origin": "web",
    "dark": "600 36px/42px var(--font-display)",
    "light": "600 36px/42px var(--font-display)"
  },
  "text-heading-1": {
    "group": "text",
    "origin": "web",
    "dark": "600 28px/34px var(--font-display)",
    "light": "600 28px/34px var(--font-display)"
  },
  "text-heading-2": {
    "group": "text",
    "origin": "web",
    "dark": "600 22px/28px var(--font-display)",
    "light": "600 22px/28px var(--font-display)"
  },
  "text-title": {
    "group": "text",
    "origin": "web",
    "dark": "600 18px/26px var(--font-sans)",
    "light": "600 18px/26px var(--font-sans)"
  },
  "text-body-lg": {
    "group": "text",
    "origin": "web",
    "dark": "400 16px/24px var(--font-sans)",
    "light": "400 16px/24px var(--font-sans)"
  },
  "text-body": {
    "group": "text",
    "origin": "web",
    "dark": "400 14px/20px var(--font-sans)",
    "light": "400 14px/20px var(--font-sans)"
  },
  "text-body-strong": {
    "group": "text",
    "origin": "web",
    "dark": "600 14px/20px var(--font-sans)",
    "light": "600 14px/20px var(--font-sans)"
  },
  "text-caption": {
    "group": "text",
    "origin": "web",
    "dark": "400 12px/16px var(--font-sans)",
    "light": "400 12px/16px var(--font-sans)"
  },
  "text-button": {
    "group": "text",
    "origin": "web",
    "dark": "500 14px/20px var(--font-sans)",
    "light": "500 14px/20px var(--font-sans)"
  },
  "text-label": {
    "group": "text",
    "origin": "web",
    "dark": "500 12px/16px var(--font-mono)",
    "light": "500 12px/16px var(--font-mono)"
  },
  "text-mono-body": {
    "group": "text",
    "origin": "web",
    "dark": "400 13px/20px var(--font-mono)",
    "light": "400 13px/20px var(--font-mono)"
  },
  "rp-side-w": {
    "group": "layout",
    "origin": "web",
    "dark": "272px",
    "light": "272px"
  },
  "rp-rail-w": {
    "group": "layout",
    "origin": "web",
    "dark": "76px",
    "light": "76px"
  },
  "rp-main-basis": {
    "group": "layout",
    "origin": "web",
    "dark": "560px",
    "light": "560px"
  },
  "rp-topbar-h": {
    "group": "layout",
    "origin": "web",
    "dark": "64px",
    "light": "64px"
  },
  "rp-topbar-pad-y": {
    "group": "layout",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "rp-head-basis": {
    "group": "layout",
    "origin": "web",
    "dark": "320px",
    "light": "320px"
  },
  "rp-col-basis": {
    "group": "layout",
    "origin": "web",
    "dark": "620px",
    "light": "620px"
  },
  "rp-aside-basis": {
    "group": "layout",
    "origin": "web",
    "dark": "340px",
    "light": "340px"
  },
  "rp-aside-max": {
    "group": "layout",
    "origin": "web",
    "dark": "380px",
    "light": "380px"
  },
  "rp-row-h": {
    "group": "layout",
    "origin": "web",
    "dark": "56px",
    "light": "56px"
  },
  "rp-seg-h": {
    "group": "layout",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "rp-tab-h": {
    "group": "layout",
    "origin": "web",
    "dark": "40px",
    "light": "40px"
  },
  "rp-menu-row-h": {
    "group": "layout",
    "origin": "web",
    "dark": "36px",
    "light": "36px"
  },
  "rp-narrow-max": {
    "group": "layout",
    "origin": "web",
    "dark": "900px",
    "light": "900px"
  },
  "ui-hairline": {
    "group": "ui",
    "origin": "web",
    "dark": "1px",
    "light": "1px"
  },
  "ui-focus-width": {
    "group": "ui",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "ui-backdrop-blur": {
    "group": "ui",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "ui-fs-xs": {
    "group": "ui",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "ui-fs-sm": {
    "group": "ui",
    "origin": "web",
    "dark": "13px",
    "light": "13px"
  },
  "ui-text-sm-medium": {
    "group": "ui",
    "origin": "web",
    "dark": "500 13px/20px var(--font-sans)",
    "light": "500 13px/20px var(--font-sans)"
  },
  "ui-text-sm-strong": {
    "group": "ui",
    "origin": "web",
    "dark": "600 13px/20px var(--font-sans)",
    "light": "600 13px/20px var(--font-sans)"
  },
  "ui-text-xs-strong": {
    "group": "ui",
    "origin": "web",
    "dark": "600 12px/16px var(--font-sans)",
    "light": "600 12px/16px var(--font-sans)"
  },
  "ui-text-stat": {
    "group": "ui",
    "origin": "web",
    "dark": "600 40px/44px var(--font-display)",
    "light": "600 40px/44px var(--font-display)"
  },
  "ui-gap-2xs": {
    "group": "ui",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "ui-gap-xs": {
    "group": "ui",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "ui-gap-sm": {
    "group": "ui",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "ui-pill-h": {
    "group": "ui",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "ui-count-size": {
    "group": "ui",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "ui-chip-x": {
    "group": "ui",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "ui-check-size": {
    "group": "ui",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "ui-check-border": {
    "group": "ui",
    "origin": "web",
    "dark": "1.5px",
    "light": "1.5px"
  },
  "ui-check-mark": {
    "group": "ui",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "ui-input-icon-pad": {
    "group": "ui",
    "origin": "web",
    "dark": "46px",
    "light": "46px"
  },
  "ui-select-chevron-inset": {
    "group": "ui",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "ui-kbd-size": {
    "group": "ui",
    "origin": "web",
    "dark": "24px",
    "light": "24px"
  },
  "ui-kbd-pad": {
    "group": "ui",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "ui-nav-pad-y": {
    "group": "ui",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "ui-navlist-pad-y": {
    "group": "ui",
    "origin": "web",
    "dark": "9px",
    "light": "9px"
  },
  "ui-nav-bar-w": {
    "group": "ui",
    "origin": "web",
    "dark": "4px",
    "light": "4px"
  },
  "ui-nav-bar-h": {
    "group": "ui",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "ui-seg-h": {
    "group": "ui",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "ui-seg-pressed-shadow-light": {
    "group": "ui",
    "origin": "web",
    "dark": "0 1px 2px color-mix(in srgb, var(--ink) 8%, transparent)",
    "light": "0 1px 2px color-mix(in srgb, var(--ink) 8%, transparent)"
  },
  "ui-tab-h": {
    "group": "ui",
    "origin": "web",
    "dark": "40px",
    "light": "40px"
  },
  "ui-tab-bar": {
    "group": "ui",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "ui-stat-aside-w": {
    "group": "ui",
    "origin": "web",
    "dark": "144px",
    "light": "144px"
  },
  "ui-modal-w": {
    "group": "ui",
    "origin": "web",
    "dark": "560px",
    "light": "560px"
  },
  "ui-toast-offset": {
    "group": "ui",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "ui-toast-pad-x": {
    "group": "ui",
    "origin": "web",
    "dark": "18px",
    "light": "18px"
  },
  "ui-toast-radius": {
    "group": "ui",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "ui-av-sm": {
    "group": "ui",
    "origin": "web",
    "dark": "26px",
    "light": "26px"
  },
  "ui-av-md": {
    "group": "ui",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "ui-av-lg": {
    "group": "ui",
    "origin": "web",
    "dark": "52px",
    "light": "52px"
  },
  "ui-av-xl": {
    "group": "ui",
    "origin": "web",
    "dark": "72px",
    "light": "72px"
  },
  "ui-av-fs-sm": {
    "group": "ui",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "ui-av-fs-md": {
    "group": "ui",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "ui-av-fs-lg": {
    "group": "ui",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "ui-av-fs-xl": {
    "group": "ui",
    "origin": "web",
    "dark": "22px",
    "light": "22px"
  },
  "side-logo-radius": {
    "group": "side",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "side-raillogo-radius": {
    "group": "side",
    "origin": "web",
    "dark": "11px",
    "light": "11px"
  },
  "side-label-font": {
    "group": "side",
    "origin": "web",
    "dark": "400 10.5px/13px var(--font-mono)",
    "light": "400 10.5px/13px var(--font-mono)"
  },
  "side-value-font": {
    "group": "side",
    "origin": "web",
    "dark": "600 13px/18px var(--font-sans)",
    "light": "600 13px/18px var(--font-sans)"
  },
  "side-chevron": {
    "group": "side",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "side-pav": {
    "group": "side",
    "origin": "web",
    "dark": "18px",
    "light": "18px"
  },
  "side-pav-radius": {
    "group": "side",
    "origin": "web",
    "dark": "5px",
    "light": "5px"
  },
  "side-pav-fs": {
    "group": "side",
    "origin": "web",
    "dark": "8.5px",
    "light": "8.5px"
  },
  "side-pav-lg": {
    "group": "side",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "side-pav-lg-fs": {
    "group": "side",
    "origin": "web",
    "dark": "11px",
    "light": "11px"
  },
  "side-dot": {
    "group": "side",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "side-item-radius": {
    "group": "side",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "side-navgroups-gap": {
    "group": "side",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "side-badge-w": {
    "group": "side",
    "origin": "web",
    "dark": "22px",
    "light": "22px"
  },
  "side-badge-h": {
    "group": "side",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "side-badge-radius": {
    "group": "side",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "topbar-nav-size": {
    "group": "topbar",
    "origin": "web",
    "dark": "30px",
    "light": "30px"
  },
  "topbar-nav-icon": {
    "group": "topbar",
    "origin": "web",
    "dark": "18px",
    "light": "18px"
  },
  "topbar-crumb-fs": {
    "group": "topbar",
    "origin": "web",
    "dark": "13px",
    "light": "13px"
  },
  "topbar-dot": {
    "group": "topbar",
    "origin": "web",
    "dark": "7px",
    "light": "7px"
  },
  "topbar-dot-top": {
    "group": "topbar",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "topbar-dot-right": {
    "group": "topbar",
    "origin": "web",
    "dark": "7px",
    "light": "7px"
  },
  "list-min-w": {
    "group": "work",
    "origin": "web",
    "dark": "640px",
    "light": "640px"
  },
  "list-cols": {
    "group": "work",
    "origin": "web",
    "dark": "20px minmax(0, 1fr) 124px 132px 60px",
    "light": "20px minmax(0, 1fr) 124px 132px 60px"
  },
  "list-row-h": {
    "group": "work",
    "origin": "web",
    "dark": "64px",
    "light": "64px"
  },
  "list-meta-cols": {
    "group": "work",
    "origin": "web",
    "dark": "38px 48px minmax(0, 1fr) auto",
    "light": "38px 48px minmax(0, 1fr) auto"
  },
  "list-gap-3xs": {
    "group": "work",
    "origin": "web",
    "dark": "3px",
    "light": "3px"
  },
  "list-fs-2xs": {
    "group": "work",
    "origin": "web",
    "dark": "11px",
    "light": "11px"
  },
  "list-dot": {
    "group": "work",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "list-dot-ring": {
    "group": "work",
    "origin": "web",
    "dark": "1.5px",
    "light": "1.5px"
  },
  "list-cap-dot": {
    "group": "work",
    "origin": "web",
    "dark": "5px",
    "light": "5px"
  },
  "list-cap-dot-gap": {
    "group": "work",
    "origin": "web",
    "dark": "7px",
    "light": "7px"
  },
  "list-pill-h": {
    "group": "work",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "list-pill-radius": {
    "group": "work",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "list-pill-pad": {
    "group": "work",
    "origin": "web",
    "dark": "7px",
    "light": "7px"
  },
  "list-tog-pad-start": {
    "group": "work",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "list-tog-icon": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "list-tag-icon": {
    "group": "work",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "list-av-overlap": {
    "group": "work",
    "origin": "web",
    "dark": "-3px",
    "light": "-3px"
  },
  "list-av-ring": {
    "group": "work",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "list-tip-offset": {
    "group": "work",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "list-tip-pad": {
    "group": "work",
    "origin": "web",
    "dark": "4px 8px",
    "light": "4px 8px"
  },
  "list-tip-radius": {
    "group": "work",
    "origin": "web",
    "dark": "7px",
    "light": "7px"
  },
  "list-tip-font": {
    "group": "work",
    "origin": "web",
    "dark": "500 11px/14px var(--font-sans)",
    "light": "500 11px/14px var(--font-sans)"
  },
  "list-tip-shift": {
    "group": "work",
    "origin": "web",
    "dark": "3px",
    "light": "3px"
  },
  "list-sel-bar": {
    "group": "work",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "list-subs-pad": {
    "group": "work",
    "origin": "web",
    "dark": "10px 16px 12px 52px",
    "light": "10px 16px 12px 52px"
  },
  "list-skel-h": {
    "group": "work",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "wd-sheet-gap": {
    "group": "work",
    "origin": "web",
    "dark": "18px",
    "light": "18px"
  },
  "wd-head-gap": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "wd-title-font": {
    "group": "work",
    "origin": "web",
    "dark": "600 20px/26px var(--font-display)",
    "light": "600 20px/26px var(--font-display)"
  },
  "wd-fs": {
    "group": "work",
    "origin": "web",
    "dark": "13px",
    "light": "13px"
  },
  "wd-tabs-gap": {
    "group": "work",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "wd-tabs-fade": {
    "group": "work",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "wd-dl-label-min": {
    "group": "work",
    "origin": "web",
    "dark": "88px",
    "light": "88px"
  },
  "wd-dl-gap-y": {
    "group": "work",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "wd-dot": {
    "group": "work",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "wd-dot-ring": {
    "group": "work",
    "origin": "web",
    "dark": "1.5px",
    "light": "1.5px"
  },
  "wd-tl-dot": {
    "group": "work",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  },
  "wd-tl-inner": {
    "group": "work",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "wd-tl-line-left": {
    "group": "work",
    "origin": "web",
    "dark": "9px",
    "light": "9px"
  },
  "wd-tl-line-top": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "wd-link-icon": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "wd-skeleton-h": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "sub-indent": {
    "group": "work",
    "origin": "web",
    "dark": "52px",
    "light": "52px"
  },
  "sub-pad-top": {
    "group": "work",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "sub-gap-2xs": {
    "group": "work",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "sub-gap-xs": {
    "group": "work",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "sub-gap-sm": {
    "group": "work",
    "origin": "web",
    "dark": "10px",
    "light": "10px"
  },
  "sub-check": {
    "group": "work",
    "origin": "web",
    "dark": "18px",
    "light": "18px"
  },
  "sub-check-panel": {
    "group": "work",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "sub-col-person": {
    "group": "work",
    "origin": "web",
    "dark": "168px",
    "light": "168px"
  },
  "sub-col-date": {
    "group": "work",
    "origin": "web",
    "dark": "150px",
    "light": "150px"
  },
  "sub-col-file": {
    "group": "work",
    "origin": "web",
    "dark": "140px",
    "light": "140px"
  },
  "sub-col-menu": {
    "group": "work",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "sub-menu-btn": {
    "group": "work",
    "origin": "web",
    "dark": "30px",
    "light": "30px"
  },
  "sub-slot-h": {
    "group": "work",
    "origin": "web",
    "dark": "30px",
    "light": "30px"
  },
  "sub-row-panel-h": {
    "group": "work",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "sub-radius-row-panel": {
    "group": "work",
    "origin": "web",
    "dark": "6px",
    "light": "6px"
  },
  "sub-icon": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "sub-fs-sm": {
    "group": "work",
    "origin": "web",
    "dark": "13px",
    "light": "13px"
  },
  "sub-fs-xs": {
    "group": "work",
    "origin": "web",
    "dark": "12px",
    "light": "12px"
  },
  "sub-fs-2xs": {
    "group": "work",
    "origin": "web",
    "dark": "11px",
    "light": "11px"
  },
  "sub-strike": {
    "group": "work",
    "origin": "web",
    "dark": "1.5px",
    "light": "1.5px"
  },
  "sub-bar-h": {
    "group": "work",
    "origin": "web",
    "dark": "4px",
    "light": "4px"
  },
  "sub-bar-radius": {
    "group": "work",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "sub-pop-date-w": {
    "group": "work",
    "origin": "web",
    "dark": "280px",
    "light": "280px"
  },
  "sub-pop-menu-w": {
    "group": "work",
    "origin": "web",
    "dark": "230px",
    "light": "230px"
  },
  "sub-date-input-h": {
    "group": "work",
    "origin": "web",
    "dark": "34px",
    "light": "34px"
  },
  "notes-body-lh": {
    "group": "work",
    "origin": "web",
    "dark": "22px",
    "light": "22px"
  },
  "notes-composer-pad": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "notes-input-min": {
    "group": "work",
    "origin": "web",
    "dark": "56px",
    "light": "56px"
  },
  "tasks-grow-basis": {
    "group": "work",
    "origin": "web",
    "dark": "280px",
    "light": "280px"
  },
  "tasks-search-basis": {
    "group": "work",
    "origin": "web",
    "dark": "200px",
    "light": "200px"
  },
  "tasks-reqbar-gap-x": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "tasks-reqbar-text-basis": {
    "group": "work",
    "origin": "web",
    "dark": "240px",
    "light": "240px"
  },
  "tasks-reqbar-icon": {
    "group": "work",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "tasks-pop-w": {
    "group": "work",
    "origin": "web",
    "dark": "260px",
    "light": "260px"
  },
  "tasks-pop-max-h": {
    "group": "work",
    "origin": "web",
    "dark": "320px",
    "light": "320px"
  },
  "wf-slot-h": {
    "group": "work",
    "origin": "web",
    "dark": "30px",
    "light": "30px"
  },
  "wf-slot-icon": {
    "group": "work",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "home-head-pad-top": {
    "group": "home",
    "origin": "web",
    "dark": "44px",
    "light": "44px"
  },
  "home-greet": {
    "group": "home",
    "origin": "web",
    "dark": "600 44px/50px var(--font-display)",
    "light": "600 44px/50px var(--font-display)"
  },
  "home-kpi-min": {
    "group": "home",
    "origin": "web",
    "dark": "220px",
    "light": "220px"
  },
  "home-kpi-h": {
    "group": "home",
    "origin": "web",
    "dark": "176px",
    "light": "176px"
  },
  "home-chip": {
    "group": "home",
    "origin": "web",
    "dark": "36px",
    "light": "36px"
  },
  "home-bar-h": {
    "group": "home",
    "origin": "web",
    "dark": "4px",
    "light": "4px"
  },
  "home-pair-min": {
    "group": "home",
    "origin": "web",
    "dark": "360px",
    "light": "360px"
  },
  "home-card-pad": {
    "group": "home",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "home-card-title": {
    "group": "home",
    "origin": "web",
    "dark": "600 18px/24px var(--font-sans)",
    "light": "600 18px/24px var(--font-sans)"
  },
  "home-tile-h": {
    "group": "home",
    "origin": "web",
    "dark": "112px",
    "light": "112px"
  },
  "home-tile-gap": {
    "group": "home",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "home-tile-label": {
    "group": "home",
    "origin": "web",
    "dark": "600 14px/18px var(--font-sans)",
    "light": "600 14px/18px var(--font-sans)"
  },
  "home-link-icon": {
    "group": "home",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "home-skel-line": {
    "group": "home",
    "origin": "web",
    "dark": "16px",
    "light": "16px"
  },
  "home-skel-num": {
    "group": "home",
    "origin": "web",
    "dark": "52px",
    "light": "52px"
  },
  "coords-health-min": {
    "group": "coords",
    "origin": "web",
    "dark": "220px",
    "light": "220px"
  },
  "coords-health-cols": {
    "group": "coords",
    "origin": "web",
    "dark": "36px minmax(0, 1fr) 16px",
    "light": "36px minmax(0, 1fr) 16px"
  },
  "coords-health-pad": {
    "group": "coords",
    "origin": "web",
    "dark": "14px 16px",
    "light": "14px 16px"
  },
  "coords-health-num": {
    "group": "coords",
    "origin": "web",
    "dark": "600 22px/26px var(--font-display)",
    "light": "600 22px/26px var(--font-display)"
  },
  "coords-chip": {
    "group": "coords",
    "origin": "web",
    "dark": "36px",
    "light": "36px"
  },
  "coords-grow-basis": {
    "group": "coords",
    "origin": "web",
    "dark": "280px",
    "light": "280px"
  },
  "coords-search-basis": {
    "group": "coords",
    "origin": "web",
    "dark": "200px",
    "light": "200px"
  },
  "coords-card-min": {
    "group": "coords",
    "origin": "web",
    "dark": "280px",
    "light": "280px"
  },
  "coords-gap": {
    "group": "coords",
    "origin": "web",
    "dark": "14px",
    "light": "14px"
  },
  "coords-card-pad": {
    "group": "coords",
    "origin": "web",
    "dark": "18px",
    "light": "18px"
  },
  "coords-code-min": {
    "group": "coords",
    "origin": "web",
    "dark": "44px",
    "light": "44px"
  },
  "coords-code-h": {
    "group": "coords",
    "origin": "web",
    "dark": "24px",
    "light": "24px"
  },
  "coords-code-offset": {
    "group": "coords",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "coords-title": {
    "group": "coords",
    "origin": "web",
    "dark": "600 15px/20px var(--font-sans)",
    "light": "600 15px/20px var(--font-sans)"
  },
  "coords-lead-h": {
    "group": "coords",
    "origin": "web",
    "dark": "28px",
    "light": "28px"
  },
  "coords-av-overlap": {
    "group": "coords",
    "origin": "web",
    "dark": "-3px",
    "light": "-3px"
  },
  "coords-av-ring": {
    "group": "coords",
    "origin": "web",
    "dark": "2px",
    "light": "2px"
  },
  "coords-stat-h": {
    "group": "coords",
    "origin": "web",
    "dark": "56px",
    "light": "56px"
  },
  "coords-stat-num": {
    "group": "coords",
    "origin": "web",
    "dark": "600 20px/24px var(--font-display)",
    "light": "600 20px/24px var(--font-display)"
  },
  "coords-dot": {
    "group": "coords",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "coords-menu-btn": {
    "group": "coords",
    "origin": "web",
    "dark": "32px",
    "light": "32px"
  },
  "coords-menu-w": {
    "group": "coords",
    "origin": "web",
    "dark": "220px",
    "light": "220px"
  },
  "coords-tip-offset": {
    "group": "coords",
    "origin": "web",
    "dark": "8px",
    "light": "8px"
  },
  "coords-tip-pad": {
    "group": "coords",
    "origin": "web",
    "dark": "4px 8px",
    "light": "4px 8px"
  },
  "coords-tip-radius": {
    "group": "coords",
    "origin": "web",
    "dark": "7px",
    "light": "7px"
  },
  "coords-tip-font": {
    "group": "coords",
    "origin": "web",
    "dark": "500 11px/14px var(--font-sans)",
    "light": "500 11px/14px var(--font-sans)"
  },
  "coords-tip-shift": {
    "group": "coords",
    "origin": "web",
    "dark": "3px",
    "light": "3px"
  },
  "coords-skel-h": {
    "group": "coords",
    "origin": "web",
    "dark": "212px",
    "light": "212px"
  },
  "coords-group-gap": {
    "group": "coords",
    "origin": "web",
    "dark": "20px",
    "light": "20px"
  }
} as const

export type TokenName = keyof typeof TOKENS
