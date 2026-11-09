// organization modülünün dışa açık yüzü (05 Kullanıcılar, 05b Kişisel takip, 08
// Koordinatörlükler, 08b Koordinatörlük). `app/` ve diğer modüller yalnız bu dosyayı içe
// aktarır. Sayfa kaydı `organizationRoutes` (`app/router.ts` `MODULE_ROUTES`); Yönetim menü
// grubu kapısı `canSeeAdministration` (`app/shell/side/menu.ts`, K-03 devri). Bileşenler
// (`components/index.ts`) bilinçli olarak burada YOK: stil yan etkili SFC'ler ana pakete girmez;
// modül dışı tüketim (ör. W81 `DepartmentForm`) koordinatör kararıyla eklenir.
export * from './api'
export {
  administrationFacts,
  can,
  canSeeAdministration,
  ORGANIZATION_CAPABILITIES,
  organizationFacts,
  type AdministrationFacts,
  type OrganizationActorFacts,
  type OrganizationCapability,
  type UserRoleTab,
} from './model/capabilities'
export { programMemberships, programRoles } from './model/memberships'
export type { CoordinatorshipView, KnownUser, PersonOption } from './model/types'
export {
  COORDINATORSHIP_QUERY_KEYS,
  COORDINATORSHIP_ROUTE,
  COORDINATORSHIP_TABS,
  coordinatorshipLocation,
  COORDINATORSHIPS_QUERY_KEYS,
  COORDINATORSHIPS_ROUTE,
  COORDINATORSHIPS_SORT_FIELDS,
  COORDINATORSHIPS_VIEWS,
  coordinatorshipsQueryAfterScopeChange,
  organizationRoutes,
  USER_CARDS,
  USER_GROUPINGS,
  USER_QUERY_KEYS,
  USER_ROLE_TABS,
  USER_ROUTE,
  USER_TABS,
  userLocation,
  USERS_QUERY_KEYS,
  USERS_ROUTE,
  usersPanelLocation,
  usersQueryAfterScopeChange,
} from './routes'
