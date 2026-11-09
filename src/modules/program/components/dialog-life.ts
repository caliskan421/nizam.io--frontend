/**
 * Program yönetimi pencerelerinin ortak yaşamı (P3 formları; K5 yazma protokolü):
 *  - tek uçuş: anahtarsız uçta çift gönderim yok (kilit `await`'ten ÖNCE alınır);
 *  - seçili program değişince açık pencere kapanır (K2);
 *  - sahip söküldükten sonra gelen geç yanıtta bildirim / emit / yeni yazma yok (`alive()`).
 * Ayrıca zod → vee-validate bağdaştırıcısı (ek paket yok; zod JIT kapalı — üretim CSP'si eval'e
 * izin vermez).
 */
import type { TypedSchema, TypedSchemaError } from 'vee-validate'
import { onBeforeUnmount, ref, watch } from 'vue'
import type { z } from 'zod'

import { useScopeStore } from '@/shared/scope/store'

export function toTypedSchema<V, O>(schema: z.ZodType<O>): TypedSchema<V, O> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values)
      if (result.success) return { value: result.data, errors: [] }
      const byPath = new Map<string, string[]>()
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        byPath.set(path, [...(byPath.get(path) ?? []), issue.message])
      }
      const errors: TypedSchemaError[] = [...byPath].map(([path, list]) => ({ path, errors: list }))
      return { errors }
    },
  }
}

export interface DialogHooks {
  open: () => boolean
  close: () => void
}

export function useDialogLife(hooks: DialogHooks) {
  const store = useScopeStore()
  const busy = ref(false)
  let disposed = false
  onBeforeUnmount(() => {
    disposed = true
  })

  watch(
    () => store.snapshot.programId,
    () => {
      if (hooks.open()) hooks.close()
    },
  )

  /** Tek uçuş: sürerken ikinci çağrı yok sayılır (istek yok). */
  async function once(task: () => Promise<unknown>): Promise<void> {
    if (busy.value) return
    busy.value = true
    try {
      await task()
    } finally {
      busy.value = false
    }
  }

  return { busy, once, alive: () => !disposed }
}
