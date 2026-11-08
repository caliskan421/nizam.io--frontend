/**
 * Kapsam çözümü (saf): program → mercek → departman. Davranış kaynağı
 * `00-ortak/mekanizma.md` §3 adım 1–5 ve `ortak-kurallar.md` §1:
 *
 *  - Her basamakta öncelik: geçerli seçim → hatırlanan kimlik → TEK seçenekte otomatik.
 *  - Birden çok seçenek varken "ilk uygun"u sessizce seçmek YOK (K2): basamak `pending` olur,
 *    kabuk seçiciyi açar ve içerikte K7 boş durumu gösterir.
 *  - Geçersiz hatırlanan kimlik düşer.
 *  - `organization.membership_required` (`listPrograms` 403, G14) → K7 "departman ataması
 *    bekleniyor"; hiçbir kart gösterilmez.
 */
import type { ScopeLens } from './scope'
import {
  departmentOptions,
  lensOptions,
  programOptions,
  type ProgramOption,
  type Standing,
} from './standing-facts'

export interface ScopeSelection {
  programId: string | null
  lens: ScopeLens | null
  departmentId: string | null
}

export type ScopeStep = 'program' | 'lens' | 'department'

/** K7 açık durumları (kabuk). */
export type ScopeEmptyReason =
  /** Hiçbir programda ekip satırı yok, yönetici değil (`listPrograms` 403). */
  | 'membership_required'
  /** Görünür program yok (yönetici: "program oluştur"; diğerleri bilgilendirme). */
  | 'no_program'
  /**
   * Seçili programda kullanıcının merceği yok (savunma; sözleşmede beklenmez). Yönetici için
   * "programa departman katılmamış" ayrıca `programDepartmentGap` ile saptanır: Admin merceği
   * her programda bulunduğundan satırsız yönetici bu nedene düşmez.
   */
  | 'no_lens'

export type ScopeResolution =
  | { kind: 'ready'; selection: ScopeSelection }
  | { kind: 'selecting'; selection: ScopeSelection; pending: ScopeStep }
  | { kind: 'empty'; selection: ScopeSelection; reason: ScopeEmptyReason }

export interface ResolveInput {
  standing: Standing
  programs: readonly ProgramOption[] | null
  membershipRequired: boolean
  current: ScopeSelection
  remembered: ScopeSelection
}

export const EMPTY_SELECTION: ScopeSelection = { programId: null, lens: null, departmentId: null }

function pick<T>(options: readonly T[], ...candidates: Array<T | null>): T | null {
  for (const candidate of candidates) {
    if (candidate !== null && options.includes(candidate)) return candidate
  }
  return options.length === 1 ? options[0]! : null
}

export function resolveScope(input: ResolveInput): ScopeResolution {
  const { standing, current, remembered } = input
  if (input.membershipRequired) {
    return { kind: 'empty', selection: EMPTY_SELECTION, reason: 'membership_required' }
  }

  const programs = programOptions(standing, input.programs).map((p) => p.programId)
  if (programs.length === 0) {
    return { kind: 'empty', selection: EMPTY_SELECTION, reason: 'no_program' }
  }
  const programId = pick(programs, current.programId, remembered.programId)
  if (programId === null) {
    return { kind: 'selecting', selection: EMPTY_SELECTION, pending: 'program' }
  }

  const lenses = lensOptions(standing, programId).map((o) => o.lens)
  if (lenses.length === 0) {
    return { kind: 'empty', selection: { ...EMPTY_SELECTION, programId }, reason: 'no_lens' }
  }
  const lens = pick(lenses, current.lens, remembered.lens)
  if (lens === null) {
    return { kind: 'selecting', selection: { ...EMPTY_SELECTION, programId }, pending: 'lens' }
  }
  if (lens === 'admin') {
    return { kind: 'ready', selection: { programId, lens, departmentId: null } }
  }

  const departments = departmentOptions(standing, programId, lens).map((d) => d.departmentId)
  const departmentId = pick(departments, current.departmentId, remembered.departmentId)
  if (departmentId === null) {
    return {
      kind: 'selecting',
      selection: { programId, lens, departmentId: null },
      pending: 'department',
    }
  }
  return { kind: 'ready', selection: { programId, lens, departmentId } }
}

/**
 * Seçili programın bağlı departman durumu (K7 "programa departman katılmamış", yönetici).
 * Kaynak `listProgramDepartments` (S2, `scoped(['departments'])`): yalnız Admin merceğinde ve
 * kapsam hazırken sorulur; Koordinatör/Üye merceği ekip satırından gelir, zaten bağlı birimdedir.
 *  - `none`: denetim yok, bağ var ya da okunamadı (hata içeriği kendi ekranında; yanlış açık
 *    durum gösterilmez).
 *  - `checking`: liste bekleniyor (içerik görünüp kaybolmasın).
 *  - `empty`: programa hiç departman bağlanmamış.
 */
export type DepartmentGap = 'none' | 'checking' | 'empty'

export interface DepartmentGapInput {
  /** Kapsam hazır ve mercek Admin mi (denetim yalnız bu durumda). */
  adminScope: boolean
  departments: readonly unknown[] | undefined
  failed: boolean
}

export function programDepartmentGap(input: DepartmentGapInput): DepartmentGap {
  if (!input.adminScope) return 'none'
  if (input.departments) return input.departments.length === 0 ? 'empty' : 'none'
  return input.failed ? 'none' : 'checking'
}
