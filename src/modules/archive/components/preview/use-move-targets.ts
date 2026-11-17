import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

import { isListTruncated } from '@/shared/http/truncation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useArchiveUploadTasks } from '../../api/queries'
import { moveTargetSource } from '../../model/admin-scope'
import { archiveCapabilities, type MoveTargetDepartment } from '../../model/capabilities'
import { uploadTasks } from '../../model/tasks'

/**
 * Taşıma hedefi adayları (W194): görev seçenekleri YALNIZ pencere açıkken okunur (`include_empty`
 * okuması; yükleme seçicisiyle aynı uç). Yönetici programın bütün departmanlarındaki görevleri
 * (tek S2 okuma) görür. Koordinatör/üye yalnız `departmentId` ile seçilen TEK yetkili departmanın
 * görevlerini okur (`departments` içinde değilse istek yok; fan-out yok); aday = dosyanın şu anki
 * görevinden BAŞKA ∧ o departmanın görevi ∧ hedefte yükleme yetkisi (`archiveCapabilities.upload`, sunucu yine denetler). Sorgu
 * anahtarı departmanı taşır: eski departmanın geç yanıtı yeni listeye karışmaz. Hedef departman
 * seçmek global kapsamı değiştirmez; kaynak dosyanın S3 başlıkları çağıranda kalır.
 */
export function useMoveTargets(
  open: MaybeRefOrGetter<boolean>,
  departments: Readonly<Ref<readonly MoveTargetDepartment[]>>,
  departmentId: Readonly<Ref<string>>,
  sourceWorkItemId: () => string,
) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const admin = computed(() => (standing.value === null ? null : standing.value.companyAdmin))
  const chosen = computed(() =>
    departments.value.some((d) => d.departmentId === departmentId.value)
      ? departmentId.value
      : null,
  )
  const source = computed(() => moveTargetSource(store.snapshot, admin.value, chosen.value))
  const query = useArchiveUploadTasks(source, () => toValue(open))
  const candidates = computed(() => {
    const caps = archiveCapabilities(standing.value, store.snapshot.programId)
    return uploadTasks(query.data.value?.tasks).filter(
      (task) =>
        task.workItemId !== sourceWorkItemId() &&
        caps.upload(task.departmentId) &&
        (admin.value === true || task.departmentId === chosen.value),
    )
  })
  return {
    candidates,
    truncated: computed(() => isListTruncated(query.data.value)),
    loading: computed(() => query.isPending.value && toValue(open) && source.value !== null),
    failed: computed(() => query.isError.value && query.data.value === undefined),
  }
}
