/**
 * Kabuk ana alanında ne gösterilir (K7; 00-ortak `mekanizma.md` §6, `backend.md` §6). Açık
 * durumların URL'si yoktur: rota içeriği yerine yerinde gösterilir, kapsam düzelince kullanıcı
 * aynı rotada kalır (`OPEN_STATES`).
 *
 *  - `organization.membership_required` (`listPrograms` 403) → "departman ataması bekleniyor";
 *    hiçbir kart gösterilmez.
 *  - Görünür program yok → "program yok" (yönetici: "program oluştur", F2'de).
 *  - Seçili programda mercek yok → "programa departman katılmamış" (yönetici: "departman ekle").
 *  - Kapsam yükleniyor / hata / seçim bekleniyor: yalnız kapsamlı rotalarda (S2/S3) içerik yerine
 *    durum gösterilir — kapsamsız istek atılmaz (`client.scope_missing`); S0/S1 içerik çizilir.
 *  - S0 rotaları (açık kimlik sayfaları, ör. `/oturum`) kapsamdan bağımsızdır: açık durum onların
 *    yerine geçmez (kurulum provası ilk programdan önce de giriş/oturum sayfasını görür). F0'da
 *    ana sayfa geçici olarak `/oturum`'a yönlendiğinden açık durumlar ana sayfa içeriği (01, S1)
 *    bağlanınca görünür; S1+ her rotada geçerlidir.
 * "Güncelleme gerekli" kabuktan önce, uygulama kökünde ele alınır (`UpdateRequired.vue`).
 */
import type { OpenStateName } from '@/app/routes.catalog'
import type { ShellContent } from '@/app/shell/types'
import type { ScopeStatus } from '@/shared/scope/lifecycle'
import type { ScopeEmptyReason } from '@/shared/scope/resolve'
import type { ScopeClass } from '@/shared/scope/scope-class'

export const EMPTY_REASON_STATES: Readonly<Record<ScopeEmptyReason, OpenStateName>> = {
  membership_required: 'state.membership-pending',
  no_program: 'state.no-program',
  no_lens: 'state.no-department',
}

export interface ShellContentInput {
  status: ScopeStatus
  emptyReason: ScopeEmptyReason | null
  routeScope: ScopeClass | undefined
}

const SCOPED: ReadonlySet<ScopeClass> = new Set<ScopeClass>(['S2', 'S3'])

export function resolveShellContent(input: ShellContentInput): ShellContent {
  if (input.routeScope === 'S0') return { kind: 'content' }
  if (input.emptyReason) return { kind: 'open-state', name: EMPTY_REASON_STATES[input.emptyReason] }
  if (!input.routeScope || !SCOPED.has(input.routeScope)) return { kind: 'content' }
  switch (input.status) {
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
