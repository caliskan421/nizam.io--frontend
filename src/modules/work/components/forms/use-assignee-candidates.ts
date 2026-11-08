/**
 * Yeni görev formunun atanan adayları: seçilen departmanın SEÇİLİ PROGRAMDAKİ ekibi
 * (`listMembers`, S2 — şirket yöneticisine ve o departmanın koordinatörüne açık; aday kümesi
 * dışındaki hesap 422 `work.assignee_not_member` alır).
 *
 * GEÇİCİ (W45): `query-keys.ts`'te bu kaynağın anahtarı ve `../../api`'de okuyucusu yok; grup
 * kendi anahtarını yazamadığından (ortak-kurallar §6) okuma ÖNBELLEKSİZ ve form ömrüyle
 * sınırlıdır: hedef değişince ya da form kapanınca önceki istek iptal edilir, geç gelen yanıt
 * yok sayılır. Kalıcı yer `api/` + `queryKeys` (rapor: SAHİPLİK-DIŞI İHTİYAÇ).
 */
import { onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { api, unwrap } from '@/shared/http'

import { programHeaders } from '../../api'
import type { WorkTarget } from '../../model/types'

export interface AssigneeCandidate {
  accountId: string
  fullName: string
}

export type CandidateStatus = 'idle' | 'loading' | 'ready' | 'error'

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

async function fetchCandidates(target: WorkTarget, signal: AbortSignal) {
  const data = await unwrap(
    api.GET('/v1/departments/{id}/members', {
      params: { header: programHeaders(target), path: { id: target.departmentId } },
      signal,
    }),
  )
  return (data.members ?? [])
    .filter((m) => m.status === 'active')
    .map((m) => ({ accountId: m.account_id, fullName: m.full_name }))
    .sort((a, b) => collator.compare(a.fullName, b.fullName))
}

/** `target` `null` iken istek yok (departman seçilmedi ya da form kapalı). */
export function useAssigneeCandidates(target: MaybeRefOrGetter<WorkTarget | null>) {
  const candidates = shallowRef<AssigneeCandidate[]>([])
  const status = ref<CandidateStatus>('idle')
  let controller: AbortController | null = null

  async function load(next: WorkTarget | null): Promise<void> {
    controller?.abort()
    controller = null
    candidates.value = []
    if (!next) {
      status.value = 'idle'
      return
    }
    const own = new AbortController()
    controller = own
    status.value = 'loading'
    try {
      const list = await fetchCandidates(next, own.signal)
      if (controller !== own) return
      candidates.value = list
      status.value = 'ready'
    } catch {
      if (controller === own) status.value = 'error'
    }
  }

  watch(
    () => {
      const t = toValue(target)
      return t ? `${t.programId}\u0000${t.departmentId}` : null
    },
    () => void load(toValue(target)),
    { immediate: true },
  )
  onScopeDispose(() => controller?.abort())

  return { candidates, status }
}
