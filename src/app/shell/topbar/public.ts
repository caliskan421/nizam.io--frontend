// Üst çubuğun dışa açık yüzü (kabuk `AppShell.vue` yalnız bunu içe aktarır).
//
//   <AppTopbar :open-state="openState" />   // kapsam yaşam döngüsü `SCOPE_LIFECYCLE_KEY` ile sağlanmış olmalı
export { default as AppTopbar } from './AppTopbar.vue'
export { formatToday } from './today'
