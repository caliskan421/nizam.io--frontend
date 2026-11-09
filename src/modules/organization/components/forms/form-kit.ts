/**
 * W74 organizasyon formlarının ortak parçaları (K11 vee-validate + zod; K5 yazma protokolü).
 *
 *  - `toTypedSchema`: zod → vee-validate bağdaştırıcısı (ek paket yok). zod JIT kapalı: üretim
 *    CSP'si `script-src`'de eval'e izin vermez (W63 dersi).
 *  - `serverFieldErrors`: 422/409 `fields[]` (ve alan listesi olmadan gelen bilinen zarf kodları)
 *    → forma; metin kod → i18n, sunucu `message` gösterilmez.
 *  - `useFormDialog`: pencere yaşamı —
 *      · tek uçuş: anahtarsız uçta çift gönderim yok (doğrulama `await`'inden ÖNCE kilitlenir;
 *        düğme istek sürerken kilitli);
 *      · kapsam (program/departman) değişince açık pencere kapanır;
 *      · sahip söküldükten sonra gelen geç yanıtta bildirim/emit/yeni yazma yok (`alive()`).
 */
import type { TypedSchema, TypedSchemaError } from 'vee-validate'
import { onBeforeUnmount, ref, watch } from 'vue'
import { z } from 'zod'

import type { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'

z.config({ jitless: true })

/** zod → vee-validate `TypedSchema`. */
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

/** Kişi seçici alanı: seçim zorunlu (`PersonOption`). */
export function personSchema(required: string) {
  return z.object({
    person: z
      .object({ accountId: z.string().min(1), fullName: z.string() })
      .nullable()
      .refine((v) => v !== null, required),
  })
}

/**
 * Sunucu hatasından alan hataları. `fieldMap`: sunucu alan adı (`fields[].field`) → form alanı;
 * `codeMap`: alan listesi olmadan da bir alana bağlanan kod (zarf ya da alan kodu) → form alanı.
 * Eşlenemeyen hata boş döner (çağıran ortak bildirime düşer).
 */
export function serverFieldErrors<F extends string>(
  error: ApiError,
  fieldMap: Readonly<Record<string, F>>,
  codeMap: Readonly<Record<string, F>> = {},
): Partial<Record<F, string>> {
  const out: Partial<Record<F, string>> = {}
  for (const f of error.fields) {
    const field = codeMap[f.code] ?? fieldMap[f.field]
    if (field && !out[field]) out[field] = errorText(f)
  }
  const byCode = codeMap[error.code]
  if (byCode && !out[byCode]) out[byCode] = errorText(error)
  return out
}

export interface FormDialogHooks {
  open: () => boolean
  close: () => void
}

export function useFormDialog(hooks: FormDialogHooks) {
  const store = useScopeStore()
  const busy = ref(false)
  let disposed = false
  onBeforeUnmount(() => {
    disposed = true
  })

  watch(
    () => `${store.snapshot.programId ?? ''}|${store.snapshot.departmentId ?? ''}`,
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
