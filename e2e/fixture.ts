import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** e2e/backend/up.sh ile aynı varsayılanlar (yalnız atılabilir e2e veritabanı). */
export const ADMIN = {
  email: process.env.NIZAMIO_E2E_ADMIN_EMAIL ?? 'yonetici@e2e.nizamio.test',
  password: process.env.NIZAMIO_E2E_ADMIN_PASSWORD ?? 'E2e-Yonetici-Parola-2026',
}

export const FIXTURE_PATH = resolve(import.meta.dirname, '.state/fixture.json')

/** Sohbet/bildirim senaryoları için tohum (W160): bilinen parolalı ikinci hesap + bir grup. */
export interface E2eChatFixture {
  groupId: string
  groupName: string
  peerAccountId: string
  peerEmail: string
  peerName: string
  /** Yalnız atılabilir e2e veritabanına ait sabit test parolası (sır değildir). */
  peerPassword: string
}

export interface E2eFixture {
  adminAccountId: string
  programId: string
  departmentId: string
  memberAccountId: string
  memberEmail: string
  chat?: E2eChatFixture
}

export function readFixture(): E2eFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as E2eFixture
}

/** Sohbet tohumu (global setup ekler); yoksa açık hata. */
export function readChatFixture(): E2eFixture & { chat: E2eChatFixture } {
  const fixture = readFixture()
  if (!fixture.chat) throw new Error('e2e fixture: sohbet tohumu yok (global-setup çalışmadı mı?)')
  return fixture as E2eFixture & { chat: E2eChatFixture }
}

export const PEER_PASSWORD = 'E2e-Sohbet-Parola-2026'
