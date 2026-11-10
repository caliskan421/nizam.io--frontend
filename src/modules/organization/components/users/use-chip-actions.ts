/**
 * E-05-32/33 — koordinatörlük çipi işlemleri: her işlem ANINDA ve kendi sonucuyla (P12, #13);
 * toplu Kaydet yok. İyimser güncelleme yok: ekran sunucu yanıtı + yeniden okumayla değişir
 * (geçersizleme veri katmanında). Uçlar anahtarsızdır (kör tekrar yok, sonuç bilinmiyorsa liste
 * yeniden okunur).
 *
 *  - Rol seçici (yalnız ŞY) → `updateMembershipRole`; 409 `confirmation_required` → ortak etkili
 *    işlem onayı, onay GÖVDEDE (`confirm: true`).
 *  - X → `removeMember`; onay SORGUDA (`?confirm=true`). Aktif atamalar işlemi yapana devredilir.
 *  - "+ Ekle" → `assignMembership` (onay kapısı yok); 409 `membership_exists` → "zaten ekipte" +
 *    liste yeniden okunur.
 * Sahip söküldüyse (`owner_disposed`) ya da onaydan vazgeçildiyse bildirim yok.
 */
import { ref } from 'vue'

import { reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import type { TeamRole } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome, withTransferNote, type ConfirmOptions } from '@/shared/ui/confirm'

import { useAssignMembership, useRemoveMember, useUpdateMembershipRole } from '../../api'
import { usersText, type UsersTextKey } from './messages'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

type Toast = ReturnType<typeof useToast>

/**
 * Sonucu bildirir; başarıysa `true`. Vazgeç / sökülmüş sahip (geç sonuç dahil) → sessiz. `toast`
 * çağıranın KURULUMDA aldığı örnektir (sahip yaşamını bilir; CX-F1-Ö-07, W82c).
 */
export function reportOutcome(
  toast: Toast,
  outcome: AnyOutcome | null,
  success: UsersTextKey,
): boolean {
  if (outcome === null || !reachesOwner(outcome)) return false
  if (outcome.kind === 'success') {
    toast.push({ message: withTransferNote(usersText(success), outcome.data) })
    return true
  }
  notifyOutcome(outcome)
  return false
}

function impact(kind: 'role' | 'remove'): ConfirmOptions {
  const isRole = kind === 'role'
  return {
    title: usersText(isRole ? 'users.panel.impact.roleTitle' : 'users.panel.impact.removeTitle'),
    body: [usersText(isRole ? 'users.panel.impact.roleBody' : 'users.panel.impact.removeBody')],
    confirmLabel: usersText(
      isRole ? 'users.panel.impact.roleConfirm' : 'users.panel.impact.removeConfirm',
    ),
    tone: isRole ? 'primary' : 'danger',
    impactNotice: 'caller',
  }
}

export function useChipActions(accountId: () => string) {
  const store = useScopeStore()
  const toast = useToast() // kurulumda: panel sökülünce geç sonucun bildirimi düşer
  const updateRole = useUpdateMembershipRole()
  const remove = useRemoveMember()
  const assign = useAssignMembership()
  /** İşlem süren çip (birim kimliği) ya da ekleme (`add`); süre boyunca çift gönderim yok. */
  const pending = ref<string | null>(null)

  async function run(key: string, work: (programId: string) => Promise<boolean>) {
    const programId = store.programId
    if (programId === null || pending.value !== null) return false
    pending.value = key
    try {
      return await work(programId)
    } finally {
      pending.value = null
    }
  }

  const changeRole = (departmentId: string, role: TeamRole) =>
    run(departmentId, async (programId) => {
      const vars = { programId, departmentId, accountId: accountId(), role }
      return reportOutcome(
        toast,
        await updateRole.submit(vars, impact('role')),
        'users.panel.chips.roleChanged',
      )
    })

  const removeChip = (departmentId: string) =>
    run(departmentId, async (programId) => {
      const vars = { programId, departmentId, accountId: accountId() }
      return reportOutcome(
        toast,
        await remove.submit(vars, impact('remove')),
        'users.panel.chips.removed',
      )
    })

  const add = (departmentId: string, role: TeamRole) =>
    run('add', async (programId) => {
      const vars = { programId, departmentId, accountId: accountId(), role }
      return reportOutcome(toast, await assign.submit(vars), 'users.panel.chips.added')
    })

  return { pending, changeRole, removeChip, add }
}
