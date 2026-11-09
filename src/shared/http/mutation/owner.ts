/**
 * Yazmanın sahibi (bileşen ya da etki kapsamı) yaşıyor mu (CX-F1-E-05).
 *
 * `ownerLife()` çağrıldığı etki kapsamının (`getCurrentScope`) sökülmesini kaydeder
 * (`onScopeDispose`): sökülmeden sonra `alive()` kalıcı olarak `false` döner. Yazma katmanı
 * (`useProtectedMutation` → motor kapısı) sökülmüş sahip adına YENİ HTTP yazması başlatmaz;
 * çakışma çözümleyicisi ve tüketiciler de geç yanıtla akışa girmez.
 *
 * **Sahipsiz = her zaman canlı:** etki kapsamı dışında (uygulama düzeyi: çıkış, tercihler,
 * modül düzeyi tekil örnekler, kapsamsız testler) çağrılırsa izlenecek bir yaşam yoktur;
 * `alive()` hep `true` döner — davranış W66 öncesiyle aynıdır.
 */
import { getCurrentScope, onScopeDispose } from 'vue'

export interface OwnerLife {
  /** Sahip sökülmediyse `true`; sahipsiz örnekte her zaman `true`. */
  readonly alive: () => boolean
  /** Etki kapsamına bağlı mı (sahipsiz örnekte `false`). */
  readonly owned: boolean
}

const UNOWNED: OwnerLife = { alive: () => true, owned: false }

/** `onDispose` sökülme anında (yaşam `false` olduktan sonra) bir kez çağrılır. */
export function ownerLife(onDispose?: () => void): OwnerLife {
  if (!getCurrentScope()) return UNOWNED
  let alive = true
  onScopeDispose(() => {
    alive = false
    onDispose?.()
  })
  return { alive: () => alive, owned: true }
}
