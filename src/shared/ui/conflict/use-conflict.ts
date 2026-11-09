/**
 * Çakışma seçimi akışı (`useConfirm` kalıbı: söz dönen çağrı + diyalog). Ekran kendi
 * `ConflictDialog`'unu `request` ile bağlar; `resolve(input)` yalnız GERÇEK çakışan alanları
 * sorar (hiç yoksa diyalog açılmadan boş seçim döner — değişiklikler kendiliğinden birleşir).
 * Kullanıcı vazgeçerse `null`. Seçim sonrası gövde `resolveDraft`, taban sunucunun kaydıdır.
 *
 * Sahip yaşamı (CX-F1-E-05): çözümleyici kurulduğu etki kapsamının sökülmesini izler. Sökülmüş
 * sahip için `resolve` ne diyalog açar ne de "kendiliğinden birleşti" (`{}`) döner — vazgeç
 * (`null`) döner; tüketiciler vazgeçte yeniden göndermez. Açık diyalog sökülmede vazgeçle kapanır.
 * Etki kapsamı dışında kurulan çözümleyici sahipsizdir (her zaman canlı).
 *
 *   const conflict = useConflictResolver()
 *   if (outcome.kind === 'edit_conflict' && outcome.server) {
 *     const choices = await conflict.resolve({ base, draft, server: outcome.server, labels })
 *     if (choices) submit({ base: outcome.server, changes: resolveDraft(draft, outcome.server, choices) })
 *   }
 *   <ConflictDialog v-model:open="conflict.open.value" :fields="conflict.fields.value"
 *     @resolve="conflict.choose" @cancel="conflict.dismiss" />
 */
import { shallowRef } from 'vue'

import { ownerLife } from '@/shared/http/mutation'

import {
  conflictRows,
  type ConflictChoices,
  type ConflictField,
  type ConflictInput,
} from './conflict'

export function useConflictResolver() {
  const open = shallowRef(false)
  const fields = shallowRef<readonly ConflictField[]>([])
  let pending: ((choices: ConflictChoices | null) => void) | null = null

  function settle(choices: ConflictChoices | null): void {
    const done = pending
    pending = null
    open.value = false
    done?.(choices)
  }

  const owner = ownerLife(() => settle(null))

  function resolve(input: ConflictInput): Promise<ConflictChoices | null> {
    if (!owner.alive()) return Promise.resolve(null)
    const rows = conflictRows(input)
    if (rows.length === 0) return Promise.resolve({})
    settle(null)
    return new Promise((done) => {
      pending = done
      fields.value = rows
      open.value = true
    })
  }

  return {
    open,
    fields,
    resolve,
    /** Diyalogdan gelen seçim. */
    choose: (choices: ConflictChoices) => settle(choices),
    /** Vazgeç (Esc, perde, düğme). */
    dismiss: () => settle(null),
  }
}
