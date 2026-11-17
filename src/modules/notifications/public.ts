// notifications modülünün (14 Bildirimler; F7) dışa açık yüzü. Diğer modüller ve `app/` yalnız bu
// dosyayı içe aktarır. Panel gövdesi W158, Web Push arayüzü ve service worker W159'dadır; bu yüz
// veri katmanı + sözleşmelerdir.
export {
  UNREAD_NOTIFICATIONS_KEY,
  useNotifications,
  usePushPublicKey,
  useSubjectMutes,
  useUnreadNotifications,
} from './api/queries'
export { fetchNotificationCounts } from './api/fetchers'
export {
  NOTIFICATION_NOT_FOUND,
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMuteNotificationSubject,
  useRegisterPushTarget,
  useUnmuteNotificationSubject,
  useUnregisterPushTarget,
} from './api/writes'
export { default as NotificationPanel } from './components/NotificationPanel.vue'
export { default as PushOptInCard } from './components/PushOptInCard.vue'
export {
  FALLBACK_ENTRY,
  KNOWN_NOTIFICATION_TYPES,
  NOTIFICATION_DICTIONARY,
  describeNotification,
  type DictionaryEntry,
  type NotificationAction,
  type NotificationTone,
} from './model/dictionary'
export { NOTIFICATION_PANEL_ID } from './model/panel'
export { notificationTarget, type NotificationTarget } from './model/target'
export { notificationCapabilities, type NotificationCapabilities } from './model/capabilities'
export { AWAITING_TAB, INLINE_DECISION } from './model/stubs'
export * from './model/refresh'
export type * from './model/types'
export { notificationText, type NotificationTextKey } from './messages'
