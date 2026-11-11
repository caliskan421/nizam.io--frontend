import { defineAsyncComponent } from 'vue'

// work modülünün dışa açık yüzü. Diğer modüller (ör. 01 ana sayfa) ve `app/` yalnız bu dosyayı
// içe aktarır. Sayfa kaydı `workRoutes` (`app/router.ts` `MODULE_ROUTES`).
export * from './api'
export { assignedSubset, isAssignedTo, lensAssignee } from './model/assignment'
export {
  canCreateWorkItem,
  coordinatorDepartmentIds,
  WORK_CAPABILITIES,
  workActorFacts,
  type WorkActionContext,
  type WorkActorFacts,
  type WorkCapability,
} from './model/capabilities'
// 03c "Yeni görev" sayfa içi diyaloğu (W97a): 03'ün aynı formu; `?yeni=1` yolu diğer girişlerde kalır.
export const NewTaskDialog = defineAsyncComponent(
  () => import('./components/forms/NewTaskDialog.vue'),
)
export type { NewTaskDialogEmits, NewTaskDialogProps } from './components'
export { createPartialText } from './model/messages'
export { departmentTarget, listDepartmentFilter, resolveTarget, targetOf } from './model/target'
export { workShortCode } from './model/short-code'
export { transitionTargets } from './model/transitions'
export type {
  WorkItem,
  WorkItemCounts,
  WorkItemDetail,
  WorkItemStatus,
  WorkTarget,
} from './model/types'
export { WORK_ITEM_STATUSES } from './model/types'
export {
  taskLink,
  TASKS_NEW_TASK_QUERY,
  TASKS_QUERY_KEYS,
  TASKS_ROUTE,
  TASKS_SORT_FIELDS,
  TASKS_STATUS_FILTERS,
  tasksQueryAfterScopeChange,
  workRoutes,
} from './routes'
