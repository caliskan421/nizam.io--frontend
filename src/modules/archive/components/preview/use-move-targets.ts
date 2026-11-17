import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import { isListTruncated } from '@/shared/http/truncation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useArchiveUploadTasks } from '../../api/queries'
import { moveTargetSource } from '../../model/admin-scope'
import { archiveCapabilities } from '../../model/capabilities'
import { uploadTasks } from '../../model/tasks'

/**
 * Taşıma hedefi adayları (W194): görev seçenekleri YALNIZ pencere açıkken okunur (`include_empty`
 * okuması; yükleme seçicisiyle aynı uç). Yönetici programın bütün departmanlarındaki görevleri
 * (tek S2 okuma), koordinatör/üye seçili kapsamın görevlerini görür; aday = hedefte yükleme yetkisi
 * (`archiveCapabilities.upload`, sunucu yine denetler). Hedef departman seçmek global kapsamı
 * değiştirmez; kaynak dosyanın S3 başlıkları çağıranda kalır.
 */
export function useMoveTargets(open: MaybeRefOrGetter<boolean>) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const source = computed(() =>
    moveTargetSource(store.snapshot, standing.value === null ? null : standing.value.companyAdmin),
  )
  const query = useArchiveUploadTasks(source, () => toValue(open))
  const candidates = computed(() => {
    const caps = archiveCapabilities(standing.value, store.snapshot.programId)
    return uploadTasks(query.data.value?.tasks).filter((task) => caps.upload(task.departmentId))
  })
  return {
    candidates,
    truncated: computed(() => isListTruncated(query.data.value)),
    loading: computed(() => query.isPending.value && toValue(open) && source.value !== null),
    failed: computed(() => query.isError.value && query.data.value === undefined),
  }
}
