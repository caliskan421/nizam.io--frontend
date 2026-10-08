// BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. Kaynak: tokens/tokens.json; `pnpm gen:tokens`.

export const TOKENS = {
  "version": 1,
  "palette": {
    "danger": {
      "100": "#fde2e1",
      "300": "#f8a5a0",
      "500": "#dc2626",
      "700": "#b91c1c"
    },
    "info": {
      "100": "#dbeafe",
      "300": "#93c5fd",
      "500": "#2563eb",
      "700": "#1d4ed8"
    },
    "primary": {
      "50": "#eef4fa",
      "100": "#d5e3f1",
      "200": "#adc8e3",
      "300": "#7fa7d0",
      "400": "#4f82b6",
      "500": "#2f6699",
      "600": "#1f4e79",
      "700": "#1a4165",
      "800": "#163552",
      "900": "#122a41",
      "950": "#0b1a29"
    },
    "success": {
      "100": "#dcfce7",
      "300": "#86efac",
      "500": "#16a34a",
      "700": "#15803d"
    },
    "surface": {
      "0": "#ffffff",
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "200": "#e2e8f0",
      "300": "#cbd5e1",
      "400": "#94a3b8",
      "500": "#64748b",
      "600": "#475569",
      "700": "#334155",
      "800": "#1e293b",
      "900": "#0f172a",
      "950": "#020617"
    },
    "warning": {
      "100": "#fef3c7",
      "300": "#fcd34d",
      "500": "#d97706",
      "700": "#b45309"
    }
  },
  "modes": {
    "light": {
      "background": "#ffffff",
      "backgroundMuted": "#f8fafc",
      "border": "#e2e8f0",
      "danger": "#b91c1c",
      "info": "#1d4ed8",
      "onPrimary": "#ffffff",
      "primary": "#1f4e79",
      "primaryHover": "#1a4165",
      "success": "#15803d",
      "text": "#0f172a",
      "textMuted": "#64748b",
      "warning": "#b45309"
    },
    "dark": {
      "background": "#020617",
      "backgroundMuted": "#0f172a",
      "border": "#334155",
      "danger": "#f8a5a0",
      "info": "#93c5fd",
      "onPrimary": "#020617",
      "primary": "#7fa7d0",
      "primaryHover": "#adc8e3",
      "success": "#86efac",
      "text": "#f8fafc",
      "textMuted": "#94a3b8",
      "warning": "#fcd34d"
    }
  },
  "modeRefs": {
    "light": {
      "background": "surface.0",
      "backgroundMuted": "surface.50",
      "border": "surface.200",
      "danger": "danger.700",
      "info": "info.700",
      "onPrimary": "surface.0",
      "primary": "primary.600",
      "primaryHover": "primary.700",
      "success": "success.700",
      "text": "surface.900",
      "textMuted": "surface.500",
      "warning": "warning.700"
    },
    "dark": {
      "background": "surface.950",
      "backgroundMuted": "surface.900",
      "border": "surface.700",
      "danger": "danger.300",
      "info": "info.300",
      "onPrimary": "surface.950",
      "primary": "primary.300",
      "primaryHover": "primary.200",
      "success": "success.300",
      "text": "surface.50",
      "textMuted": "surface.400",
      "warning": "warning.300"
    }
  }
} as const
