import { DEFAULT_THEME, TOKEN_THEMES } from './tokens.gen'

/** Arayüz teması: `<html data-theme>` özniteliği; koyu varsayılan (K9, E-00-37). */
export type ThemeMode = (typeof TOKEN_THEMES)[number]

export function isThemeMode(value: unknown): value is ThemeMode {
  return (TOKEN_THEMES as readonly unknown[]).includes(value)
}

/**
 * Temayı kök öğeye yazar ve uygulanan temayı döndürür. Sistem tercihi
 * (`prefers-color-scheme`) kullanılmaz (00-ortak README E-00-37 kabul): `'system'` yalnız
 * geçiş için kabul edilir ve varsayılan temaya (koyu) düşer. Hatırlanan tercih
 * `shared/preferences` (`ui.theme`) üzerinden gelir; bu modül depolamaya dokunmaz.
 */
export function applyTheme(
  mode: ThemeMode | 'system' = DEFAULT_THEME,
  root: HTMLElement = document.documentElement,
): ThemeMode {
  const theme = isThemeMode(mode) ? mode : DEFAULT_THEME
  root.dataset.theme = theme
  return theme
}
