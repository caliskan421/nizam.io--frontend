// deleted-records modülünün dışa açık yüzü (12 Silinen kayıtlar; F5). Diğer modüller ve `app/`
// yalnız bu dosyayı içe aktarır. Sayfa kaydı `deletedRecordsRoutes` (`app/router.ts`
// `MODULE_ROUTES`). Kenar menüsünde giriş yoktur (P36); giriş ana sayfa E-01-02 düğmesidir.
export { DELETED_RECORDS_QUERY_KEYS, DELETED_RECORDS_ROUTE, deletedRecordsRoutes } from './routes'
export {
  DEFAULT_KIND,
  DEFAULT_RANGE,
  DELETED_KINDS,
  DELETED_RANGES,
  DISABLED_KINDS,
  isDeletedKind,
  isDeletedRange,
  parseKind,
  type DeletedKind,
  type DeletedRange,
} from './model/kinds'
export {
  deletedRecordsCapabilities,
  DELETED_RECORDS_CAPABILITY_ACTIONS,
  DELETED_RECORDS_CAPABILITY_SOURCES,
  type DeletedRecordsCapabilities,
} from './model/capabilities'
export { deletedText } from './model/messages'
