import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import type { App } from 'vue'

import { readCspNonce } from '@/app/csp-nonce'
import { createAppRouter } from '@/app/router'
import { i18n } from '@/shared/i18n'
import { preferences } from '@/shared/preferences'
import { DARK_MODE_SELECTOR, NizamPreset } from '@/shared/tokens/preset'
import { applyTheme } from '@/shared/tokens/theme'

/** Uygulama sağlayıcılarını tek yerde kurar (Pinia, router, TanStack Query, i18n, PrimeVue). */
export function installProviders(app: App): void {
  // Hatırlanan tema (K2 tercih istisnası); yoksa koyu varsayılan (K9, E-00-37: sistem tercihi okunmaz).
  applyTheme(preferences.read('ui.theme') ?? 'dark')
  app.use(createPinia())
  app.use(createAppRouter())
  app.use(VueQueryPlugin)
  app.use(i18n)
  app.use(PrimeVue, {
    // Çalışma anında enjekte edilen <style> öğeleri web Caddy'sinin istek başı nonce'unu taşır
    // (CSP `style-src 'nonce-…'`; 'unsafe-inline' yok).
    csp: { nonce: readCspNonce() },
    theme: {
      preset: NizamPreset,
      options: {
        darkModeSelector: DARK_MODE_SELECTOR,
        cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
      },
    },
  })
}
