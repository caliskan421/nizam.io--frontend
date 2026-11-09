// program modülünün dışa açık yüzü ("Teknofest ve sezon", E-00-25; W81). `app/` ve diğer
// modüller yalnız bu dosyayı içe aktarır. Sayfa kaydı `programRoutes` (`app/router.ts`
// `MODULE_ROUTES`). Bileşenler bilinçli olarak burada YOK (stil yan etkili SFC'ler ana pakete
// girmez).
export {
  canProgram,
  PROGRAM_CAPABILITIES,
  programFacts,
  type ProgramActorFacts,
  type ProgramCapability,
} from './model/capabilities'
export { PROGRAMS_ROUTE, programRoutes } from './routes'
