/**
 * Pencere yazma sonucu (K5, `ortak-kurallar.md` §7): her pencerenin gönderimi aynı sınıflamayı
 * kullanır, böylece kopya yok.
 *  - `success` → `onSuccess(data)`; hata/uyarı temizlenir.
 *  - `unknown_outcome` → yerinde `UiOutcomeNotice` ("Yeniden gönder", aynı anahtar + aynı gövde).
 *  - `failed` → pencere içinde hata kodundan i18n metni (sunucu `message` gösterilmez); 422 alan
 *    hataları `fieldErrors` altında alan adıyla.
 *  - Diğer sınıflar (429, kapsam değişti …) ortak bildirim; `owner_disposed` sessizdir.
 * Sökülmüş pencerenin geç sonucu hiçbir arayüz akışı başlatmaz (KESİN 26a).
 */
import { ref, shallowRef } from 'vue'

import { ownerLife, type MutationOutcome } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'
import { notifyOutcome } from '@/shared/ui/confirm'

import { chatFailure, type ChatFailure } from '../../model/failure'

type Outcome<D> = MutationOutcome<unknown, D, unknown>
type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

export function useDialogWrite() {
  const owner = ownerLife()
  const notice = shallowRef<AnyOutcome | null>(null)
  const message = ref('')
  const code = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})

  function clear(): void {
    notice.value = null
    message.value = ''
    code.value = null
    fieldErrors.value = {}
  }

  /** Sonucu sınıflar; `failed` ise hatayı döndürür (çağıran 409/403 davranışını ekler). */
  function settle<D>(outcome: Outcome<D>, onSuccess: (data: D) => void): ChatFailure | null {
    if (!owner.alive()) return null
    clear()
    if (outcome.kind === 'success') {
      onSuccess(outcome.data)
      return null
    }
    if (outcome.kind === 'unknown_outcome') {
      notice.value = outcome
      return null
    }
    if (outcome.kind === 'failed') {
      message.value = errorText(outcome.error)
      code.value = outcome.error.code
      fieldErrors.value = Object.fromEntries(
        outcome.error.fields.map((f) => [f.field, errorText(f)] as const),
      )
      return chatFailure(outcome.error.code)
    }
    notifyOutcome(outcome)
    return null
  }

  return { owner, notice, message, code, fieldErrors, clear, settle }
}
