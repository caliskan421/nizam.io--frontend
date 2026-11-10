/**
 * Koordinatörlük formu durumu (W74 · E-08-05, E-08-63, E-08-70; K11 vee-validate + zod; K5).
 * Üç parça: oluşturma (`department-create.ts`), "Bu programa ekle" bağ adımı
 * (`department-link.ts`) ve düzenleme (`department-edit.ts`). Burada yalnız ortak yaşam
 * (pencere, tek uçuş, kapsam kapanışı), ortak sonuç bildirimi ve düğme kilidi.
 */
import { computed, shallowRef, watch } from 'vue'

import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useProgramDepartmentIndex } from '../../api'
import { useCreateMode } from './department-create'
import { useEditMode } from './department-edit'
import { useLinkStep } from './department-link'
import { useFormDialog } from './form-kit'
import type { AnyOutcome, DepartmentFormContext, DepartmentFormHooks } from './department-types'

export function useDepartmentForm(hooks: DepartmentFormHooks) {
  const dialog = useFormDialog({ open: hooks.open, close: hooks.close })
  const editing = computed(() => Boolean(hooks.departmentId()))
  const notice = shallowRef<AnyOutcome | null>(null)
  const index = useProgramDepartmentIndex(hooks.open)
  // Kurulumda (eşzamanlı) alınır: form sökülünce geç sonucun bildirimi düşer (W82c).
  const toast = useToast()

  const ctx: DepartmentFormContext = {
    hooks,
    dialog,
    index,
    toast,
    // Kapsam değişiminde pencere zaten kapandıysa (sayfa bağlı): yazma gerçekleşti, bildirim ve
    // `saved` yine gelir (kısmi sonuçla aynı kural); ikinci bir kapanış yayılmaz (W97b, CX-F2-Ö-03).
    done(message, departmentId) {
      toast.push({ message })
      hooks.saved(departmentId)
      if (hooks.open()) hooks.close()
    },
    report(outcome) {
      if (outcome.kind === 'unknown_outcome') {
        notice.value = outcome
        return
      }
      notifyOutcome(outcome)
    },
    clearNotice() {
      notice.value = null
    },
  }

  const link = useLinkStep(ctx)
  const create = useCreateMode(ctx, link)
  const edit = useEditMode(ctx, editing)

  watch(hooks.open, () => {
    notice.value = null
    link.reset()
    create.reset()
  })

  const pending = computed(
    () => dialog.busy.value || create.pending.value || link.pending.value || edit.pending.value,
  )

  return { editing, notice, pending, create, link, edit }
}
