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
  }
} as const

export type TokenName = keyof typeof TOKENS
