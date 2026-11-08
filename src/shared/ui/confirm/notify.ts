/**
 * Yazma sonucunun ortak bildirimi (K5; `useToast` üstüne). Metin yalnız i18n'den: protokol
 * sınıfları `outcomeMessage()` anahtarı (`mutation.*`), `failed` hata kodu (`errors.*`); sunucu
 * `message` alanı gösterilmez.
 *
 *  - `success` → bildirim yok (ekran kendi sonucunu gösterir; iyimser güncelleme yok).
 *  - `unknown_outcome` ("sonuç bilinmiyor") → kalıcı tehlike bildirimi; taslak + anahtar çağıranda
 *    korunur, yeniden gönderme yerinde (`UiOutcomeNotice`, `retry`).
 *  - `edit_conflict` → kalıcı bildirim; alan listesi yerinde, alan alan seçim F1'de.
 *  - `confirmation_required` → bildirim değil, `useConfirm().confirmImpact` penceresi.
 */
import type { MutationOutcome } from '@/shared/http/mutation'
import { outcomeMessage } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'

import { useToast, type ToastInput } from '../use-toast'
import { mutationText } from './messages'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

/** Sonucun kullanıcı metni (i18n). */
export function outcomeText(outcome: AnyOutcome): string {
  if (outcome.kind === 'failed') return errorText(outcome.error)
  const { key, params } = outcomeMessage(outcome)
  return mutationText(key, params)
}

/** Sonucun bildirimi; bildirilecek bir şey yoksa `null`. */
export function outcomeToast(outcome: AnyOutcome): ToastInput | null {
  switch (outcome.kind) {
    case 'success':
    case 'confirmation_required':
      return null
    case 'unknown_outcome':
    case 'edit_conflict':
      return { message: outcomeText(outcome), tone: 'danger', timeout: 0 }
    default:
      return { message: outcomeText(outcome), tone: 'danger' }
  }
}

/** Sonucu bildirim kuyruğuna ekler; eklendiyse `true`. */
export function notifyOutcome(outcome: AnyOutcome): boolean {
  const toast = outcomeToast(outcome)
  if (!toast) return false
  useToast().push(toast)
  return true
}
