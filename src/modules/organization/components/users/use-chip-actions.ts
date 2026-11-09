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

import type { MutationOutcome } from '@/shared/http/mutation'
import type { TeamRole } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome, type ConfirmOptions } from '@/shared/ui/confirm'

import { useAssignMembership, useRemoveMember, useUpdateMembershipRole } from '../../api'
import { usersText, type UsersTextKey } from './messages'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

/** Sonucu bildirir; başarıysa `true`. Vazgeç / sökülmüş sahip → sessiz. */
export function reportOutcome(outcome: AnyOutcome | null, success: UsersTextKey): boolean {
  if (outcome === null || outcome.kind === 'owner_disposed') return false
  if (outcome.kind === 'success') {
    useToast().push({ message: usersText(success) })
    return true
  }
  notifyOutcome(outcome)
  return false
}

function impact(kind: 'role' | 'remove'): ConfirmOptions {
  const isRole = kind === 'role'
  return {
    title: usersText(
      isRole ? 'usersPage.panel.impact.roleTitle' : 'usersPage.panel.impact.removeTitle',
    ),
    body: [
      usersText(isRole ? 'usersPage.panel.impact.roleBody' : 'usersPage.panel.impact.removeBody'),
    ],
    confirmLabel: usersText(
      isRole ? 'usersPage.panel.impact.roleConfirm' : 'usersPage.panel.impact.removeConfirm',
    ),
    tone: isRole ? 'primary' : 'danger',
  }
}

export function useChipActions(accountId: () => string) {
  const store = useScopeStore()
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
        await updateRole.submit(vars, impact('role')),
        'usersPage.panel.chips.roleChanged',
      )
    })

  const removeChip = (departmentId: string) =>
    run(departmentId, async (programId) => {
      const vars = { programId, departmentId, accountId: accountId() }
      return reportOutcome(
        await remove.submit(vars, impact('remove')),
        'usersPage.panel.chips.removed',
      )
    })

  const add = (departmentId: string, role: TeamRole) =>
    run('add', async (programId) => {
      const vars = { programId, departmentId, accountId: accountId(), role }
      return reportOutcome(await assign.submit(vars), 'usersPage.panel.chips.added')
    })

  return { pending, changeRole, removeChip, add }
}
