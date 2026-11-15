import type { components } from '@/shared/api/schema'

import type { DeletedKind } from './kinds'

export type DeletedWorkItem = components['schemas']['DeletedWorkItem']
export type DeletedWorkItemList = components['schemas']['DeletedWorkItemList']
export type DeletedSummary = components['schemas']['DeletedSummary']
export type DeletedAccount = components['schemas']['DeletedAccount']
export type DeletedAccountList = components['schemas']['DeletedAccountList']
export type DeletedDepartment = components['schemas']['DeletedDepartment']
export type WorkItemLifecycleResult = components['schemas']['WorkItemLifecycleResult']
export type WorkItemPurgeResult = components['schemas']['WorkItemPurgeResult']
export type DepartmentLifecycleResult = components['schemas']['DepartmentLifecycleResult']
export type AccountLifecycleResult = components['schemas']['AccountLifecycleResult']

/** S2 yaşam döngüsü yazmalarının hedefi: program başlığı + kayıt kimliği (eylemle dondurulur). */
export interface ProgramRecordTarget {
  programId: string
  id: string
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

/** Tek tür-bağımsız satır modeli (tablo + panel); alanlar liste öğesinden gelir, ek istek yok. */
export interface DeletedRow {
  kind: DeletedKind
  /** Kayıt kimliği (görev, toplantı, departman, hesap). */
  id: string
  /** `kind:id` — aynı kimliğin türler arası çakışmasını önler. */
  key: string
  title: string
  /** Koordinatörlük kodu (varsa mono kicker); diğer türlerde `null`. */
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
  /** Görev: BE-113 ek alanları; diğer türlerde `null`. */
  task: DeletedTaskFacts | null
  /** Panel ek alanları (türe özgü). */
  place: string | null
  inviteMode: string | null
  departmentNames: readonly string[]
  /** Koordinatörlük `kind` değeri (değer kümesi sözleşmede yok). */
  departmentKind: string | null
  /** Kullanıcı: şirket yöneticiliği ataması (silmede korunur); diğer türlerde `false`. */
  companyAdmin: boolean
}
