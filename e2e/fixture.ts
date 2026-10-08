import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** e2e/backend/up.sh ile aynı varsayılanlar (yalnız atılabilir e2e veritabanı). */
export const ADMIN = {
  email: process.env.NIZAMIO_E2E_ADMIN_EMAIL ?? 'yonetici@e2e.nizamio.test',
  password: process.env.NIZAMIO_E2E_ADMIN_PASSWORD ?? 'E2e-Yonetici-Parola-2026',
}

export const FIXTURE_PATH = resolve(import.meta.dirname, '.state/fixture.json')

export interface E2eFixture {
  adminAccountId: string
  programId: string
  departmentId: string
  memberAccountId: string
  memberEmail: string
}

export function readFixture(): E2eFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as E2eFixture
}
