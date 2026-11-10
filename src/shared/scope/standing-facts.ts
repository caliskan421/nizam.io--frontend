/**
 * Standing olguları (K1): sunucunun yetki olgularını istemci tipine çevirir. Rol DİZESİ
 * karşılaştırması yalnız burada ve `modules/*\/model/capabilities.ts`'te yapılır
 * (ortak sözleşme KESİN 6). Kaynak: `istemci-akislari.md` §1–§2, `00-ortak/backend.md` §1.
 *
 *  - `me.company_admin` → şirket yöneticisi (programdaki ekip satırlarından bağımsız).
 *  - `me/departments` satırı `(program, departman, rol)` üçlüsüdür; `role` ∈ koordinator, uye.
 *    Spec'te enum yoktur: bilinmeyen değer satırı yok sayılır. `departments: null` boş sayılır.
 */
import type { components } from '@/shared/api/schema'

import type { ScopeLens } from './scope'

type MeResponse = components['schemas']['MeResponse']
type MyDepartmentList = components['schemas']['MyDepartmentList']
type ProgramList = components['schemas']['ProgramList']

/** Ekip satırındaki rol, istemci tipinde (sunucu rolünün birebir karşılığı). */
export type TeamRole = 'coordinator' | 'member'

export interface StandingRow {
  programId: string
  programName: string
  departmentId: string
  /** Departmanın BU programdaki adı. */
  displayName: string
  role: TeamRole
}

export interface Standing {
  accountId: string
  fullName: string
  email: string
  companyAdmin: boolean
  rows: readonly StandingRow[]
}

/** Dönem rozetinin palet anahtarı (`Program.color`, PROGRAM-K46; 8 anahtar). */
export type ProgramColor = NonNullable<components['schemas']['Program']['color']>

export interface ProgramOption {
  programId: string
  name: string
  year: number | null
  /** Kısa ad (BE-001): 1–4 harf/rakam; verilmemişse `null` (avatar baş harflerden türetilir). */
  shortName: string | null
  /** Palet anahtarı (BE-001); verilmemişse `null` (avatar rengi kimlikten türetilir). */
  color: ProgramColor | null
}

export interface LensOption {
  lens: ScopeLens
  /** Koordinatör/Üye: o mercekteki tekil departman sayısı; Admin: 0. */
  departmentCount: number
}

export interface DepartmentOption {
  departmentId: string
  displayName: string
}

/** Seçili kapsamdaki yetki olguları — MERCEKTEN bağımsız (ortak-kurallar §1, P1). */
export interface ScopeFacts {
  companyAdmin: boolean
  /** Seçili (program, departman) için koordinatör satırı var mı. */
  coordinator: boolean
  /** Seçili (program, departman) için üye satırı var mı. */
  member: boolean
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

function teamRole(raw: string): TeamRole | null {
  if (raw === 'koordinator') return 'coordinator'
  if (raw === 'uye') return 'member'
  return null
}

export function parseStanding(me: MeResponse, list: MyDepartmentList | null): Standing {
  const rows: StandingRow[] = []
  for (const row of list?.departments ?? []) {
    const role = teamRole(row.role)
    if (!role) continue
    rows.push({
      programId: row.program_id,
      programName: row.program_name,
      departmentId: row.department_id,
      displayName: row.display_name,
      role,
    })
  }
  return {
    accountId: me.account_id,
    fullName: me.full_name,
    email: me.email,
    companyAdmin: me.company_admin === true,
    rows,
  }
}

export function parsePrograms(list: ProgramList): ProgramOption[] {
  return list.programs.map((p) => ({
    programId: p.program_id,
    name: p.name,
    year: p.year ?? null,
    shortName: p.short_name ?? null,
    color: p.color ?? null,
  }))
}

/**
 * Program seçenekleri (istemci-akislari §2): yönetici `listPrograms`'ın tamamını görür;
 * diğerleri yalnız ekip satırı olan programları (satırlardan; ad varsa `listPrograms`'tan).
 * Sıra ad, `tr-TR` (E-00-07 kabul).
 */
export function programOptions(
  standing: Standing,
  programs: readonly ProgramOption[] | null,
): ProgramOption[] {
  const byId = new Map((programs ?? []).map((p) => [p.programId, p]))
  let options: ProgramOption[]
  if (standing.companyAdmin) {
    options = [...byId.values()]
  } else {
    const seen = new Map<string, ProgramOption>()
    for (const row of standing.rows) {
      if (seen.has(row.programId)) continue
      seen.set(
        row.programId,
        byId.get(row.programId) ?? {
          programId: row.programId,
          name: row.programName,
          year: null,
          shortName: null,
          color: null,
        },
      )
    }
    options = [...seen.values()]
  }
  return options.sort((a, b) => collator.compare(a.name, b.name))
}

function departmentIds(standing: Standing, programId: string, role: TeamRole): Set<string> {
  const ids = new Set<string>()
  for (const row of standing.rows) {
    if (row.programId === programId && row.role === role) ids.add(row.departmentId)
  }
  return ids
}

/** Bu programda kullanıcının sahip olduğu mercekler (E-00-08; sayı rol başına tekil departman). */
export function lensOptions(standing: Standing, programId: string): LensOption[] {
  const options: LensOption[] = []
  if (standing.companyAdmin) options.push({ lens: 'admin', departmentCount: 0 })
  const coordinator = departmentIds(standing, programId, 'coordinator').size
  if (coordinator > 0) options.push({ lens: 'coordinator', departmentCount: coordinator })
  const member = departmentIds(standing, programId, 'member').size
  if (member > 0) options.push({ lens: 'member', departmentCount: member })
  return options
}

/** Mercek için departman seçenekleri (E-00-09): `program == seçili ∧ role == mercek`. */
export function departmentOptions(
  standing: Standing,
  programId: string,
  lens: ScopeLens,
): DepartmentOption[] {
  if (lens === 'admin') return []
  const role: TeamRole = lens
  const seen = new Map<string, DepartmentOption>()
  for (const row of standing.rows) {
    if (row.programId !== programId || row.role !== role || seen.has(row.departmentId)) continue
    seen.set(row.departmentId, { departmentId: row.departmentId, displayName: row.displayName })
  }
  return [...seen.values()].sort((a, b) => collator.compare(a.displayName, b.displayName))
}

/**
 * Seçili kapsamdaki yetki olguları. Mercek girdi DEĞİLDİR: şirket yöneticisi Koordinatör
 * merceğine geçince `companyAdmin` korunur (P1); rol her zaman seçili programdan okunur.
 */
export function scopeFacts(
  standing: Standing | null,
  programId: string | null,
  departmentId: string | null,
): ScopeFacts {
  if (!standing) return { companyAdmin: false, coordinator: false, member: false }
  const has = (role: TeamRole) =>
    programId !== null &&
    departmentId !== null &&
    standing.rows.some(
      (r) => r.programId === programId && r.departmentId === departmentId && r.role === role,
    )
  return {
    companyAdmin: standing.companyAdmin,
    coordinator: has('coordinator'),
    member: has('member'),
  }
}
