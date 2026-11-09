/**
 * Dosya eylemlerinin görünürlüğü (K1; istemci-akislari §4 s.148–s.150). Olgular yalnız
 * sunucudan: `useStanding()` (me + me/departments) ve görevin kendi departmanı; mercek girdi
 * değildir (P1). Hesap `../../model/capabilities.ts`'tedir; burada rol dizesi yoktur.
 * Standing yoksa her olgu `false` (en dar güvenli davranış: eylem gizli).
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import {
  canDeleteFile,
  canRenameFile,
  canUploadFile,
  isSelf,
  workActorFacts,
  type WorkActionContext,
} from '../../model/capabilities'
import type { WorkItem, WorkItemFile } from '../../model/types'

type Uploaded = Pick<WorkItemFile, 'uploaded_by_account_id'>

export function useFileAccess(item: MaybeRefOrGetter<WorkItem>) {
  const { standing } = useStanding()
  const scope = useScopeStore()

  const facts = computed(() =>
    workActorFacts(standing.value, scope.snapshot.programId, toValue(item)),
  )

  function fileContext(file: Uploaded): WorkActionContext {
    return { ...facts.value, uploader: isSelf(standing.value, file.uploaded_by_account_id) }
  }

  return {
    /** s.148 — koordinatör ∨ atanmış üye; yöneticilik baskın (gizli). */
    canUpload: computed(() => canUploadFile(facts.value)),
    /** s.149 — yönetici ∨ koordinatör ∨ (yükleyen ∧ ekip satırı). */
    canRename: (file: Uploaded) => canRenameFile(fileContext(file)),
    /** s.150 — yalnız yükleyen (ekip satırı varken). */
    canDelete: (file: Uploaded) => canDeleteFile(fileContext(file)),
  }
}
