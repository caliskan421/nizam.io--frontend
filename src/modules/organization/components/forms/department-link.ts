/**
 * "Bu programa ekle" (`linkDepartment`, S2, ŞY): `department_exists` eşleşmesinde ya da kısmi
 * başarıda (katalog kaydı kaldı, bağ kurulamadı — E-08-05) yeniden sunulan adım. Yeni kullanıcı
 * eylemidir (düğme). Programdaki ad isteğe bağlı (boş → katalog adı); 409
 * `program.department_link_name_exists` → ad alanına. Bağ sunucuda idempotenttir; istek
 * isteğe bağlı `Idempotency-Key` taşır, sonuç bilinmiyorsa aynı anahtarla tek tekrar (BE-050).
 */
import { useForm } from 'vee-validate'
import { ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'

import { useLinkDepartment } from '../../api'
import { LINK_NAME_CODES, linkSchema } from './department-schema'
import type { AnyOutcome, DepartmentFormContext, LinkTarget } from './department-types'
import { serverFieldErrors, toTypedSchema } from './form-kit'
import { orgText } from './messages'

interface LinkValues {
  displayName: string
}

export function useLinkStep(ctx: DepartmentFormContext) {
  const store = useScopeStore()
  const mutation = useLinkDepartment()
  const target = ref<LinkTarget | null>(null)
  const form = useForm<LinkValues>({
    validationSchema: toTypedSchema<LinkValues, LinkValues>(linkSchema()),
    initialValues: { displayName: '' },
  })

  function reset(): void {
    target.value = null
    form.resetForm({ values: { displayName: '' } })
  }

  function offer(next: LinkTarget): void {
    if (target.value?.departmentId === next.departmentId) return
    target.value = next
    form.resetForm({ values: { displayName: '' } })
  }

  /** Sonuç işleme (ilk gönderim ve "Yeniden gönder" sonrası ortak). */
  function settle(outcome: AnyOutcome, chosen: LinkTarget): void {
    if (!ctx.dialog.alive() || outcome.kind === 'owner_disposed') return
    if (outcome.kind === 'success') {
      return ctx.done(orgText('forms.department.link.done'), chosen.departmentId)
    }
    if (outcome.kind === 'failed') {
      const found = serverFieldErrors(
        outcome.error,
        { display_name: 'displayName' as const },
        LINK_NAME_CODES,
      )
      if (found.displayName) return form.setErrors(found)
    }
    ctx.report(outcome, (next) => settle(next, chosen))
  }

  const handle = form.handleSubmit(async (values) => {
    const programId = store.snapshot.programId
    const chosen = target.value
    if (!programId || !chosen) return
    ctx.clearNotice()
    const displayName = values.displayName.trim()
    // Bağ isteği kullanıcı eylemi başına yeni `Idempotency-Key` alır (BE-050).
    settle(
      await mutation.submit({
        programId,
        departmentId: chosen.departmentId,
        ...(displayName ? { displayName } : {}),
      }),
      chosen,
    )
  })

  return {
    target,
    form,
    offer,
    reset,
    submit: () => ctx.dialog.once(() => handle()),
    pending: mutation.isPending,
  }
}
