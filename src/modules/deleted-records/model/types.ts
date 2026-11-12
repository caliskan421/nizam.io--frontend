import type { components } from '@/shared/api/schema'

import type { DeletedKind } from './kinds'

export type DeletedWorkItem = components['schemas']['DeletedWorkItem']
export type DeletedWorkItemList = components['schemas']['DeletedWorkItemList']
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
  /** Toplantıda silen (`deleted_by`; `name` boşsa bilinmiyor); diğer türlerde `null`. */
  actor: { accountId: string | null; name: string } | null
  /** Koordinatörlük süzgecinin eşleştiği kimlikler. */
  departmentIds: readonly string[]
  /** Arama için Türkçe katlanmış birleşik metin. */
  searchText: string
  /** Görev: durum anahtarı; diğer türlerde `null`. */
  status: string | null
  /** Görev: `file_count`; diğer türlerde `null`. */
  fileCount: number | null
  /** Panel ek alanları (türe özgü). */
  place: string | null
  inviteMode: string | null
  departmentNames: readonly string[]
  /** Koordinatörlük `kind` değeri (değer kümesi sözleşmede yok). */
  departmentKind: string | null
}
