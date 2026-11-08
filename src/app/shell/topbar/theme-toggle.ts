/**
 * Tema düğmesi (E-00-37). `dark ↔ light`; `data-theme` kökte (`<html>`) — ışınlanan menü ve
 * pencereler de etkilenir. Seçim `ui.theme` tercihine yazılır (K2 izinli anahtar; depolama
 * erişilemezse tercih katmanı bellekte tutar). Sistem tercihi okunmaz (K9, koyu varsayılan).
 * Düğmede yalnız simge değişir ve bu CSS ile yapılır (`topbar.css`).
 */
import { readonly, shallowRef } from 'vue'

import { preferences, type Preferences } from '@/shared/preferences'
import { applyTheme, isThemeMode, type ThemeMode } from '@/shared/tokens/theme'

export function nextTheme(theme: ThemeMode): ThemeMode {
  return theme === 'dark' ? 'light' : 'dark'
}

export function useThemeToggle(
  root: HTMLElement = document.documentElement,
  prefs: Pick<Preferences, 'write'> = preferences,
) {
  const current = root.dataset.theme
  const theme = shallowRef<ThemeMode>(isThemeMode(current) ? current : applyTheme('dark', root))

  function toggle(): void {
    theme.value = applyTheme(nextTheme(theme.value), root)
    prefs.write('ui.theme', theme.value)
  }

  return { theme: readonly(theme), toggle }
}
