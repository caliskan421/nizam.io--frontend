import type { Standing } from '@/shared/scope/standing-facts'

/** Matches the backend's strongest actor role in this program, independent of the display lens. */
export function assistantRoleLabel(standing: Standing | null, program: string | null): string {
  if (standing?.companyAdmin) return 'Yönetici'
  if (standing?.rows.some((row) => row.programId === program && row.role === 'coordinator')) {
    return 'Koordinatör'
  }
  return 'Üye'
}
