import 'vue-router'

import type { ScopeClass } from '@/shared/scope/scope-class'

declare module 'vue-router' {
  interface RouteMeta {
    /** Rotanın kapsam sınıfı (platform.md §5: `meta.scope: S0..S3`). */
    scope: ScopeClass
  }
}
