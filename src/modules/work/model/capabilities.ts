/**
 * Görev modülü eylem görünürlüğü (K1). Saf fonksiyonlar; girdi yalnız sunucu OLGULARIDIR
 * (`me.company_admin`, seçili programdaki ekip satırı, göreve atanmış olma, yazar/yükleyen
 * olma). Mercek girdi değildir (ortak-kurallar §1, P1). Gizleme güvenlik değildir: sunucu her
 * istekte yine denetler, 403/404 gerçek sonuçtur. Yetkisiz eylem GİZLENİR (backend.md §3).
 *
 * Kaynak (sürümlü): `nizam.io--backend/docs/api/istemci-akislari.md` §4 "İşlem bazlı eylem
 * görünürlüğü" (pin `v0.11.0-api`), tablo satırları s.139–s.152 (`03-gorevler-liste/backend.md`
 * §3 aynı numaraları kullanır). Hücre "evet" ise o olgu tek başına yeter; olgular birleşir,
 * "yöneticilik baskın" sütunu "evet" olan satırlar (s.144, s.148) hariç: orada yöneticilik reddeder.
 * "Koordinatör" görevin departmanının SEÇİLİ PROGRAMDAKİ koordinatörüdür; "atanmış üye" o
 * departmanda `uye` satırı + `assignees[]` içinde olma.
 *
 * §4'te satırı OLMAYAN modüllerin `capabilities.ts` dosyaları (toplantı, organizasyon,
 * kayıtlar/arşiv, raporlama) kaynak olarak backend modül README kural kimliklerini anar —
 * meetings §4, ORGANIZATION-K*, RECORDS-K*, REPORTING-K* (sentez Y3) — ve her fonksiyonun
 * yanında kimliği yazar. Rol dizesi karşılaştırması yalnız bu dosyalarda ve
 * `shared/scope/standing*` içinde yapılır.
 */
import { scopeFacts, type ScopeFacts, type Standing } from '@/shared/scope/standing-facts'

/** Görevin departmanı için olgular: seçili programdaki satırlar + atanmış olma. */
export interface WorkActorFacts extends ScopeFacts {
  /** Çağıran bu göreve atanmış mı (`assignees`). */
  assigned: boolean
}

/** Alt görevin atananı çağırana göre (s.147). */
export type SubtaskAssigneeFact = 'none' | 'me' | 'other'

/**
 * Eylemin bağlamı: görev olguları + (satıra göre) kayıt olguları. Verilmeyen kayıt olgusu
 * `false` / `'other'` sayılır (en dar güvenli davranış: eylem gizli).
 */
export interface WorkActionContext extends WorkActorFacts {
  /** Notun yazarı mı (`author_account_id == me`; s.145). */
  author?: boolean
  /** Dosyanın yükleyeni mi (`uploaded_by_account_id == me`; s.149–s.150). */
  uploader?: boolean
  /** Alt görevin atananı (`assignee_account_id`; s.147). */
  subtaskAssignee?: SubtaskAssigneeFact
  /** Görevde bekleyen tarih talebi var mı (`pending_date_request != null`; s.151). */
  pendingDateRequest?: boolean
}

export type WorkCapability =
  | 'manageItem'
  | 'manageAssignments'
  | 'transition'
  | 'ownStatus'
  | 'readNotes'
  | 'writeNote'
  | 'editOwnNote'
  | 'manageSubtasks'
  | 'toggleSubtask'
  | 'uploadFile'
  | 'renameFile'
  | 'deleteFile'
  | 'requestDateChange'
  | 'reviewDateChange'

/** Her işlemin §4 satırı (tablo testi ve denetim izi için). */
export const WORK_CAPABILITY_SOURCES: Readonly<Record<WorkCapability, string>> = {
  manageItem:
    'istemci-akislari §4 s.139: Görev aç, düzenle (kanıt bayrağı dahil), sil, süre uzat, bağımlılık — yönetici ∨ koordinatör',
  manageAssignments: 'istemci-akislari §4 s.140: Atama ekle/kaldır, üstlen/bırak — koordinatör',
  transition:
    'istemci-akislari §4 s.141: Durum geçişi (transitionWorkItem) — koordinatör ∨ atanmış üye',
  ownStatus:
    'istemci-akislari §4 s.142: Kendi durumunu geçir (ownStatusWorkItem) — atanmış koordinatör ∨ atanmış üye',
  readNotes: 'istemci-akislari §4 s.143: Not oku — yönetici ∨ koordinatör ∨ atanmış üye',
  writeNote:
    'istemci-akislari §4 s.144: Not yaz — koordinatör ∨ atanmış üye; yöneticilik baskın (work.not_authorized)',
  editOwnNote:
    'istemci-akislari §4 s.145: Notu düzenle/sil — yalnız yazarı, o kapsamda ekip satırı varken',
  manageSubtasks:
    'istemci-akislari §4 s.146: Alt görev aç/sil/başlık/tarih/atanan — yönetici ∨ koordinatör',
  toggleSubtask:
    'istemci-akislari §4 s.147: Alt görevi kapat/aç — koordinatör ∨ (atanmış üye ∧ alt görev atamasız ya da kendisine)',
  uploadFile:
    'istemci-akislari §4 s.148 (v0.15 ADR-0030, RECORDS-K01): Dosya yükle — yönetici ∨ koordinatör ∨ atanmış üye',
  renameFile:
    'istemci-akislari §4 s.149: Dosya adını değiştir — yönetici ∨ koordinatör ∨ (yükleyen ∧ ekip satırı)',
  deleteFile:
    'istemci-akislari §4 s.150 (v0.15 ADR-0030, RECORDS-K10): Dosya sil — yalnız yükleyen ∧ (yönetici ∨ ekip satırı)',
  requestDateChange:
    'istemci-akislari §4 s.151: Tarih talebi aç — koordinatör; bekleyen talep varken gizli (409 date_request_pending_exists)',
  reviewDateChange: 'istemci-akislari §4 s.152: Tarih talebini incele/sil — yönetici',
}

/** O kapsamda (görevin departmanında) herhangi bir ekip satırı. */
function hasTeamRow(f: WorkActorFacts): boolean {
  return f.coordinator || f.member
}

/** s.139 — `createWorkItem`, `updateWorkItem` (kanıt bayrağı dahil), sil, süre uzat, bağımlılık. */
export function canManageWorkItem(f: WorkActorFacts): boolean {
  return f.companyAdmin || f.coordinator
}

/** s.140 — atama ekle/kaldır, `claimWorkItem` / `unclaimWorkItem`: yalnız koordinatörlük olgusu. */
export function canManageAssignments(f: WorkActorFacts): boolean {
  return f.coordinator
}

/** s.141 — `transitionWorkItem`: koordinatör ya da atanmış üye (yöneticilik tek başına yetmez). */
export function canTransitionWorkItem(f: WorkActorFacts): boolean {
  return f.coordinator || (f.member && f.assigned)
}

/** s.142 — `ownStatusWorkItem`: yalnız göreve atanmışsa (atanmamış koordinatör 403). */
export function canOwnStatusWorkItem(f: WorkActorFacts): boolean {
  return f.assigned && hasTeamRow(f)
}

/** s.143 — not oku. */
export function canReadNotes(f: WorkActorFacts): boolean {
  return f.companyAdmin || f.coordinator || (f.member && f.assigned)
}

/** s.144 — not yaz: koordinatör ya da atanmış üye; şirket yöneticisi her durumda reddedilir. */
export function canWriteNote(f: WorkActorFacts): boolean {
  if (f.companyAdmin) return false
  return f.coordinator || (f.member && f.assigned)
}

/** s.145 — kendi notunu düzenle/sil: yazar + o kapsamda ekip satırı. */
export function canEditOwnNote(c: WorkActionContext): boolean {
  return c.author === true && hasTeamRow(c)
}

/** s.146 — alt görev aç/sil/başlık/tarih/atanan. */
export function canManageSubtasks(f: WorkActorFacts): boolean {
  return f.companyAdmin || f.coordinator
}

/** s.147 — alt görev `done`: koordinatör; atanmış üye yalnız atamasız ya da kendisine atanmışsa. */
export function canToggleSubtask(c: WorkActionContext): boolean {
  if (c.coordinator) return true
  const assignee = c.subtaskAssignee ?? 'other'
  return c.member && c.assigned && assignee !== 'other'
}

/**
 * s.148 — dosya yükle (v0.15 ADR-0030, RECORDS-K01/K02): şirket yöneticisi ekip satırı ve atama
 * aranmadan yükler; koordinatör; atanmış üye. Arşiv modülüyle (`archive/model/capabilities.ts`) aynı kural.
 */
export function canUploadFile(f: WorkActorFacts): boolean {
  return f.companyAdmin || f.coordinator || (f.member && f.assigned)
}

/** s.149 — dosya adını değiştir: yönetici, koordinatör ya da (yükleyen ∧ ekip satırı). */
export function canRenameFile(c: WorkActionContext): boolean {
  return c.companyAdmin || c.coordinator || (c.uploader === true && hasTeamRow(c))
}

/**
 * s.150 — dosya sil (v0.15 ADR-0030, RECORDS-K10): yalnız yükleyen; yükleyen şirket yöneticisi
 * ekip satırı aranmadan, diğerleri o kapsamda ekip satırı varken. Yönetici başkasınınkini silemez.
 */
export function canDeleteFile(c: WorkActionContext): boolean {
  return c.uploader === true && (c.companyAdmin || hasTeamRow(c))
}

/** s.151 — tarih talebi aç: koordinatör; bekleyen talep varsa gizli (ikinci talep 409). */
export function canRequestDateChange(c: WorkActionContext): boolean {
  return c.coordinator && c.pendingDateRequest !== true
}

/** s.152 — tarih talebini incele/sil: yalnız yönetici. */
export function canReviewDateChange(f: WorkActorFacts): boolean {
  return f.companyAdmin
}

export const WORK_CAPABILITIES: Readonly<
  Record<WorkCapability, (c: WorkActionContext) => boolean>
> = {
  manageItem: canManageWorkItem,
  manageAssignments: canManageAssignments,
  transition: canTransitionWorkItem,
  ownStatus: canOwnStatusWorkItem,
  readNotes: canReadNotes,
  writeNote: canWriteNote,
  editOwnNote: canEditOwnNote,
  manageSubtasks: canManageSubtasks,
  toggleSubtask: canToggleSubtask,
  uploadFile: canUploadFile,
  renameFile: canRenameFile,
  deleteFile: canDeleteFile,
  requestDateChange: canRequestDateChange,
  reviewDateChange: canReviewDateChange,
}

/** Görevin olguları için gereken alanlar (`WorkItem` alt kümesi). */
export interface WorkItemFacts {
  department_id: string
  assignee_account_ids: readonly string[]
}

/**
 * Bir görev için olgular: yetki SEÇİLİ PROGRAMDAKİ `(program, görevin departmanı)` satırından
 * okunur (mercekten bağımsız, P1); atanmış olma `assignee_account_ids ∋ me`. Standing henüz
 * yoksa her olgu `false` (en dar güvenli davranış).
 */
export function workActorFacts(
  standing: Standing | null,
  programId: string | null,
  item: WorkItemFacts,
): WorkActorFacts {
  const facts = scopeFacts(standing, programId, item.department_id)
  const me = standing?.accountId
  return { ...facts, assigned: me !== undefined && item.assignee_account_ids.includes(me) }
}

/** Kayıt sahibi olgusu (not yazarı, dosya yükleyeni). */
export function isSelf(standing: Standing | null, accountId: string | null | undefined): boolean {
  return standing !== null && accountId !== null && accountId === standing.accountId
}

/** Alt görevin atananı çağırana göre (s.147). */
export function subtaskAssigneeFact(
  standing: Standing | null,
  assigneeAccountId: string | null | undefined,
): SubtaskAssigneeFact {
  if (!assigneeAccountId) return 'none'
  return isSelf(standing, assigneeAccountId) ? 'me' : 'other'
}

/** Seçili programda koordinatör olunan departmanlar (yeni görevin hedef seçenekleri, s.139). */
export function coordinatorDepartmentIds(standing: Standing | null, programId: string | null) {
  const ids = new Set<string>()
  for (const row of standing?.rows ?? []) {
    if (row.programId === programId && row.role === 'coordinator') ids.add(row.departmentId)
  }
  return ids
}

/**
 * "Yeni görev" düğmesi (E-03-06, s.139): şirket yöneticisi ya da seçili programda en az bir
 * departmanın koordinatörü. Hedef departman koordinatörde kendi departmanıdır
 * (`coordinatorDepartmentIds`); yönetici programın herhangi bir departmanını seçer.
 */
export function canCreateWorkItem(standing: Standing | null, programId: string | null): boolean {
  if (!standing || programId === null) return false
  return standing.companyAdmin || coordinatorDepartmentIds(standing, programId).size > 0
}
