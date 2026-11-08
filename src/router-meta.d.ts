import 'vue-router'

import type { ScopeClass } from '@/shared/scope/scope-class'

declare module 'vue-router' {
  interface RouteMeta {
    /** Rotanın kapsam sınıfı (platform.md §5: `meta.scope: S0..S3`). Katalogla aynı olmalı. */
    scope: ScopeClass
    /** Sayfa adı (konum izi); router rota kataloğundan doldurur. */
    title?: string
    /** Etkin kenar menüsü öğesi; alt rotalar üst öğeyi etkin yapar. Router katalogdan doldurur. */
    menuKey?: string
  }
}
