/**
 * Kabuk ana alanında ne gösterilir (K7; 00-ortak `mekanizma.md` §6, `backend.md` §6). Açık
 * durumların URL'si yoktur: rota içeriği yerine yerinde gösterilir, kapsam düzelince kullanıcı
 * aynı rotada kalır (`OPEN_STATES`).
 *
 *  - `organization.membership_required` (`listPrograms` 403) → "departman ataması bekleniyor";
 *    hiçbir kart gösterilmez.
 *  - Görünür program yok → "program yok" (yönetici: "Program oluştur" → `/programlar`, W81).
 *    Program yönetimi rotası bu durumdan muaftır (`NO_PROGRAM_EXEMPT_ROUTES`): sayfanın kendi
 *    boş durumu ve "Yeni program" düğmesi çizilir (rota kapısı yönetici olmayanı geri gönderir).
 *  - Seçili programda mercek yok → "programa departman katılmamış" (yönetici: "departman ekle").
 *    Yönetici (Admin merceği her programda vardır) için aynı durum programın bağlı departman
 *    listesinin boşluğundan gelir (`DepartmentGap`, `listProgramDepartments`); yalnız içerik
 *    alanında gösterilir, menü/kabuk açık kalır. Liste beklenirken içerik yerine "yükleniyor".
 *    Bu durumdan muaf rotalar `NO_DEPARTMENT_EXEMPT_ROUTES` (F2 yönetim ekranları buraya).
 *  - Kapsam yükleniyor / hata / seçim bekleniyor: yalnız kapsamlı rotalarda (S2/S3) içerik yerine
 *    durum gösterilir — kapsamsız istek atılmaz (`client.scope_missing`); S0/S1 içerik çizilir.
 *  - S0 rotaları (açık kimlik sayfaları, ör. `/oturum`) kapsamdan bağımsızdır: açık durum onların
 *    yerine geçmez (kurulum provası ilk programdan önce de giriş/oturum sayfasını görür). S1+
 *    her rotada geçerlidir (01 ana sayfası `modules/home`, S1).
 * "Güncelleme gerekli" kabuktan önce, uygulama kökünde ele alınır (`UpdateRequired.vue`).
 */
import type { OpenStateName, RouteName } from '@/app/routes.catalog'
import type { ShellContent } from '@/app/shell/types'
import type { ScopeStatus } from '@/shared/scope/lifecycle'
import type { DepartmentGap, ScopeEmptyReason } from '@/shared/scope/resolve'
import type { ScopeClass } from '@/shared/scope/scope-class'

export const EMPTY_REASON_STATES: Readonly<Record<ScopeEmptyReason, OpenStateName>> = {
  membership_required: 'state.membership-pending',
  no_program: 'state.no-program',
  no_lens: 'state.no-department',
}

/**
 * Yöneticinin "programa departman katılmamış" durumundan muaf rotalar (W22 devri, F2 açılışı —
 * 05/08 README satır dışı varsayımlar, kabul): yönetici departmansız programda kullanıcı
 * oluşturup departman bağlayabilmeli (05) ve 08'e girip birim ekleyebilmeli (E-08-39). Program
 * yönetimi (E-00-25, W81): departmansız programa departman bağlama ve aktarım buradan yapılır.
 */
export const NO_DEPARTMENT_EXEMPT_ROUTES: ReadonlySet<RouteName> = new Set<RouteName>([
  'organization.users',
  'organization.user',
  'organization.coordinatorships',
  'organization.coordinatorship',
  'program.programs',
])

/** "Program yok" (K7) durumundan muaf rotalar: program oluşturma yolu (E-00-25, W81). */
export const NO_PROGRAM_EXEMPT_ROUTES: ReadonlySet<RouteName> = new Set<RouteName>([
  'program.programs',
])

function isExemptEmpty(input: ShellContentInput): boolean {
  return (
    input.emptyReason === 'no_program' &&
    input.routeName !== undefined &&
    NO_PROGRAM_EXEMPT_ROUTES.has(input.routeName)
  )
}

export interface ShellContentInput {
  status: ScopeStatus
  emptyReason: ScopeEmptyReason | null
  routeScope: ScopeClass | undefined
  /** Etkin rota adı (muafiyet denetimi); katalog dışı / eşleşmeyen rota için `undefined`. */
  routeName?: RouteName | undefined
  /** Yönetici program departman boşluğu (`useProgramDepartmentGap`); verilmezse `none`. */
  departmentGap?: DepartmentGap
}

const SCOPED: ReadonlySet<ScopeClass> = new Set<ScopeClass>(['S2', 'S3'])

function departmentGapContent(input: ShellContentInput): ShellContent | null {
  if (input.routeName && NO_DEPARTMENT_EXEMPT_ROUTES.has(input.routeName)) return null
  if (input.departmentGap === 'empty') return { kind: 'open-state', name: 'state.no-department' }
  if (input.departmentGap === 'checking') return { kind: 'loading' }
  return null
}

function scopeStatusContent(status: ScopeStatus): ShellContent {
  switch (status) {
    case 'ready':
      return { kind: 'content' }
    case 'selecting':
      return { kind: 'selecting' }
    case 'error':
      return { kind: 'error' }
    default:
      return { kind: 'loading' }
  }
}

export function resolveShellContent(input: ShellContentInput): ShellContent {
  if (input.routeScope === 'S0') return { kind: 'content' }
  if (input.emptyReason && !isExemptEmpty(input)) {
    return { kind: 'open-state', name: EMPTY_REASON_STATES[input.emptyReason] }
  }
  const gap = departmentGapContent(input)
  if (gap) return gap
  if (!input.routeScope || !SCOPED.has(input.routeScope)) return { kind: 'content' }
  return scopeStatusContent(input.status)
}
