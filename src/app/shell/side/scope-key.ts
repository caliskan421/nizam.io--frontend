import { inject, type InjectionKey } from 'vue'

import type { useScopeLifecycle } from '@/shared/scope/lifecycle'

/** Kabukta BİR kez kurulan kapsam yaşam döngüsü (`useScopeLifecycle()` dönüşü). */
export type ScopeLifecycle = ReturnType<typeof useScopeLifecycle>

/**
 * Kabuk (`AppShell.vue`, W22) yaşam döngüsünü bu anahtarla `provide` eder; kenar menüsü
 * `inject` ile okur ve seçimleri `select*` ile yapar. Kenar menüsü `useScopeLifecycle()`'ı
 * kendisi ÇAĞIRMAZ (ikinci kurulum çift dinleyici ve çift kapsam çözümü demektir).
 */
export const SCOPE_LIFECYCLE_KEY: InjectionKey<ScopeLifecycle> = Symbol('scope-lifecycle')

/** Sağlanmış yaşam döngüsü; yoksa açık hata (kabuk sözleşmesi ihlali). */
export function injectScopeLifecycle(): ScopeLifecycle {
  const lifecycle = inject(SCOPE_LIFECYCLE_KEY, null)
  if (!lifecycle) {
    throw new Error('kenar menüsü: SCOPE_LIFECYCLE_KEY sağlanmadı (kabuk provide etmeli)')
  }
  return lifecycle
}
