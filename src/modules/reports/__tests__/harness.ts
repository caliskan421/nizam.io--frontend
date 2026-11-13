// Rapor modülü testleri: ortak indirme aracı (`shared/download/__tests__/harness`: GERÇEK API
// istemcisi + MSW + Pinia kapsam deposu + TanStack Query) ve standing (`/v1/me`,
// `/v1/me/departments`, `/v1/programs`) uçları.
import { http, json, ORIGIN } from '@/shared/download/__tests__/harness'

export * from '@/shared/download/__tests__/harness'

/** `useStanding` için üç S1 uç. */
export function standing(
  opts: { admin?: boolean; rows?: ReadonlyArray<readonly [string, string, string]> } = {},
) {
  const rows = opts.rows ?? []
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: 'me-1',
        company_admin: opts.admin === true,
        email: 'me@example.org',
        full_name: 'Ben',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: rows.map(([program, department, role]) => ({
          program_id: program,
          program_name: 'Program',
          department_id: department,
          display_name: `Dept ${department}`,
          role,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
  ]
}

export const SEASON = {
  program_id: 'p1',
  program_name: 'Program',
  generated_at: '2026-11-13T10:00:00Z',
}
