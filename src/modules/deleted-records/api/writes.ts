/**
 * Yaşam döngüsü yazmaları (geri yükle / kalıcı sil): görev, departman, hesap (toplantı yazmaları
 * `meetings` modülündedir ve `public.ts`'ten yeniden dışa açılır). Altı uç da `Idempotency-Key`
 * ve `expected_revision` ALMAZ (`backend.md` çerçeve): anahtarsız organizasyon yazması kalıbı
 * (`useKeylessMutation`) — sonuç bilinmiyorsa kör tekrar yok, liste yeniden okunur. S2 uçları
 * eylemin dondurulmuş program başlığıyla gider; hesap uçları S1'dir (başlıksız).
 */
import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'

import type {
  AccountLifecycleResult,
  AccountRecordTarget,
  DepartmentLifecycleResult,
  ProgramRecordTarget,
  WorkItemLifecycleResult,
  WorkItemPurgeResult,
} from '../model/types'

export function useRestoreWorkItem() {
  return useKeylessMutation<ProgramRecordTarget, WorkItemLifecycleResult>({
    operation: 'restoreWorkItem',
    send: (vars, ctx) =>
      api.PATCH('/v1/admin/restore/work-items/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}

export function usePermanentDeleteWorkItem() {
  return useKeylessMutation<ProgramRecordTarget, WorkItemPurgeResult>({
    operation: 'permanentDeleteWorkItem',
    send: (vars, ctx) =>
      api.DELETE('/v1/admin/permanent/work-items/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}

export function useRestoreDepartment() {
  return useKeylessMutation<ProgramRecordTarget, DepartmentLifecycleResult>({
    operation: 'restoreDepartment',
    send: (vars, ctx) =>
      api.PATCH('/v1/admin/restore/departments/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}

export function usePermanentDeleteDepartment() {
  return useKeylessMutation<ProgramRecordTarget, DepartmentLifecycleResult>({
    operation: 'permanentDeleteDepartment',
    send: (vars, ctx) =>
      api.DELETE('/v1/admin/permanent/departments/{id}', {
        params: { header: programHeaders(vars), path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}

export function useRestoreAccount() {
  return useKeylessMutation<AccountRecordTarget, AccountLifecycleResult>({
    operation: 'restoreAccount',
    send: (vars, ctx) =>
      api.PATCH('/v1/admin/restore/accounts/{id}', {
        params: { path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}

export function usePermanentDeleteAccount() {
  return useKeylessMutation<AccountRecordTarget, AccountLifecycleResult>({
    operation: 'permanentDeleteAccount',
    send: (vars, ctx) =>
      api.DELETE('/v1/admin/permanent/accounts/{id}', {
        params: { path: { id: vars.id } },
        signal: ctx.signal,
      }),
  })
}
