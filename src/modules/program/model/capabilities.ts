/**
 * Program yönetimi eylem görünürlüğü (K1; E-00-25). Girdi yalnız sunucu OLGUSUDUR
 * (`me.company_admin`); mercek girdi DEĞİLDİR (ortak-kurallar §1, P1): Koordinatör merceğindeki
 * şirket yöneticisi de ekranı görür. Program oluşturma/güncelleme/silme/sıfırlama, departman
 * bağlama, aktarım ön izlemesi/yürütmesi ve aktarım geçmişi yalnız şirket yöneticisine açıktır
 * (PROGRAM-K04, PROGRAM-K34, PROGRAM-K38). Gizleme güvenlik değildir: sunucu 403
 * `program.not_authorized` döndürür.
 */
import type { Standing } from '@/shared/scope/standing-facts'

export interface ProgramActorFacts {
  /** Standing geldi mi (`me` + `me/departments`). */
  ready: boolean
  companyAdmin: boolean
}

export type ProgramCapability =
  | 'manage'
  | 'createProgram'
  | 'updateProgram'
  | 'deleteProgram'
  | 'resetProgram'
  | 'linkDepartment'
  | 'transfer'
  | 'readTransfers'

export function programFacts(standing: Standing | null): ProgramActorFacts {
  return { ready: standing !== null, companyAdmin: standing?.companyAdmin === true }
}

const admin = (f: ProgramActorFacts) => f.ready && f.companyAdmin

export const PROGRAM_CAPABILITIES: Readonly<
  Record<ProgramCapability, (f: ProgramActorFacts) => boolean>
> = {
  manage: admin,
  createProgram: admin,
  updateProgram: admin,
  deleteProgram: admin,
  resetProgram: admin,
  linkDepartment: admin,
  transfer: admin,
  readTransfers: admin,
}

export function canProgram(capability: ProgramCapability, facts: ProgramActorFacts): boolean {
  return PROGRAM_CAPABILITIES[capability](facts)
}
