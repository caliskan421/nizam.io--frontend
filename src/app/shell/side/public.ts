// Kenar menüsünün dışa açık yüzü (kabuk `AppShell.vue` yalnız bunu içe aktarır).
//
// Sözleşme (W22):
//   <AppSide v-model:collapsed="collapsed" />   props: { collapsed: boolean }
//                                                emits: { 'update:collapsed': [value: boolean] }
//   provide(SCOPE_LIFECYCLE_KEY, useScopeLifecycle())   // kabukta BİR kez; AppSide inject eder
//   useUnreadNotifications()   // E-00-38 zil sayacı (hesap geneli, `['notifications','unread-count']`)
export { default as AppSide } from './AppSide.vue'
export { SCOPE_LIFECYCLE_KEY, injectScopeLifecycle, type ScopeLifecycle } from './scope-key'
export { UNREAD_NOTIFICATIONS_KEY, useUnreadNotifications } from './badges'
