/** Açık/koyu tema: `<html data-theme>` özniteliği. Tercih kalıcı depolanmaz. */
export type ThemeMode = 'light' | 'dark' | 'system'

export function applyTheme(mode: ThemeMode, root: HTMLElement = document.documentElement): void {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches === true)
  root.dataset.theme = dark ? 'dark' : 'light'
}
