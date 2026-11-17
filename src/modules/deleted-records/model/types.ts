import type { components } from '@/shared/api/schema'

import type { LifecycleKind } from './lifecycle'

export type DeletedWorkItem = components['schemas']['DeletedWorkItem']
export type DeletedWorkItemList = components['schemas']['DeletedWorkItemList']
export type DeletedSummary = components['schemas']['DeletedSummary']
export type DeletedAccount = components['schemas']['DeletedAccount']
export type DeletedAccountList = components['schemas']['DeletedAccountList']
export type DeletedDepartment = components['schemas']['DeletedDepartment']
export type WorkItemLifecycleResult = components['schemas']['WorkItemLifecycleResult']
export type WorkItemPurgeResult = components['schemas']['WorkItemPurgeResult']
export type DepartmentLifecycleResult = components['schemas']['DepartmentLifecycleResult']
export type DeletedBatchResult = components['schemas']['DeletedBatchResult']
export type AccountLifecycleResult = components['schemas']['AccountLifecycleResult']

/** S2 yaşam döngüsü yazmalarının hedefi: program başlığı + kayıt kimliği (eylemle dondurulur). */
export interface ProgramRecordTarget {
  programId: string
  id: string
}

/** Toplu yazmanın hedefi (≤100 kimlik; S2 türlerde program başlığı eylemle dondurulur). */
export interface BatchTarget {
  programId: string
  ids: string[]
}

/** Çöpü boşaltmanın hedefi: program başlığı (S2 türler) + onay değeri (= tür yol adı). */
export interface PurgeAllTarget {
  programId: string
  confirm: string
}

/** S1 (hesap) yaşam döngüsü yazmalarının hedefi. */
export interface AccountRecordTarget {
  id: string
}

/** Silinmiş görevin liste öğesinden gelen ek alanları (BE-113; ek istek yok). */
export interface DeletedTaskFacts {
  /** Atananların görünen adları (ad çözülemediyse boş dize; sıra sunucu sırası). */
  assignees: readonly string[]
  /** Silmede korunan alt görevlerin tamamlanma yüzdesi (0–100); alt görev yoksa `null`. */
  progress: number | null
  /** Geri yüklenince dönecek alt görev, yorum (not) sayısı ve bekleyen tarih talebi. */
  subtasks: number
  notes: number
  dateRequest: boolean
  /** Görev koordinatörlüğüyle birlikte silindi (ADR-0043). */
  byDepartment: boolean
}

/** Ebeveyn kaydı (birleşik listede `parent`): `kind` yalnız bilinen çoğul türlerde `tasks`/`meetings`. */
export interface RowParent {
  /** Bilinen ebeveyn türü; bilinmeyende `null` (bağlantı sunulmaz). */
  kind: 'tasks' | 'meetings' | null
  id: string
  /** Okunabilir ad; yoksa `null` (kimlik ad olarak gösterilmez). */
  name: string | null
  deleted: boolean
}

/** Çocuk türlerin panel gerçekleri: yalnız liste öğesinde dönen alanlar (etiket anahtarı + değer). */
export interface RowFact {
  label: string
  value: string
}

/**
 * Tek tür-bağımsız satır modeli (tablo + panel); alanlar liste öğesinden gelir, ek istek yok.
 * `kind` satırın YAZMA türüdür (dokuz bilinen tür); bilinmeyen (gelecek) `kind` için `null` ve
 * satır salt okunurdur (`rawKind` sunucu değeri, onay kutusu/eylem yok).
 */
export interface DeletedRow {
  kind: LifecycleKind | null
  /** Sunucu `kind` dizesi (bilinmeyende de dolu). */
  rawKind: string
  /** Kayıt kimliği. */
  id: string
  /** `rawKind:id` — aynı kimliğin türler arası çakışmasını önler (seçim, URL, hata özeti anahtarı). */
  key: string
  title: string
  /** Koordinatörlük kodu / görev kodu (varsa mono kicker); yoksa `null`. */
  code: string | null
  /** Alt satır (E-12-28); yoksa boş dize. */
  subLine: string
  /** RFC 3339 `deleted_at`; hesapta ve boş tarihte `null`. */
  deletedAt: string | null
  /** Silen (`deleted_by`; eski kayıtta `accountId` null ve `name` boş → "Bilinmiyor"). */
  actor: { accountId: string | null; name: string }
  /** Koordinatörlük süzgecinin eşleştiği kimlikler. */
  departmentIds: readonly string[]
  /** Görev: durum anahtarı; diğer türlerde `null`. */
  status: string | null
  /** Görev: `file_count`; diğer türlerde `null`. */
  fileCount: number | null
  /** Görev: BE-113 ek alanları; tipli listeden gelmeyen satırlarda `null`. */
  task: DeletedTaskFacts | null
  /** Panel ek alanları (türe özgü). */
  place: string | null
  inviteMode: string | null
  departmentNames: readonly string[]
  /** Koordinatörlük `kind` değeri (değer kümesi sözleşmede yok). */
  departmentKind: string | null
  /** Kullanıcı: şirket yöneticiliği ataması (silmede korunur); diğer türlerde `false`. */
  companyAdmin: boolean
  /** Çocuk türlerde ebeveyn; görev/toplantı/departman/hesapta `null`. */
  parent: RowParent | null
  /** Çocuk türlerin panel alanları (yalnız dönen veri); diğerlerinde boş. */
  facts: readonly RowFact[]
}

// v0.26 çocuk türleri ve birleşik liste (üretilmiş şemadan; elle DTO yok).
export type DeletedFile = components['schemas']['DeletedFile']
export type DeletedFileList = components['schemas']['DeletedFileList']
export type DeletedSubtask = components['schemas']['DeletedSubtask']
export type DeletedSubtaskList = components['schemas']['DeletedSubtaskList']
export type DeletedTaskNote = components['schemas']['DeletedTaskNote']
export type DeletedTaskNoteList = components['schemas']['DeletedTaskNoteList']
export type DeletedMeetingNote = components['schemas']['DeletedMeetingNote']
export type DeletedMeetingNoteList = components['schemas']['DeletedMeetingNoteList']
export type DeletedAgendaItem = components['schemas']['DeletedAgendaItem']
export type DeletedAgendaItemList = components['schemas']['DeletedAgendaItemList']
export type DeletedRecordItem = components['schemas']['DeletedRecordItem']
export type DeletedRecordsPage = components['schemas']['DeletedRecordsPage']
export type FileRestoreResult = components['schemas']['FileRestoreResult']
export type FilePurgeResult = components['schemas']['FilePurgeResult']
export type SubtaskLifecycleResult = components['schemas']['SubtaskLifecycleResult']
export type SubtaskPurgeResult = components['schemas']['SubtaskPurgeResult']
export type TaskNoteLifecycleResult = components['schemas']['TaskNoteLifecycleResult']
export type TaskNotePurgeResult = components['schemas']['TaskNotePurgeResult']
export type MeetingNoteLifecycleResult = components['schemas']['MeetingNoteLifecycleResult']
export type MeetingNotePurgeResult = components['schemas']['MeetingNotePurgeResult']
export type AgendaItemLifecycleResult = components['schemas']['AgendaItemLifecycleResult']
export type AgendaItemPurgeResult = components['schemas']['AgendaItemPurgeResult']
