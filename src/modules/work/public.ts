// work modülünün dışa açık yüzü. Diğer modüller (ör. 01 ana sayfa) ve `app/` yalnız bu dosyayı
// içe aktarır. Sayfa kaydı `workRoutes` (`app/router.ts` `MODULE_ROUTES`).
export * from './api'
export {
  canCreateWorkItem,
  coordinatorDepartmentIds,
  WORK_CAPABILITIES,
  workActorFacts,
  type WorkActionContext,
  type WorkActorFacts,
  type WorkCapability,
} from './model/capabilities'
export { createPartialText } from './model/messages'
export { departmentTarget, listDepartmentFilter, resolveTarget, targetOf } from './model/target'
export { transitionTargets } from './model/transitions'
export type { WorkItem, WorkItemDetail, WorkItemStatus, WorkTarget } from './model/types'
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
