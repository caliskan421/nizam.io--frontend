import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import type { App } from 'vue'

import { createAppRouter } from '@/app/router'

/** Uygulama sağlayıcılarını tek yerde kurar (Pinia, router, TanStack Query). */
export function installProviders(app: App): void {
  app.use(createPinia())
  app.use(createAppRouter())
  app.use(VueQueryPlugin)
}
