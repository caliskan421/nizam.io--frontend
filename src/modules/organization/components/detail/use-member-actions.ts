/**
 * Üyeler sekmesi ekip yazmaları (E-08-59; `backend.md` §2): rol değiştir (`updateMembershipRole`,
 * onay GÖVDEDE) ve ekipten çıkar (`removeMember`, onay SORGUDA). İkisi de anahtarsız; 409
 * `organization.confirmation_required` akışı veri katmanının sarmalayıcısında (ortak onay, görev
 * başlıkları `fields[]`'ten; vazgeçte `null`, istek yok). Program eylem anındaki seçili
 * programdır; departman yol parametresi. Başarıda liste sarmalayıcının geçersizlemesiyle yeniden
 * okunur (iyimser güncelleme yok); diğer sonuçlar ortak bildirim (`notifyOutcome`;
 * `owner_disposed` bildirilmez). İstek sürerken eylemler kilitli (çift gönderim yok).
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import type { TeamRole } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useRemoveMember, useUpdateMembershipRole } from '../../api'
import type { RosterMember } from '../../model/types'
import { detailText, type DetailTextKey } from './messages'

export function useMemberActions(departmentId: MaybeRefOrGetter<string>) {
  const store = useScopeStore()
  const toast = useToast()
  const changeRole = useUpdateMembershipRole()
  const remove = useRemoveMember()

  function report<V, D>(outcome: MutationOutcome<V, D, unknown> | null, done: DetailTextKey): void {
    if (outcome === null) return
    if (outcome.kind === 'success') toast.push({ message: detailText(done) })
    else notifyOutcome(outcome)
  }

  async function setRole(member: RosterMember, role: TeamRole): Promise<void> {
    const programId = store.programId
    if (programId === null) return
    const outcome = await changeRole.submit(
      { programId, departmentId: toValue(departmentId), accountId: member.account_id, role },
      {
        title: detailText('organization.coordinatorship.members.roleTitle'),
        body: [
          detailText('organization.coordinatorship.members.roleText', { name: member.full_name }),
        ],
        confirmLabel: detailText('organization.coordinatorship.members.roleConfirm'),
        tone: 'primary',
      },
    )
    report(outcome, 'organization.coordinatorship.members.changed')
  }

  async function removeMember(member: RosterMember): Promise<void> {
    const programId = store.programId
    if (programId === null) return
    const outcome = await remove.submit(
      { programId, departmentId: toValue(departmentId), accountId: member.account_id },
      {
        title: detailText('organization.coordinatorship.members.removeTitle'),
        body: [
          detailText('organization.coordinatorship.members.removeText', { name: member.full_name }),
        ],
        confirmLabel: detailText('organization.coordinatorship.members.removeConfirm'),
        tone: 'danger',
      },
    )
    report(outcome, 'organization.coordinatorship.members.removed')
  }

  return {
    setRole,
    removeMember,
    busy: computed(() => changeRole.isPending.value || remove.isPending.value),
  }
}
