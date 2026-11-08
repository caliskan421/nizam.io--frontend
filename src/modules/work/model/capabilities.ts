/**
 * Görev modülü eylem görünürlüğü (K1). Saf fonksiyonlar; girdi yalnız sunucu OLGULARIDIR
 * (`me.company_admin`, seçili programdaki ekip satırı, göreve atanmış olma). Mercek girdi
 * değildir (ortak-kurallar §1). Gizleme güvenlik değildir: sunucu her istekte yine denetler,
 * 403/404 gerçek sonuçtur.
 *
 * Kaynak (sürümlü): `nizam.io--backend/docs/api/istemci-akislari.md` §4 "İşlem bazlı eylem
 * görünürlüğü" (pin `v0.11.0-api`). Hücre "evet" ise o olgu tek başına yeter; olgular birleşir,
 * "yöneticilik baskın" sütunu "evet" olan satırlar hariç (orada yöneticilik reddeder).
 *
 * §4'te satırı OLMAYAN modüllerin `capabilities.ts` dosyaları (toplantı, organizasyon,
 * kayıtlar/arşiv, raporlama) kaynak olarak backend modül README kural kimliklerini anar —
 * meetings §4, ORGANIZATION-K*, RECORDS-K*, REPORTING-K* (sentez Y3) — ve her fonksiyonun
 * yanında kimliği yazar. Rol dizesi karşılaştırması yalnız bu dosyalarda ve
 * `shared/scope/standing*` içinde yapılır.
 */
import type { ScopeFacts } from '@/shared/scope/standing-facts'

/** Görevin departmanı için olgular: seçili programdaki satırlar + atanmış olma. */
export interface WorkActorFacts extends ScopeFacts {
  /** Çağıran bu göreve atanmış mı (`assignees`). */
  assigned: boolean
}

export type WorkCapability = 'manageItem' | 'manageAssignments' | 'transition' | 'writeNote'

/** Her işlemin §4 satırı (tablo testi ve denetim izi için). */
export const WORK_CAPABILITY_SOURCES: Readonly<Record<WorkCapability, string>> = {
  manageItem:
    'istemci-akislari §4: Görev aç, düzenle, sil, süre uzat, bağımlılık — yönetici ∨ koordinatör',
  manageAssignments: 'istemci-akislari §4: Atama ekle/kaldır, üstlen/bırak — koordinatör',
  transition: 'istemci-akislari §4: Durum geçişi (transitionWorkItem) — koordinatör ∨ atanmış üye',
  writeNote:
    'istemci-akislari §4: Not yaz — koordinatör ∨ atanmış üye; yöneticilik baskın (work.not_authorized)',
}

/** `createWorkItem`, `updateWorkItem` (kanıt bayrağı dahil), sil, süre uzat, bağımlılık. */
export function canManageWorkItem(f: WorkActorFacts): boolean {
  return f.companyAdmin || f.coordinator
}

/** Atama ekle/kaldır, `claimWorkItem` / `unclaimWorkItem`: yalnız koordinatörlük olgusu. */
export function canManageAssignments(f: WorkActorFacts): boolean {
  return f.coordinator
}

/** `transitionWorkItem`: koordinatör ya da atanmış üye (yöneticilik tek başına yetmez). */
export function canTransitionWorkItem(f: WorkActorFacts): boolean {
  return f.coordinator || (f.member && f.assigned)
}

/** Not yaz: koordinatör ya da atanmış üye; şirket yöneticisi her durumda reddedilir. */
export function canWriteNote(f: WorkActorFacts): boolean {
  if (f.companyAdmin) return false
  return f.coordinator || (f.member && f.assigned)
}

export const WORK_CAPABILITIES: Readonly<Record<WorkCapability, (f: WorkActorFacts) => boolean>> = {
  manageItem: canManageWorkItem,
  manageAssignments: canManageAssignments,
  transition: canTransitionWorkItem,
  writeNote: canWriteNote,
}
