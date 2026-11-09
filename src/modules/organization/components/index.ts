/**
 * Organizasyon ekranları bileşen İSKELETİ (W71; O2b sözleşmesi — K15, CX-F0-Ö-06). Adlar ve
 * prop/emit tipleri burada SABİTTİR; her O2b uygulayıcısı (W72–W76) yalnız kendi `.vue`
 * dosyasının gövdesini doldurur, bu dosyaya satır eklemez/değiştirmez. Sözleşme değişikliği
 * koordinatör kararıdır.
 *
 * Ortak kurallar (bütün bileşenler):
 *  - Veri yalnız `../api` composable'larından; anahtarlar `query-keys.ts`'ten (grup kendi
 *    anahtarını yazmaz). S2 yazmalarında program eylem anındaki seçili programdır
 *    (`ProgramRef.programId`); departman YOL parametresidir.
 *  - Eylem görünürlüğü yalnız `../model/capabilities.ts` (`organizationFacts` + `can`); mercek
 *    yetki değildir (P1); yetkisiz eylem gizlenir, hedef = çağıran ise yıkıcı eylem gizlenir; BE
 *    kaynaklı eksik eylem devre dışı + `designStub`.
 *  - Yazmalar `../api` sarmalayıcılarıyla (anahtarsız; kör tekrar yok, sonuç bilinmiyorsa liste
 *    yeniden okunur); `confirmation_required` üç uçta sarmalayıcının içinde (`submit(vars,
 *    confirmOptions)` → vazgeçte `null`); istemci yıkıcı onayı (`deleteUser`) `shared/ui/confirm`
 *    `useConfirm` ile; sonuç `notifyOutcome` / `UiOutcomeNotice`. İyimser güncelleme yok.
 *  - Geçici parola yalnız `TemporaryPasswordDialog` form belleğinde; emit/prop/sorgu/günlükte yok.
 * Kabul ölçütü: `docs/ekranlar/08-koordinatorlukler/README.md` ve `05-kullanicilar/README.md`
 * kabul tabloları (yalnız `kabul`) + satır dışı varsayımlar.
 */
import type { UserRoleTab } from '../model/capabilities'
import type { CoordinatorshipView, PersonOption } from '../model/types'

/** 08b sekmeleri (E-08-57; URL `sekme`). Arşiv/Toplantılar F2'de devre dışı (URL'de yok). */
export type CoordinatorshipTab = 'genel' | 'uyeler' | 'gorevler' | 'ayarlar'

// --- W72 — 08 Koordinatörlükler liste --------------------------------------------------------

/** W72 · E-08-27…45 — düz kart ızgarası (süzülmüş/sıralanmış küme sayfadan gelir). */
export interface CoordinatorshipGridProps {
  items: readonly CoordinatorshipView[]
}
export interface CoordinatorshipGridEmits {
  /** E-08-33 "Koordinatör ata" (yalnız koordinatörsüz kart) → W74 `CoordinatorAssignDialog`. */
  assignCoordinator: [departmentId: string]
  /** E-08-38 "Görev ata" → work `NewTaskDialog` (departman ön seçili). */
  createTask: [departmentId: string]
}

/** W72 · E-08-27…38 — tek kart (kod rozeti, ad, koordinatörler, sayılar, durum, menü). */
export interface CoordinatorshipCardProps {
  item: CoordinatorshipView
}
export interface CoordinatorshipCardEmits {
  assignCoordinator: [departmentId: string]
  createTask: [departmentId: string]
}

// --- W73 — 08b Koordinatörlük detayı ---------------------------------------------------------

/** W73 · E-08-50…90 — detay gövdesi (başlık, sekmeler, KPI, Hakkında, Ekip, Dikkat, Kısayollar). */
export interface CoordinatorshipDetailProps {
  departmentId: string
  /** URL `sekme`; varsayılan `genel`. */
  tab?: CoordinatorshipTab
}
export interface CoordinatorshipDetailEmits {
  /** Sekme değişti; sayfa URL `sekme`'yi yazar. */
  'update:tab': [tab: CoordinatorshipTab]
}

// --- W74 — organizasyon formları (P3 minimum; K11 vee-validate + zod) -----------------------

/**
 * W74 · E-08-05, E-08-63, E-08-70 — yeni koordinatörlük (`departmentId` yok/`null`: oluştur →
 * bağla, `department_exists` → mevcut departmanı ekle) ya da düzenleme (programdaki ad /
 * katalog alanları ayrı sonuç).
 */
export interface DepartmentFormProps {
  /** `v-model:open`. */
  open: boolean
  departmentId?: string | null
}
export interface DepartmentFormEmits {
  'update:open': [value: boolean]
  /** Oluşturulan / düzenlenen departman (kısmi başarıda da: katalog kaydı oluştuysa). */
  saved: [departmentId: string]
}

/** W74 · E-08-33 — koordinatör ata (kişi seçici → `assignCoordinator`). */
export interface CoordinatorAssignDialogProps {
  open: boolean
  departmentId: string
}
export interface CoordinatorAssignDialogEmits {
  'update:open': [value: boolean]
  assigned: [accountId: string]
}

/** W74 · E-08-79, E-05-33 — üye ekle (kişi seçici + rol → `assignMembership`). */
export interface MemberAddDialogProps {
  open: boolean
  departmentId: string
}
export interface MemberAddDialogEmits {
  'update:open': [value: boolean]
  added: [accountId: string]
}

/** W74 · E-08-33/79 seçici — `listUsers` `search` ile kişi seçimi (`v-model`). */
export interface PersonPickerProps {
  modelValue: PersonOption | null
  /** Seçenekten düşülecek hesaplar (ör. zaten ekipte olanlar). */
  excludeAccountIds?: readonly string[]
  /** Erişilebilir ad (alan etiketi; çağıran çevirir). */
  label: string
}
export interface PersonPickerEmits {
  'update:modelValue': [value: PersonOption | null]
}

/** W74 · E-05-05 — "Kullanıcı oluştur" (`createUser`; `transfer_available` akışı). */
export interface UserCreateDialogProps {
  open: boolean
  /** Ön seçili birim (seçili programdaki); `null` = kullanıcı seçer. */
  departmentId?: string | null
}
export interface UserCreateDialogEmits {
  'update:open': [value: boolean]
  /** Oluşturulan / aktarılan hesap; çağıran "Geçici parola belirle" adımını açabilir. */
  created: [accountId: string]
}

/** W74 · 05 satır dışı "Geçici parola belirle" (`updateAccount`; parola yalnız form belleğinde). */
export interface TemporaryPasswordDialogProps {
  open: boolean
  accountId: string
}
export interface TemporaryPasswordDialogEmits {
  'update:open': [value: boolean]
  /** Parola belirlendi (parola TAŞINMAZ). */
  done: []
}

// --- W75 — 05 Kullanıcılar --------------------------------------------------------------------

/**
 * W75 · E-05-06…24 — tablo: veri `useUserList` (koordinatörlük süzgecinde `useDepartmentRoster`),
 * "Daha fazla yükle", sıralama "kullanıcı ↑/↓" (bellekte). Süzgeçler sayfanın URL'sinden.
 */
export interface UsersTableProps {
  /** URL `rol` (E-05-06; istemci süzmesi, seçili programın etiketleri). */
  roleTab: UserRoleTab
  /** URL `q` (sunucu `search`, ~300 ms gecikmeli). */
  search: string
  /** URL `koordinatorluk` (tek birim → `listMembers`); yoksa `null`. */
  departmentId: string | null
  /** Seçili kişi (URL `secili`); yoksa `null`. */
  selectedAccountId: string | null
}
export interface UsersTableEmits {
  select: [accountId: string]
}

/** W75 · E-05-25…38 (+ satır dışı hesap eylemleri) — yan panel; 05b "Hesap ve roller"de gömülü. */
export interface UserPanelProps {
  accountId: string
  /** 05b sekmesinde gömülü (kapat düğmesi yok). */
  embedded?: boolean
}
export interface UserPanelEmits {
  /** E-05-28: panel kapandı; çağıran URL `secili`'yi siler. */
  close: []
  /** E-05-36: kullanıcı silindi; panel kapanır, liste yeniden okundu. */
  deleted: [accountId: string]
}

// --- W76 — 05b Kişisel takip -----------------------------------------------------------------

/** W76 · E-05-40…75 — kişisel takip gövdesi (başlık, kartlar, sekmeler, tablo, takvim). */
export interface PersonalTrackingProps {
  accountId: string
}

// --- Bileşenler (gövdeler O2b'de) ------------------------------------------------------------

export { default as CoordinatorshipGrid } from './coordinatorships/CoordinatorshipGrid.vue'
export { default as CoordinatorshipCard } from './coordinatorships/CoordinatorshipCard.vue'
export { default as CoordinatorshipDetail } from './detail/CoordinatorshipDetail.vue'
export { default as DepartmentForm } from './forms/DepartmentForm.vue'
export { default as CoordinatorAssignDialog } from './forms/CoordinatorAssignDialog.vue'
export { default as MemberAddDialog } from './forms/MemberAddDialog.vue'
export { default as PersonPicker } from './forms/PersonPicker.vue'
export { default as UserCreateDialog } from './forms/UserCreateDialog.vue'
export { default as TemporaryPasswordDialog } from './forms/TemporaryPasswordDialog.vue'
export { default as UsersTable } from './users/UsersTable.vue'
export { default as UserPanel } from './users/UserPanel.vue'
export { default as PersonalTracking } from './tracking/PersonalTracking.vue'
