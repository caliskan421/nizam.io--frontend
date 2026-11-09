/**
 * Alt görev ekle (E-03-37; K5, `ortak-kurallar.md` §7; 03 `mekanizma.md` §4-3).
 *
 *  - `Idempotency-Key` KULLANICI EYLEMİ başına: her Enter / "Ekle" yeni eylemdir (yeni anahtar),
 *    ağ tekrarı aynı anahtar + aynı gövde (`useProtectedMutation`).
 *  - Boş / yalnız boşluk başlık reddedilir (istek yok); başlık kırpılarak gider (1–300).
 *  - Sonuç bilinmiyorsa taslak ve anahtar korunur: yerinde bildirim (`UiOutcomeNotice`) aynı
 *    anahtarla yeniden gönderir; taslak değişmeden yeniden Enter de AYNI eylemi tekrarlar
 *    (yeni anahtarla kör gönderim yok). Başarıda taslak temizlenir.
 *  - Diğer sonuçlar (409 `work.subtask_limit_reached`, `work.item_completed`, 422…) bildirim
 *    olarak gösterilir, taslak korunur.
 */
import { ref, shallowRef } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useCreateSubtask } from '../../api'
import type { CreateSubtaskInput, WorkItem, WorkItemSubtask, WorkTarget } from '../../model/types'

type CreateOutcome = MutationOutcome<CreateSubtaskInput, WorkItemSubtask>
type UnknownOutcome = Extract<CreateOutcome, { kind: 'unknown_outcome' }>

export function useSubtaskAdd(item: () => WorkItem, target: () => WorkTarget) {
  const create = useCreateSubtask()
  const draft = ref('')
  /** Yerinde gösterilen "sonuç bilinmiyor" sonucu (yeniden gönder). */
  const notice = shallowRef<UnknownOutcome | null>(null)

  /** Sonucu işler; başarıda `true`. */
  function settle(outcome: CreateOutcome): boolean {
    notice.value = outcome.kind === 'unknown_outcome' ? outcome : null
    if (outcome.kind === 'success') {
      draft.value = ''
      return true
    }
    if (outcome.kind !== 'unknown_outcome') notifyOutcome(outcome)
    return false
  }

  function sameAction(title: string): UnknownOutcome | null {
    const last = notice.value
    return last && last.retry && last.draft.body.title === title ? last : null
  }

  /** Enter / "Ekle". */
  async function submit(): Promise<boolean> {
    const title = draft.value.trim()
    if (title === '' || create.isPending.value) return false
    const pending = sameAction(title)
    const outcome = pending?.retry
      ? await pending.retry()
      : await create.submit({
          target: { ...target() },
          workItemId: item().work_item_id,
          body: { title },
        })
    return settle(outcome)
  }

  return { draft, notice, busy: create.isPending, submit, settle }
}
