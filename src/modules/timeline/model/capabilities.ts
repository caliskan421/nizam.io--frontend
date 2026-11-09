/**
 * Zaman çizelgesi eylem görünürlüğü ve tarih yazma politikası (K1, ortak-kurallar §12 P8).
 * Saf fonksiyonlar; girdi YÜZ + sunucu OLGULARIDIR (`me.company_admin`, görevin departmanındaki
 * ekip satırı). Rol DİZESİ yok: olgular `scopeFacts`'ten gelir (KESİN 6). Mercek yetki
 * vermez (P1): şirket yöneticisi Koordinatör merceğinde (koordinatör yüzü) yönetici yetkisini
 * KORUR; yüz yalnız Gantt kümesini seçer. Gizleme güvenlik değildir: 403/404 gerçek sonuçtur.
 *
 * Kaynak: 03c README "Uygulama kararı" E-03C-47, 58–59, 63–64, 66, 70 ve "satır dışı
 * varsayımlar" 1–2; `backend.md` §3 (istemci-akislari §4 s.139, s.151, s.152).
 *
 * P8 politikası (bağlayıcı): Koordinatör sürüklemesi/paneli `requestDateChange` (talep, onaya
 * gider); Admin doğrudan (`extendWorkItem` yalnız bitiş ileri 1–90 gün, aksi `updateWorkItem`);
 * Üye sürükleyemez. Sözleşme koordinatöre doğrudan `updateWorkItem` izni de verir; bu ürün
 * tercihidir ve burada kodlanır.
 *
 * Varsayımlar (karar yok → en dar güvenli davranış, rapora yazılı):
 *  - Üye yüzünde düz üye (yönetici değil) tarih/bağımlılık yazamaz; `company_admin` yetkisi
 *    yüzden bağımsız korunur (P1) ve Admin politikasıyla yazar. Yüz yalnız okunan Gantt'ı seçer.
 *  - Tamamlanmış görevde tutamaç yoktur (uzatma 409 `work.item_completed`; backend.md §3).
 */
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { scopeFacts, type ScopeFacts, type Standing } from '@/shared/scope/standing-facts'

import { dayDiff } from './dates'
import type { GanttFace } from './types'

/** Tarih yazma yolu: doğrudan (Admin), talep (Koordinatör) ya da yok (Üye / yetkisiz). */
export type DatePolicy = 'direct' | 'request' | 'none'

/** Eylem bağlamı: yüz + görevin departmanındaki olgular. */
export interface TimelineActorFacts extends ScopeFacts {
  face: GanttFace
}

export interface TimelineActionContext extends TimelineActorFacts {
  /** Görevde bekleyen tarih talebi var mı (`getWorkItem.pending_date_request != null`). */
  pendingDateRequest?: boolean
  /** Görev tamamlandı mı (`status == tamamlandi`). */
  completed?: boolean
}

export type TimelineCapability =
  | 'dragHandles'
  | 'directDateWrite'
  | 'requestDateChange'
  | 'reviewDateRequest'
  | 'seeDateRequest'
  | 'manageDependencies'
  | 'readDependencies'

export const TIMELINE_CAPABILITY_SOURCES: Readonly<Record<TimelineCapability, string>> = {
  dragHandles:
    '03c E-03C-47 / P8: Koordinatör ve Admin tutamaç görür (tamamlanmamış görevde); Üye yüzünde tutamaç yok',
  directDateWrite:
    '03c E-03C-58/59 / P8: Admin (company_admin olgusu, mercekten bağımsız) doğrudan updateWorkItem / extendWorkItem',
  requestDateChange:
    'istemci-akislari §4 s.151 / P8: Koordinatör requestDateChange; bekleyen talep varken gizli; Admin tek başına gizli',
  reviewDateRequest:
    'istemci-akislari §4 s.152 / P5: bekleyen talebi onayla/reddet — yalnız company_admin; yönetici yetkisi yüzden bağımsız',
  seeDateRequest:
    '03c E-03C-42: talep uzantısı — Admin her görevde, Koordinatör kendi biriminde, Üye hiç',
  manageDependencies:
    'istemci-akislari §4 s.139 / E-03C-66: bağımlılık ekle/kaldır — yönetici ∨ koordinatör; Üye yüzünde gizli',
  readDependencies:
    'backend.md §3: listDependencies — yalnız koordinatör ve yönetici; Üye yüzünde çağrılmaz',
}

/** Yönetim yetkisi (company_admin) ya da görevin departmanında koordinatörlük. */
function manages(f: TimelineActorFacts): boolean {
  if (f.face === 'member') return f.companyAdmin
  return f.companyAdmin || f.coordinator
}

/**
 * Tarih yazma yolu. Admin yüzünde yalnız `company_admin` yazabilir; Koordinatör yüzünde
 * `company_admin` yetkisini korur (P1) ve doğrudan yazar, yalnız koordinatör talep açar; Üye
 * yüzünde yok.
 */
export function datePolicy(f: TimelineActorFacts): DatePolicy {
  if (f.companyAdmin) return 'direct'
  if (f.face === 'coordinator' && f.coordinator) return 'request'
  return 'none'
}

/** Seçili satırda sürükleme tutamaçları (E-03C-47). */
export function canDragHandles(c: TimelineActionContext): boolean {
  return c.completed !== true && datePolicy(c) !== 'none'
}

/** Admin yolu: panelde "Kaydet" ve sürüklemede doğrudan yazma (E-03C-58/59/64). */
export function canDirectDateWrite(c: TimelineActionContext): boolean {
  return datePolicy(c) === 'direct'
}

/**
 * Tarih talebi gönder (E-03C-64, s.151): koordinatör olgusu (birleşik rolde de görünür) ve
 * bekleyen talep yok. Admin tek başına gizli; Üye yüzünde gizli.
 */
export function canRequestDateChange(c: TimelineActionContext): boolean {
  return c.face !== 'member' && c.coordinator && c.pendingDateRequest !== true
}

/** Bekleyen talebi onayla / reddet (E-03C-64, s.152): yönetici ve görevde bekleyen talep var. */
export function canReviewDateRequest(c: TimelineActionContext): boolean {
  return c.companyAdmin && c.pendingDateRequest === true
}

/** Talep uzantısı / bekleyen talep gösterimi (E-03C-42). */
export function canSeeDateRequest(c: TimelineActionContext): boolean {
  return manages(c)
}

/** Bağımlılık ekle / kaldır (E-03C-37, E-03C-66). */
export function canManageDependencies(c: TimelineActionContext): boolean {
  return manages(c)
}

/** `listDependencies` okuması (panel menüsü). */
export function canReadDependencies(c: TimelineActionContext): boolean {
  return manages(c)
}

export const TIMELINE_CAPABILITIES: Readonly<
  Record<TimelineCapability, (c: TimelineActionContext) => boolean>
> = {
  dragHandles: canDragHandles,
  directDateWrite: canDirectDateWrite,
  requestDateChange: canRequestDateChange,
  reviewDateRequest: canReviewDateRequest,
  seeDateRequest: canSeeDateRequest,
  manageDependencies: canManageDependencies,
  readDependencies: canReadDependencies,
}

/** Görevin departmanı için olgular (seçili programdan; mercekten bağımsız). */
export function timelineActorFacts(
  standing: Standing | null,
  scope: ScopeSnapshot,
  face: GanttFace,
  departmentId: string,
): TimelineActorFacts {
  return { ...scopeFacts(standing, scope.programId, departmentId), face }
}

/** `extendWorkItem` sınırları (sözleşme: 1–90 gün). */
export const EXTEND_DAYS_MIN = 1
export const EXTEND_DAYS_MAX = 90

export interface DateRange {
  start_on: string
  end_on: string
}

/** Bırakmanın yazma eşlemesi (P8). */
export type DateWrite =
  | { kind: 'request'; newStartOn: string; newEndOn: string }
  /** Yalnız bitiş ileri 1–90 gün: `extendWorkItem`. */
  | { kind: 'extend'; days: number }
  /** Diğer her değişim: önce `getWorkItem` (sürüm), sonra `updateWorkItem`. */
  | { kind: 'update'; start_on: string; end_on: string }

/**
 * Sürükleme/klavye bırakmasını yazma eylemine eşler. `before` → `after` aynıysa ya da tarih
 * bozuksa `null` (istek yok). Politika `datePolicy`'den: Koordinatör → talep (iki uç da
 * gönderilir, `new_start_on` + `new_end_on` zorunlu); Admin → bitiş-ileri-yalnız ise uzat, aksi
 * `updateWorkItem`; Üye/yetkisiz → `null`.
 */
export function dateWriteFor(
  policy: DatePolicy,
  before: DateRange,
  after: DateRange,
): DateWrite | null {
  if (policy === 'none') return null
  const startMoved = dayDiff(before.start_on, after.start_on)
  const endMoved = dayDiff(before.end_on, after.end_on)
  if (startMoved === null || endMoved === null) return null
  if (startMoved === 0 && endMoved === 0) return null
  if (policy === 'request') {
    return { kind: 'request', newStartOn: after.start_on, newEndOn: after.end_on }
  }
  const forwardEndOnly =
    startMoved === 0 && endMoved >= EXTEND_DAYS_MIN && endMoved <= EXTEND_DAYS_MAX
  if (forwardEndOnly) return { kind: 'extend', days: endMoved }
  return { kind: 'update', start_on: after.start_on, end_on: after.end_on }
}
