/**
 * Tek sorgu anahtarı fabrikası (docs/ekranlar/ortak-kurallar.md §6, CX-T-01).
 *
 * Gruplar anahtarı kendisi yazmaz; buradan başvurur. İki tür anahtar vardır:
 *  - **Hesap geneli** (S0/S1, kapsamdan bağımsız): §6 tablosundaki dizi birebir
 *    (`['me']`, `['programs']`, `['users', filters]` …).
 *  - **Kapsamlı** (`scoped(...)`): `scopedKey()` üzerine kurulur; anahtar
 *    `['nizamio', {program, department}, ...parça]` biçimindedir. Kapsam değişince bu kökle
 *    başlayan bütün sorgular iptal edilip önbellekten düşer (K2) — `isScopedQueryKey`.
 *
 * Geçersizleme: `INVALIDATED_BY` her kaynağın §6 "geçersizleyen mutasyonlar" sütununu
 * operationId listesi olarak tutar; `invalidationFilters()` bir mutasyon için TanStack
 * filtrelerini üretir. Yazma sonrası yeniden okuma budur; iyimser güncelleme yoktur (§7).
 */
import type { QueryKey } from '@tanstack/vue-query'

import type { OperationMeta } from '@/shared/api/operations.gen'
import { QUERY_KEY_ROOT, scopedKey, type ScopeSnapshot } from '@/shared/scope/scope'

export type OperationId = OperationMeta['operationId']
export type QueryFilters = Record<string, unknown>
type Part = string | number | QueryFilters

/** Kapsamlı anahtar: `scoped(scope, ['work-items', id])`. */
export function scoped(scope: ScopeSnapshot, parts: ReadonlyArray<Part>): QueryKey {
  return scopedKey(scope, ...parts)
}

/**
 * Anahtar `scoped(...)`/`scopedKey(...)` ile mi üretildi (kapsam değişiminde iptal + düşürme
 * hedefi)? TEK tanım; kapsam temizliği (`shared/scope/lifecycle.ts`) doğrudan buradan alır.
 * Bağımlılık tek yönlüdür: query-keys → scope (`scopedKey`); scope http'yi içe aktarmaz.
 */
export function isScopedQueryKey(key: readonly unknown[]): boolean {
  const head = key[1]
  return (
    key[0] === QUERY_KEY_ROOT &&
    typeof head === 'object' &&
    head !== null &&
    !Array.isArray(head) &&
    'program' in head
  )
}

/** `preview`: seçili görsel dosyanın `downloadFile` gövdesi (blob; 06 önizleme). */
export type ArchiveFacet = 'folders' | 'tasks' | 'attachments' | 'uploaders' | 'preview'

/** §6 tablosu: kaynak → anahtar. */
export const queryKeys = {
  instance: { profile: () => ['instance', 'profile'] as const },
  /**
   * Bildirimler (F7; hesap geneli, KAPSAMSIZ — `scoped()` kullanılmaz, 14 `backend.md` §5):
   * `list` imleçli panel listesi (sayfa boyu anahtara girmez), `pushKey` VAPID açık anahtarı.
   */
  notifications: {
    unreadCount: () => ['notifications', 'unread-count'] as const,
    list: () => ['notifications', 'list'] as const,
    pushKey: () => ['notifications', 'push-key'] as const,
  },
  chatsUnread: { overview: () => ['chats', 'unread-overview'] as const },
  programs: {
    all: () => ['programs'] as const,
    /**
     * Aktarım geçmişi (`listTransfers`, S1; W81). `['programs']` önekinin altında: program ve
     * aktarım yazmalarının §6 geçersizlemesi geçmişi de yeniden okutur.
     */
    transfers: () => ['programs', 'transfers'] as const,
  },
  me: {
    root: () => ['me'] as const,
    departments: () => ['me', 'departments'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (filters: QueryFilters) => ['users', filters] as const,
    /** `readUser` — tek kullanıcı (BE-043, v0.14); `users` önekinde: kullanıcı yazmaları yeniler. */
    detail: (accountId: string) => ['users', 'detail', accountId] as const,
  },
  departments: {
    all: (s: ScopeSnapshot) => scoped(s, ['departments']),
    /** `readProgramDepartment` — tek departman (08b başlığı/Hakkında; BE-049, v0.14). */
    detail: (s: ScopeSnapshot, departmentId: string) =>
      scoped(s, ['departments', departmentId, 'detail']),
    /** `listMembers` — departmanın seçili programdaki ekibi (görev atama adayları). */
    members: (s: ScopeSnapshot, departmentId: string) =>
      scoped(s, ['departments', departmentId, 'members']),
    /** `listAssignable` — departmana eklenebilecek hesaplar (yalnız koordinatör; 08 §5). */
    assignable: (s: ScopeSnapshot, departmentId: string) =>
      scoped(s, ['departments', departmentId, 'assignable']),
  },
  /**
   * Departman kataloğu (`listDepartments`, S1; 08 `backend.md` §5 `['catalog','departments']`):
   * şirket geneli ad/kod/tür/açıklama — kapsam değişiminde düşmez.
   */
  catalog: {
    departments: () => ['catalog', 'departments'] as const,
  },
  /** Silinmiş departmanlar (`listDeletedDepartments`, S2, imleçli; K7 ad eşleşmesi). */
  deletedDepartments: {
    all: (s: ScopeSnapshot) => scoped(s, ['deleted-departments']),
    /** 12 Silinen kayıtlar listesi: sunucu süzgeci/sırası `filters` içindedir (BE-117; W174). */
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['deleted-departments', filters]),
  },
  /**
   * Silinmiş görevler (`listDeletedWorkItems`, S2, imleçli; 12 Silinen kayıtlar, W128). Kapsamlı:
   * program değişince düşer. İstemci süzgeçleri (`tur`, `q`, aralık …) anahtara girmez; yalnız
   * sayfa boyu gibi sunucu parametreleri `filters` içindedir.
   */
  deletedWorkItems: {
    all: (s: ScopeSnapshot) => scoped(s, ['deleted-work-items']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['deleted-work-items', filters]),
  },
  /**
   * Silinmiş hesaplar (`listDeletedAccounts`, S1, hesap geneli; W128). `users` kalıbı: kapsam
   * değişince düşmez.
   */
  deletedAccounts: {
    all: () => ['deleted-accounts'] as const,
    list: (filters: QueryFilters) => ['deleted-accounts', filters] as const,
  },
  /**
   * Silinenler özeti (`reportDeletedSummary`, S2, yalnız ŞY; BE-110): tür başına sayaçlar; süzgeç
   * almaz. Kapsamlı: program değişince düşer. Dört silinen listesinin yaşam döngüsü yazmalarıyla
   * (silme, geri yükleme, kalıcı silme, toplu ve çöp boşaltma) birlikte yenilenir.
   */
  deletedSummary: {
    all: (s: ScopeSnapshot) => scoped(s, ['deleted-summary']),
  },
  workItems: {
    all: (s: ScopeSnapshot) => scoped(s, ['work-items']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['work-items', filters]),
    item: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id]),
    /**
     * `countProgramWorkItems` (S2; BE-003, WP2a): görünür görev sayaçları. Süzgeç nesnesi
     * (`department`, `assignees`) listeyle aynıdır; beşli anahtar liste (4) ve ayrıntı uçlarıyla
     * karışmaz (`workItems.counts` filtresi).
     */
    counts: (s: ScopeSnapshot, filters: QueryFilters) =>
      scoped(s, ['work-items', 'counts', filters]),
    subtasks: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'subtasks']),
    notes: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'notes']),
    /** 03, 03c ve 06 AYNI anahtarı kullanır. */
    files: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'files']),
    /** `listDependencies` — 03 ve 03c AYNI anahtarı kullanır. */
    dependencies: (s: ScopeSnapshot, id: string) => scoped(s, ['work-items', id, 'dependencies']),
  },
  gantt: {
    all: (s: ScopeSnapshot) => scoped(s, ['gantt']),
    face: (s: ScopeSnapshot, face: string) => scoped(s, ['gantt', face]),
  },
  dateRequests: {
    all: (s: ScopeSnapshot) => scoped(s, ['date-requests']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['date-requests', filters]),
  },
  /**
   * Kenar menüsü Görevler rozetleri (K/Ü merceği, `countProgramWorkItems`; BE-003 rozet kısmı).
   * `work-items` önekinin altında: görev ve tarih yazmalarının §6 geçersizlemesi (`workItems.list`)
   * rozetleri de yeniden okutur; süzgeç (birim, atanan) anahtardadır.
   */
  shellBadges: {
    counts: (s: ScopeSnapshot, filters: QueryFilters) =>
      scoped(s, ['work-items', 'shell-counts', filters]),
  },
  report: {
    dashboard: (s: ScopeSnapshot) => scoped(s, ['report', 'dashboard']),
    coordinatorships: (s: ScopeSnapshot) => scoped(s, ['report', 'dashboard', 'coordinatorships']),
    /** `reportSeason` — dönem raporu JSON'u (01f önizleme; W136); `staleTime: 0`, ağır uç. */
    season: (s: ScopeSnapshot) => scoped(s, ['report', 'season']),
    /** `reportWorkload` — iş yükü JSON'u (yalnız anahtar; okuyucu F6 sonrası). */
    workload: (s: ScopeSnapshot) => scoped(s, ['report', 'workload']),
    /** `reportMeetingDetail` — toplantı rapor ayrıntısı (01g önizleme; W136). */
    meeting: (s: ScopeSnapshot, id: string) => scoped(s, ['report', 'meeting', id]),
    /** `reportTaskDetail` — görev rapor ayrıntısı (W136). */
    task: (s: ScopeSnapshot, id: string) => scoped(s, ['report', 'task', id]),
  },
  archive: {
    all: (s: ScopeSnapshot) => scoped(s, ['archive']),
    list: (s: ScopeSnapshot, facet: ArchiveFacet, filters: QueryFilters) =>
      scoped(s, ['archive', facet, filters]),
  },
  meetings: {
    all: (s: ScopeSnapshot) => scoped(s, ['meetings']),
    list: (s: ScopeSnapshot, filters: QueryFilters) => scoped(s, ['meetings', 'list', filters]),
    deleted: (s: ScopeSnapshot) => scoped(s, ['meetings', 'deleted']),
    /** 12 Silinen kayıtlar toplantı listesi: sunucu süzgeci/sırası `filters` içindedir (BE-117). */
    deletedList: (s: ScopeSnapshot, filters: QueryFilters) =>
      scoped(s, ['meetings', 'deleted', filters]),
    candidates: (s: ScopeSnapshot, filters: QueryFilters) =>
      scoped(s, ['meetings', 'candidates', filters]),
    detail: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', 'detail', id]),
    /** Süzgeçsiz anahtar önektir: süzgeçli okumalar (BE-061) onun altında, aynı önekle geçersizlenir. */
    noteList: (s: ScopeSnapshot, id: string, filter?: string) =>
      scoped(
        s,
        filter && filter !== 'all'
          ? ['meetings', 'notes', id, { filter }]
          : ['meetings', 'notes', id],
      ),
    item: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', id]),
    agenda: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', id, 'agenda']),
    notes: (s: ScopeSnapshot, id: string) => scoped(s, ['meetings', id, 'notes']),
  },
  /**
   * Sohbet (F7, 10 `backend.md` §5; hepsi S2 → kapsamlı). `list`/`candidates`/`ref` ikinci
   * konumdaki AYRILMIŞ sözcüklerdir (`chat_id` opak kimliktir, bunlarla çakışmaz; test sınar).
   * `messages` elle birleştirilen pencere tutar (`modules/chat/model/window.ts`).
   */
  chats: {
    all: (s: ScopeSnapshot) => scoped(s, ['chats']),
    /** Sunucu süzgeçleri (BE-081) tam anahtardadır: süzgeç değişince imleç/sayfalar ayrı önbellek. */
    list: (s: ScopeSnapshot, q: string, kind: 'direct' | 'group' | null = null, unread = false) =>
      scoped(s, ['chats', 'list', { q, kind, unread }]),
    detail: (s: ScopeSnapshot, id: string) => scoped(s, ['chats', id, 'detail']),
    messages: (s: ScopeSnapshot, id: string) => scoped(s, ['chats', id, 'messages']),
    pins: (s: ScopeSnapshot, id: string) => scoped(s, ['chats', id, 'pins']),
    members: (s: ScopeSnapshot, id: string) => scoped(s, ['chats', id, 'members']),
    refs: (s: ScopeSnapshot, id: string, kind: string) => scoped(s, ['chats', id, 'refs', kind]),
    candidates: (s: ScopeSnapshot, purpose: string, chatId = '') =>
      scoped(s, ['chats', 'candidates', purpose, chatId]),
    refSummary: (s: ScopeSnapshot, refId: string) => scoped(s, ['chats', 'ref', refId]),
  },
} as const

/** §6 satırları (geçersizleme birimi). */
export type QueryResource =
  | 'instance.profile'
  | 'notifications.unreadCount'
  | 'notifications.list'
  | 'notifications.pushKey'
  | 'chats.unreadOverview'
  | 'programs'
  | 'me'
  | 'departments'
  | 'departments.members'
  | 'departments.assignable'
  | 'catalog.departments'
  | 'deletedDepartments'
  | 'deletedWorkItems'
  | 'deletedAccounts'
  | 'deletedSummary'
  | 'workItems.list'
  | 'workItems.item'
  | 'workItems.counts'
  | 'workItems.subtasks'
  | 'workItems.notes'
  | 'workItems.files'
  | 'workItems.dependencies'
  | 'gantt'
  | 'dateRequests'
  | 'report'
  | 'report.meeting'
  | 'report.task'
  | 'archive'
  | 'meetings'
  | 'chats.list'
  | 'chats.detail'
  | 'chats.messages'
  | 'chats.pins'
  | 'chats.members'
  | 'chats.refs'
  | 'chats.candidates'
  | 'chats.refSummary'
  | 'users'

// 12 Silinen kayıtlar: toplu geri yükleme / toplu kalıcı silme / çöp boşaltma (BE-114/115; W174).
// Tekil geri yükleme ve kalıcı silme ile AYNI türetilmiş kaynakları değiştirir; listeler, özet,
// pano ve bağlı okuyucular birlikte yenilenir (KESİN 29).
const BATCH_WORK_ITEM_WRITES = [
  'batchRestoreWorkItems',
  'batchPurgeWorkItems',
  'purgeAllWorkItems',
] as const satisfies readonly OperationId[]
const BATCH_MEETING_WRITES = [
  'batchRestoreMeetings',
  'batchPurgeMeetings',
  'purgeAllMeetings',
] as const satisfies readonly OperationId[]
const BATCH_DEPARTMENT_WRITES = [
  'batchRestoreDepartments',
  'batchPurgeDepartments',
  'purgeAllDepartments',
] as const satisfies readonly OperationId[]
const BATCH_ACCOUNT_WRITES = [
  'batchRestoreAccounts',
  'batchPurgeAccounts',
  'purgeAllAccounts',
] as const satisfies readonly OperationId[]

// "Görev oluştur/güncelle/sil/geçiş/ata; tarih uçları" (§6 görev satırları).
const WORK_ITEM_WRITES = [
  'createWorkItem',
  'updateWorkItem',
  'deleteWorkItem',
  'transitionWorkItem',
  'ownStatusWorkItem',
  'addAssignments',
  'removeAssignment',
  'claimWorkItem',
  'unclaimWorkItem',
  'restoreWorkItem',
  'permanentDeleteWorkItem',
  'transferWorkItems',
  'convertNoteToTask',
  'createTaskFromChatMessage',
  ...BATCH_WORK_ITEM_WRITES,
] as const satisfies readonly OperationId[]

// Görev tarihini değiştiren uçlar (istemci-akislari §6, §8 "dates_revision").
const DATE_WRITES = [
  'updateWorkItem',
  'extendWorkItem',
  'pullEndDate',
  'pullCompletion',
  'setCompletionDate',
  'requestDateChange',
  'reviewDateChangeRequest',
  'deleteDateChangeRequest',
] as const satisfies readonly OperationId[]

const SUBTASK_WRITES = [
  'createWorkItemSubtask',
  'updateWorkItemSubtask',
  'deleteWorkItemSubtask',
] as const satisfies readonly OperationId[]

const NOTE_WRITES = [
  'addWorkItemNote',
  'updateWorkItemNote',
  'deleteWorkItemNote',
] as const satisfies readonly OperationId[]

/** Silinen kayıtlar: görev geri yükleme ve kalıcı silme (12). */
const LIFECYCLE_WORK_ITEM_WRITES = [
  'restoreWorkItem',
  'permanentDeleteWorkItem',
  ...BATCH_WORK_ITEM_WRITES,
] as const

const FILE_WRITES = [
  'attachFile',
  'renameFile',
  'retagFile',
  'deleteFile',
] as const satisfies readonly OperationId[]

const DEPENDENCY_WRITES = [
  'addDependency',
  'removeDependency',
] as const satisfies readonly OperationId[]

const MEMBERSHIP_WRITES = [
  'assignMembership',
  'updateMembershipRole',
  'removeMember',
  'assignCoordinator',
  'removeCoordinator',
] as const satisfies readonly OperationId[]

// Kullanıcı/hesap durumunu değiştiren uçlar (ekip satırı `status`, hesap silme/geri yükleme).
const ACCOUNT_LIFECYCLE_WRITES = [
  'deleteAccount',
  'restoreAccount',
  'permanentDeleteAccount',
  'deleteUser',
  ...BATCH_ACCOUNT_WRITES,
] as const satisfies readonly OperationId[]

// Atama devri (ORGANIZATION-K17/K18/K29; 05 `backend.md` §5, 08 §5): ekipten çıkarma, rol
// düşürme, koordinatörlüğü kaldırma ve hesap silme açık görev atamalarını işlemi yapana devreder →
// görev listesi ve görev kayıtları değişir. Geçersizleme eylemin YAKALANMIŞ kapsamıyla yapılır
// (`scoped` önek): başka programın önbelleğine dokunulmaz (K2).
const ASSIGNMENT_HANDOVER_WRITES = [
  'removeMember',
  'removeCoordinator',
  'updateMembershipRole',
  'deleteUser',
  'deleteAccount',
] as const satisfies readonly OperationId[]

// Departman kataloğunu değiştiren uçlar (S1; 08 `backend.md` §5).
const CATALOG_DEPARTMENT_WRITES = [
  'createDepartment',
  'updateDepartment',
  'deleteDepartment',
  'restoreDepartment',
  'permanentDeleteDepartment',
  ...BATCH_DEPARTMENT_WRITES,
] as const satisfies readonly OperationId[]

// Panoyu (rapor) geçersizleyen organizasyon yazmaları (koordinatör kararı, W82a): üyelik,
// koordinatörlük, birim ve kullanıcı yazmaları seyrek ve pano sayıları (üye/koordinatör sayısı,
// birim kümesi) doğrudan onlara bağlı. Görev ve tarih yazmaları da panoyu geçersizler: Admin
// merceği kenar menüsü rozetleri (geciken, bekleyen talep) pano sayaçlarından gelir ve 03 sunucu
// sayaçlarıyla AYNI yazmadan sonra birlikte yenilenmelidir (WP3 entegrasyonu).
const REPORT_ORGANIZATION_WRITES = [
  ...MEMBERSHIP_WRITES,
  'createDepartment',
  'linkDepartment',
  'updateDepartment',
  'renameDepartmentLink',
  'deleteDepartment',
  'createUser',
  'deleteUser',
  'deleteAccount',
  // Pano `total_admins` şirket yöneticiliğine bağlı: Admin yetkisi değişimi (CX-P-Ö-03).
  'updateUser',
  // Kenar menüsü "bekleyen tarih talebi" rozeti pano sayacından gelir (W97a: talep açma/karar
  // sonrası rozet bayat kalıyordu).
  'requestDateChange',
  'reviewDateChangeRequest',
  // Pano `deleted_records` (12 Silinen kayıtlar, ana sayfa E-01-02 sayacı) silinen toplantı,
  // departman ve hesapları sayar: silme, geri yükleme ve kalıcı silme sayacı değiştirir (W128).
  'deleteMeeting',
  'restoreMeeting',
  'permanentDeleteMeeting',
  'restoreDepartment',
  'permanentDeleteDepartment',
  'restoreAccount',
  'permanentDeleteAccount',
  ...BATCH_MEETING_WRITES,
  ...BATCH_DEPARTMENT_WRITES,
  ...BATCH_ACCOUNT_WRITES,
] as const satisfies readonly OperationId[]

// Toplantı içeriği yazmaları (konferans başlat/bitir hariç: rapora ve panoya girmez).
const MEETING_CONTENT_WRITES = [
  'createMeeting',
  'updateMeeting',
  'deleteMeeting',
  'restoreMeeting',
  'permanentDeleteMeeting',
  'addAgendaItem',
  'updateAgendaItem',
  'deleteAgendaItem',
  'addMeetingNote',
  'updateMeetingNote',
  'deleteMeetingNote',
  'convertNoteToTask',
  'addMeetingParticipant',
  'removeMeetingParticipant',
  ...BATCH_MEETING_WRITES,
] as const satisfies readonly OperationId[]

const unique = (...lists: ReadonlyArray<readonly OperationId[]>): readonly OperationId[] => [
  ...new Set(lists.flat()),
]

/**
 * §6 "Geçersizleyen mutasyonlar" sütunu (operationId). Tabloda adı geçmeyen ama aynı kaydı
 * değiştiren uçlar (geri yükleme, kalıcı silme, aktarım, nottan/mesajdan görev) satırın
 * kaynağına eklendi; fazla geçersizleme güvenlidir, eksik geçersizleme bayat veri gösterir.
 */
export const INVALIDATED_BY: Readonly<Record<QueryResource, readonly OperationId[]>> = {
  // Yalnız yeniden yükleme.
  'instance.profile': [],
  // Bildirim okundu yazmaları sayaç + panel listesini BİRLİKTE yeniler (KESİN 29; rozet ↔ sekme
  // sayacı uyumu). Görev/toplantı yazmaları bildirim listesini geçersizlemez: kaydı sunucu üretir
  // (tazeleme kuralı: staleTime + odak + aralık). Cihaz kaydı (`registerPushTarget`) okuma yenilemez.
  'notifications.unreadCount': ['markNotificationRead', 'markAllNotificationsRead'],
  'notifications.list': ['markNotificationRead', 'markAllNotificationsRead'],
  'notifications.pushKey': [],
  // Sohbet okundu yazmaları rozet kaynağını (`getChatUnreadOverview`) yeniler; gruptan ayrılma ve
  // grup silme okunmamış sohbet sayısını değiştirir.
  'chats.unreadOverview': ['markChatRead', 'markAllChatsRead', 'removeChatMember', 'deleteChat'],
  programs: [
    'createProgram',
    'updateProgram',
    'deleteProgram',
    'resetProgram',
    'transferWorkItems',
  ],
  // K6 yetki kaybı ayrıca standing katmanında; burada üyelik değişiklikleri. Kenar menüsü
  // birim adı `me/departments`'tan okunur (08 §5: `renameDepartmentLink`, kopyalı bağ);
  // hedef = çağıran olan `updateUser` adı/yöneticiliği değiştirir (05 §5).
  // Silinmiş departmanın geri yüklenmesi üyelik yetkisini kendiliğinden geri getirir (K6; W128).
  me: unique(MEMBERSHIP_WRITES, [
    'renameDepartmentLink',
    'linkDepartment',
    'updateUser',
    'restoreDepartment',
    'permanentDeleteDepartment',
    ...BATCH_DEPARTMENT_WRITES,
  ]),
  // §6 (link/unlink/rename) + kodu değiştiren katalog güncellemesi ve katalog silme (08 §5).
  departments: [
    'linkDepartment',
    'unlinkDepartment',
    'renameDepartmentLink',
    'updateDepartment',
    'deleteDepartment',
    'restoreDepartment',
    'permanentDeleteDepartment',
    ...BATCH_DEPARTMENT_WRITES,
  ],
  // Ekip satırı ve hesap durumu (`status: deleted`) değiştiren uçlar; `createUser` ekip
  // satırıyla birlikte hesap açar (05 §2).
  'departments.members': unique(MEMBERSHIP_WRITES, ACCOUNT_LIFECYCLE_WRITES, ['createUser']),
  // Atanabilir havuz (08 §5): ekip yazmaları + havuza giren/çıkan hesaplar.
  'departments.assignable': unique(MEMBERSHIP_WRITES, ACCOUNT_LIFECYCLE_WRITES, ['createUser']),
  'catalog.departments': CATALOG_DEPARTMENT_WRITES,
  deletedDepartments: [
    'deleteDepartment',
    'restoreDepartment',
    'permanentDeleteDepartment',
    ...BATCH_DEPARTMENT_WRITES,
  ],
  // 12 Silinen kayıtlar (W128): görev silme/geri yükleme/kalıcı silme silinen görev listesini
  // yeniden okutur.
  deletedWorkItems: [
    'deleteWorkItem',
    'restoreWorkItem',
    'permanentDeleteWorkItem',
    ...BATCH_WORK_ITEM_WRITES,
  ],
  deletedAccounts: [...ACCOUNT_LIFECYCLE_WRITES],
  // Özet sayaçları dört türün silme/geri yükleme/kalıcı silme yazmalarıyla değişir (12, BE-110).
  deletedSummary: [
    'deleteWorkItem',
    'restoreWorkItem',
    'permanentDeleteWorkItem',
    'deleteMeeting',
    'restoreMeeting',
    'permanentDeleteMeeting',
    'deleteDepartment',
    'restoreDepartment',
    'permanentDeleteDepartment',
    ...ACCOUNT_LIFECYCLE_WRITES,
    ...BATCH_WORK_ITEM_WRITES,
    ...BATCH_MEETING_WRITES,
    ...BATCH_DEPARTMENT_WRITES,
  ],
  'workItems.list': unique(
    WORK_ITEM_WRITES,
    DATE_WRITES,
    SUBTASK_WRITES,
    ASSIGNMENT_HANDOVER_WRITES,
  ),
  'workItems.item': unique(
    WORK_ITEM_WRITES,
    DATE_WRITES,
    SUBTASK_WRITES,
    // Tamamlanma kanıtı dosyadan türer: yükleme de silme de görev ayrıntısını yeniden okutur
    // (06 Arşiv, KESİN 29); yeniden adlandırma görev kaydına dokunmaz.
    ['attachFile', 'deleteFile'],
    ASSIGNMENT_HANDOVER_WRITES,
  ),
  // Sayaçlar liste ile aynı görünürlük ve aynı yazmalarla değişir (durum, atama, tarih, devir).
  'workItems.counts': unique(
    WORK_ITEM_WRITES,
    DATE_WRITES,
    SUBTASK_WRITES,
    ASSIGNMENT_HANDOVER_WRITES,
  ),
  'workItems.subtasks': unique(SUBTASK_WRITES, ['transitionWorkItem', 'removeAssignment']),
  'workItems.notes': NOTE_WRITES,
  // Geri yüklenen/kalıcı silinen görevin ortak dosya listesi (görev ayrıntısı, kanıt, önizleme
  // yan okumaları) yaşam döngüsüyle değişir (12 Silinen kayıtlar, backend.md §5; CX-F5-Ö-03).
  'workItems.files': unique(FILE_WRITES, ['deleteWorkItemSubtask'], LIFECYCLE_WORK_ITEM_WRITES),
  'workItems.dependencies': DEPENDENCY_WRITES,
  // Satırın `subtask_counts` alanı alt görev yazmalarıyla değişir (kapalı satır sayacı; CX-P-Ö-03).
  // Geri yüklenen görev Gantt'a döner, kalıcı silinen zaten yoktu ama satır sayaçları değişebilir
  // (12 Silinen kayıtlar, W128).
  gantt: unique(DATE_WRITES, DEPENDENCY_WRITES, SUBTASK_WRITES, [
    'createWorkItem',
    'deleteWorkItem',
    'restoreWorkItem',
    'permanentDeleteWorkItem',
    ...BATCH_WORK_ITEM_WRITES,
  ]),
  dateRequests: ['requestDateChange', 'reviewDateChangeRequest', 'deleteDateChangeRequest'],
  // Organizasyon yazmaları (W82a) ve rozetleri besleyen görev/tarih yazmaları geçersizler (WP3).
  // `report`: program geneli özetler — pano (`dashboard`), dönem (`season`) ve iş yükü
  // (`workload`) JSON'ları aynı programın aynı yazmalarıyla yenilenir (W136: dönem raporu
  // toplantı sayaçlarını da taşır → toplantı içeriği yazmaları eklendi).
  report: unique(
    REPORT_ORGANIZATION_WRITES,
    WORK_ITEM_WRITES,
    DATE_WRITES,
    ASSIGNMENT_HANDOVER_WRITES,
    MEETING_CONTENT_WRITES,
  ),
  // Görev rapor ayrıntısı (`reportTaskDetail`: künye, bağımlılıklar, son 20 not): görev, tarih,
  // not, alt görev ve bağımlılık yazmaları ile atama devri; hedef görev biliniyorsa yalnız o.
  'report.task': unique(
    WORK_ITEM_WRITES,
    DATE_WRITES,
    NOTE_WRITES,
    SUBTASK_WRITES,
    DEPENDENCY_WRITES,
    ASSIGNMENT_HANDOVER_WRITES,
  ),
  // Toplantı rapor ayrıntısı (`reportMeetingDetail`: künye, katılımcı rolleri, gündem, notlar):
  // toplantı içeriği yazmaları + departman adı / üyelik / kullanıcı adı yazmaları.
  'report.meeting': unique(MEETING_CONTENT_WRITES, REPORT_ORGANIZATION_WRITES),
  // 06 Arşiv: yükleme/ad/silme dört okuyucuyu (klasörler, görevler, dosyalar, yükleyenler) ve
  // programın bütün departman anahtarlarını yeniler (yönetici anahtarı rotadaki klasörü taşır).
  // Pano sayaçları (geciken, bekleyen talep) dosyaya bağlı değildir: pano geçersizlenmez.
  // Geri yüklenen görevin dosyaları erişilebilir döner, kalıcı silinen görevin dosyaları gider
  // (RECORDS; 12 Silinen kayıtlar, W128).
  archive: unique(
    FILE_WRITES,
    ['restoreWorkItem', 'permanentDeleteWorkItem'],
    BATCH_WORK_ITEM_WRITES,
  ),
  meetings: [...MEETING_CONTENT_WRITES, 'startConference', 'endConference'],
  // Sohbet (parçalı; "tek önek aşırı geçersizleme" giderildi). Mesaj penceresi (`chats.messages`)
  // yazmayla geçersizlenmez: gönderim/düzenleme/silme/mesajdan görev cevabı pencereye yerel
  // işlenir, tepki/oy/sabit/anket bitirme `around` okumasıyla tazelenir (`modules/chat/api`);
  // SSE olayları ve yeniden bağlanma uzlaştırması da aynı yoldur.
  'chats.list': [
    'openDirectChat',
    'createGroupChat',
    'updateChat',
    'deleteChat',
    'removeChatMember',
    'sendChatMessage',
    'sendChatAttachment',
    'editChatMessage',
    'deleteChatMessage',
    'markChatRead',
    'markAllChatsRead',
  ],
  'chats.detail': ['updateChat', 'grantChatAdmin', 'revokeChatAdmin'],
  'chats.messages': [],
  'chats.pins': ['pinChatMessage', 'unpinChatMessage', 'deleteChatMessage'],
  'chats.members': ['addChatMembers', 'removeChatMember', 'grantChatAdmin', 'revokeChatAdmin'],
  'chats.refs': ['sendChatMessage', 'deleteChatMessage'],
  'chats.candidates': ['addChatMembers', 'removeChatMember'],
  'chats.refSummary': [],
  users: unique(
    [
      'createUser',
      'updateUser',
      'deleteUser',
      'openAccount',
      'updateAccount',
      'deleteAccount',
      'unlockAccount',
      'disableAccount',
      'enableAccount',
      'restoreAccount',
      'permanentDeleteAccount',
      'resetLockouts',
      ...BATCH_ACCOUNT_WRITES,
    ],
    MEMBERSHIP_WRITES,
  ),
}

/** Mutasyonun hedef kaydı; verilmezse ilgili kaynağın kapsamdaki bütün kayıtları geçersizlenir. */
export interface InvalidationContext {
  workItemId?: string
  /** Hedef toplantı (rapor ayrıntısı `report.meeting`); verilmezse programdaki bütün toplantı raporları. */
  meetingId?: string
  /** Hedef sohbet (`chats.detail|pins|members|refs`); verilmezse programdaki bütün sohbetler. */
  chatId?: string
}

/** TanStack `invalidateQueries` filtresi (yalnız kullandığımız alanlar). */
export interface InvalidationFilter {
  queryKey: QueryKey
  exact?: boolean
  predicate?: (query: { queryKey: QueryKey }) => boolean
}

const isFiltersPart = (part: unknown): boolean =>
  typeof part === 'object' && part !== null && !Array.isArray(part)

/** `scoped(['work-items', id, <alt>])` biçimli anahtarlar (alt = subtasks | notes | files). */
function workItemChild(scope: ScopeSnapshot, child: string, id?: string): InvalidationFilter {
  if (id !== undefined) return { queryKey: scoped(scope, ['work-items', id, child]), exact: true }
  return {
    queryKey: queryKeys.workItems.all(scope),
    predicate: ({ queryKey }) => queryKey.length === 5 && queryKey[4] === child,
  }
}

/** `scoped(['departments', id, <alt>])` biçimli anahtarlar (alt = members | assignable). */
function departmentChild(scope: ScopeSnapshot, child: string): InvalidationFilter {
  return {
    queryKey: queryKeys.departments.all(scope),
    predicate: ({ queryKey }) => queryKey.length === 5 && queryKey[4] === child,
  }
}

/** `scoped(['chats', <id>, <alt>, …])` anahtarları (alt = detail | pins | members | refs). */
function chatChild(scope: ScopeSnapshot, child: string, chatId?: string): InvalidationFilter {
  return {
    queryKey: queryKeys.chats.all(scope),
    predicate: ({ queryKey }) =>
      queryKey[4] === child &&
      queryKey[2] === 'chats' &&
      (chatId === undefined || queryKey[3] === chatId),
  }
}

/** `scoped(['chats', <ayrılmış sözcük>, …])` anahtarları (list | candidates | ref). */
function chatReserved(scope: ScopeSnapshot, word: string): InvalidationFilter {
  return {
    queryKey: queryKeys.chats.all(scope),
    predicate: ({ queryKey }) => queryKey[3] === word,
  }
}

type FilterBuilder = (scope: ScopeSnapshot, ctx: InvalidationContext) => InvalidationFilter | null

const prefix =
  (key: (scope: ScopeSnapshot) => QueryKey): FilterBuilder =>
  (scope) => ({ queryKey: key(scope) })

/**
 * Eylemin PROGRAMININ rapor okuyucuları (`scoped([... 'report', <tür>, …])`), mercek/birim
 * parçasından bağımsız: Admin ve Koordinatör merceğindeki anahtarlar aynı programdadır. Başka
 * programın raporuna dokunulmaz (K2); programsız eylemde geçersizleme yok. `id` verilirse yalnız
 * o kaydın (`['report', 'task' | 'meeting', id]`) anahtarı vurulur.
 */
function reportOfProgram(
  kinds: readonly string[],
  id?: (ctx: InvalidationContext) => string | undefined,
): FilterBuilder {
  return (scope, ctx) => {
    if (scope.programId === null) return null
    const target = id?.(ctx)
    return {
      queryKey: [QUERY_KEY_ROOT],
      predicate: ({ queryKey }) =>
        isScopedQueryKey(queryKey) &&
        (queryKey[1] as { program: unknown }).program === scope.programId &&
        queryKey[2] === 'report' &&
        kinds.includes(queryKey[3] as string) &&
        (target === undefined || queryKey[4] === target),
    }
  }
}

/**
 * Eylemin PROGRAMININ arşiv okuyucuları, departman parçasından bağımsız: yönetici anahtarları
 * departman alanında rotadaki klasörü taşır (06 P33) ve eylemin kapsam anlık görüntüsünde
 * departman yoktur; yalnız öneke bakan filtre onları kaçırırdı. Başka programa dokunulmaz (K2).
 */
function archiveOfProgram(scope: ScopeSnapshot): InvalidationFilter | null {
  if (scope.programId === null) return null
  return {
    queryKey: [QUERY_KEY_ROOT],
    predicate: ({ queryKey }) =>
      isScopedQueryKey(queryKey) &&
      (queryKey[1] as { program: unknown }).program === scope.programId &&
      queryKey[2] === 'archive',
  }
}

/** Kaynak → filtre eşlemesi (§6). null: yazma sonrası geçersizleme yok. */
const FILTERS: Readonly<Record<QueryResource, FilterBuilder>> = {
  'instance.profile': () => null,
  report: reportOfProgram(['dashboard', 'season', 'workload']),
  'report.task': reportOfProgram(['task'], (ctx) => ctx.workItemId),
  'report.meeting': reportOfProgram(['meeting'], (ctx) => ctx.meetingId),
  'notifications.unreadCount': prefix(() => queryKeys.notifications.unreadCount()),
  'notifications.list': prefix(() => queryKeys.notifications.list()),
  'notifications.pushKey': prefix(() => queryKeys.notifications.pushKey()),
  'chats.unreadOverview': prefix(() => queryKeys.chatsUnread.overview()),
  programs: prefix(() => queryKeys.programs.all()),
  // ['me'] öneki ['me','departments']'ı da kapsar.
  me: prefix(() => queryKeys.me.root()),
  users: prefix(() => queryKeys.users.all()),
  departments: prefix(queryKeys.departments.all),
  'departments.members': (scope) => departmentChild(scope, 'members'),
  'departments.assignable': (scope) => departmentChild(scope, 'assignable'),
  'catalog.departments': prefix(() => queryKeys.catalog.departments()),
  deletedDepartments: prefix(queryKeys.deletedDepartments.all),
  deletedWorkItems: prefix(queryKeys.deletedWorkItems.all),
  deletedAccounts: prefix(() => queryKeys.deletedAccounts.all()),
  deletedSummary: prefix(queryKeys.deletedSummary.all),
  'workItems.list': (scope) => ({
    queryKey: queryKeys.workItems.all(scope),
    predicate: ({ queryKey }) => queryKey.length === 4 && isFiltersPart(queryKey[3]),
  }),
  'workItems.item': (scope, ctx) =>
    ctx.workItemId !== undefined
      ? { queryKey: queryKeys.workItems.item(scope, ctx.workItemId), exact: true }
      : {
          queryKey: queryKeys.workItems.all(scope),
          predicate: ({ queryKey }) => queryKey.length === 4 && typeof queryKey[3] === 'string',
        },
  'workItems.counts': (scope) => ({
    queryKey: queryKeys.workItems.all(scope),
    predicate: ({ queryKey }) =>
      queryKey.length === 5 &&
      // `counts` (03) ve `shell-counts` (kenar menüsü K/Ü rozeti) aynı sunucu sayacını okur;
      // aynı yazmayla birlikte yenilenir (WP3: rozet bayat kalıyordu).
      (queryKey[3] === 'counts' || queryKey[3] === 'shell-counts') &&
      isFiltersPart(queryKey[4]),
  }),
  'workItems.subtasks': (scope, ctx) => workItemChild(scope, 'subtasks', ctx.workItemId),
  'workItems.notes': (scope, ctx) => workItemChild(scope, 'notes', ctx.workItemId),
  'workItems.files': (scope, ctx) => workItemChild(scope, 'files', ctx.workItemId),
  'workItems.dependencies': (scope, ctx) => workItemChild(scope, 'dependencies', ctx.workItemId),
  gantt: prefix(queryKeys.gantt.all),
  dateRequests: prefix(queryKeys.dateRequests.all),
  archive: archiveOfProgram,
  meetings: prefix(queryKeys.meetings.all),
  'chats.list': (scope) => chatReserved(scope, 'list'),
  'chats.detail': (scope, ctx) => chatChild(scope, 'detail', ctx.chatId),
  'chats.messages': (scope, ctx) => chatChild(scope, 'messages', ctx.chatId),
  'chats.pins': (scope, ctx) => chatChild(scope, 'pins', ctx.chatId),
  'chats.members': (scope, ctx) => chatChild(scope, 'members', ctx.chatId),
  'chats.refs': (scope, ctx) => chatChild(scope, 'refs', ctx.chatId),
  'chats.candidates': (scope) => chatReserved(scope, 'candidates'),
  'chats.refSummary': (scope) => chatReserved(scope, 'ref'),
}

/**
 * Tek bir §6 kaynağının filtresi (yazma dışı geçersizleme: SSE olayı → ilgili sorgu, yeniden
 * bağlanma uzlaştırması). Program kapsamı yoksa kapsamlı kaynakta `null` döner değil, filtre
 * kapsam anahtarıyla kurulur; çağıran kapsamı verir. `null`: kaynakta geçersizleme yok.
 */
export function resourceFilter(
  resource: QueryResource,
  scope: ScopeSnapshot,
  ctx: InvalidationContext = {},
): InvalidationFilter | null {
  return FILTERS[resource](scope, ctx)
}

/** Bir mutasyonun geçersizlediği §6 kaynakları. */
export function resourcesInvalidatedBy(operation: OperationId): QueryResource[] {
  return (Object.keys(INVALIDATED_BY) as QueryResource[]).filter((resource) =>
    INVALIDATED_BY[resource].includes(operation),
  )
}

/** Başarılı bir mutasyondan sonra yeniden okunacak sorguların filtreleri. */
export function invalidationFilters(
  operation: OperationId,
  scope: ScopeSnapshot,
  ctx: InvalidationContext = {},
): InvalidationFilter[] {
  return resourcesInvalidatedBy(operation)
    .map((resource) => FILTERS[resource](scope, ctx))
    .filter((f): f is InvalidationFilter => f !== null)
}
