/**
 * 409 `organization.confirmation_required` akışı (K5; ortak-kurallar §7; KESİN 20). Yalnız üç uç
 * döndürür: `removeCoordinator`, `removeMember` (onay SORGUDA: `?confirm=true`) ve
 * `updateMembershipRole` (onay GÖVDEDE: `confirm: true`). Biçim sarmalayıcının `send`'indedir
 * (`ctx.confirm`); burada yalnız akış:
 *
 *   ilk gönderim → `confirmation_required` → ortak etkili işlem onayı (`confirmImpact`; görev
 *   başlıkları `fields[]`'ten) → kabulde AYNI istek `confirm=true` ile YENİ eylem olarak, ilk
 *   eylemin bağlamıyla (motor `confirm()` yakalanmış kapsam + nesli taşır).
 *
 * Yaşam döngüsü `shared/ui/confirm` `useConfirm()`'dedir ve kurulumda (eşzamanlı) alınır:
 * kapsam/oturum değişimi ya da sahibin (bileşenin) sökülmesi açık onayı vazgeçle kapatır; sökülmüş
 * sahip yeni onay açamaz (`null`). Tüketici kendi kuyruk/iptal/bayat bağlam mantığını yazmaz.
 * Vazgeç → `null` (istek yok). Diğer sonuçlar (başarı dahil) olduğu gibi döner.
 */
import type { MutationOutcome, ProtectedMutation, SubmitOptions } from '@/shared/http/mutation'
import { useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

export function useImpactConfirmedWrite<V, D>(mutation: ProtectedMutation<V, D, unknown>) {
  const { confirmImpact } = useConfirm()

  async function submit(
    vars: V,
    confirmation: ConfirmOptions,
    opts?: SubmitOptions,
  ): Promise<MutationOutcome<V, D, unknown> | null> {
    const first = await mutation.submit(vars, opts)
    if (first.kind !== 'confirmation_required') return first
    return confirmImpact(first, confirmation)
  }

  return { submit, isPending: mutation.isPending, reset: mutation.reset }
}
