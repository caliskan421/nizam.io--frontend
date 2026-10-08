import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import type { App } from 'vue'

import { createAppRouter } from '@/app/router'
import { i18n } from '@/shared/i18n'
import { DARK_MODE_SELECTOR, NizamPreset } from '@/shared/tokens/preset'
import { applyTheme } from '@/shared/tokens/theme'

/** Uygulama sağlayıcılarını tek yerde kurar (Pinia, router, TanStack Query, i18n, PrimeVue). */
export function installProviders(app: App): void {
  applyTheme('system')
  app.use(createPinia())
  app.use(createAppRouter())
  app.use(VueQueryPlugin)
  app.use(i18n)
  app.use(PrimeVue, {
    theme: {
      preset: NizamPreset,
      options: {
        darkModeSelector: DARK_MODE_SELECTOR,
        cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
      },
    },
  })
}
