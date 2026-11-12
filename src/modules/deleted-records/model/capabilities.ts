/**
 * Silinen kayıtlar eylem görünürlüğü (K1; `12-silinen-kayitlar/backend.md` §3). Saf fonksiyonlar;
 * girdi yalnız sunucu OLGUSUDUR: `me.company_admin` (standing). Mercek yetki değildir (P1):
 * Koordinatör/Üye merceğindeki yönetici de ekranı görür. Gizleme güvenlik değildir; sunucu her
 * istekte denetler, 403/404 gerçek sonuçtur (`work.not_authorized`, `collaboration.not_authorized`,
 * `organization.not_authorized`). Rol dizesi karşılaştırması yalnız bu dosyada ve
 * `shared/scope/standing*` içindedir.
 *
 * Kaynak (pin v0.15.0-api): `istemci-akislari.md` §3 "Silinen görevler / hesaplar / departmanlar:
 * yalnız yönetici"; toplantı için meetings README K22/K23 (P30 istisnası).
 */
import type { Standing } from '@/shared/scope/standing-facts'

export const DELETED_RECORDS_CAPABILITY_ACTIONS = ['view', 'restore', 'purge'] as const
export type DeletedRecordsCapabilityAction = (typeof DELETED_RECORDS_CAPABILITY_ACTIONS)[number]

/** Her eylemin kaynağı (tablo testi ve denetim izi için). */
export const DELETED_RECORDS_CAPABILITY_SOURCES: Readonly<
  Record<DeletedRecordsCapabilityAction, string>
> = {
  view: 'istemci-akislari §3 + P36: silinen listeleri yalnız şirket yöneticisi',
  restore: 'istemci-akislari §3/§4 + meetings K22: geri yükleme yalnız şirket yöneticisi',
  purge: 'istemci-akislari §3/§4 + meetings K23: kalıcı silme yalnız şirket yöneticisi',
}

export function deletedRecordsCapabilities(standing: Standing | null) {
  const admin = standing?.companyAdmin === true
  return {
    /** Ekran ve listeler (rota kapısı, ana sayfa düğmesi). */
    view: admin,
    restore: admin,
    purge: admin,
  }
}

export type DeletedRecordsCapabilities = ReturnType<typeof deletedRecordsCapabilities>
