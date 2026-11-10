// timeline modülünün dışa açık yüzü (03c Zaman çizelgesi; WEB-3 W91). `app/` ve diğer
// modüller (03 görev paneli → `DateRequestForm`, 08 kısayolu) yalnız bu dosyayı içe aktarır.
// Sayfa kaydı `timelineRoutes` (`app/router.ts` `MODULE_ROUTES`). Bileşenler bilinçli olarak
// burada YOK (stil yan etkili SFC'ler ana pakete girmez); tek istisna `DateRequestForm` (W94):
// 03 görev paneli (E-03-54/63) aynı formu modül sınırı üzerinden açar.
export * from './api'
export { default as DateRequestForm } from './components/panel/DateRequestForm.vue'
export { panelText } from './components/panel/messages'
export { atCeiling, GANTT_CEILING } from './model/ceiling'
export {
  canDirectDateWrite,
  canDragHandles,
  canManageDependencies,
  canReadDependencies,
  canRequestDateChange,
  canReviewDateRequest,
  canSeeDateRequest,
  datePolicy,
  dateWriteFor,
  EXTEND_DAYS_MAX,
  EXTEND_DAYS_MIN,
  TIMELINE_CAPABILITIES,
  timelineActorFacts,
  type DatePolicy,
  type DateWrite,
  type TimelineActionContext,
  type TimelineActorFacts,
  type TimelineCapability,
} from './model/capabilities'
export { dayDiff, dayNumber, plannedEnd } from './model/dates'
export { ganttFace, ganttTarget } from './model/face'
export { GANTT_FACES } from './model/types'
export type {
  DateChangeRequest,
  Gantt,
  GanttFace,
  GanttLink,
  GanttTarget,
  GanttTask,
} from './model/types'
export {
  TIMELINE_QUERY_KEPT_ON_SCOPE_CHANGE,
  TIMELINE_QUERY_KEYS,
  TIMELINE_ROUTE,
  timelineQueryAfterScopeChange,
  timelineRoutes,
} from './routes'
