// Playwright global setup: fixture verisi YALNIZ API çağrılarıyla kurulur (backend seed yüzü
// yok, D-0162). Yönetici girişi → program → departman → programa bağlama → üye oluşturma.
// İstekler `vite preview` proxy'si üzerinden gider (tarayıcıyla aynı yol).
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { request, type APIResponse, type FullConfig } from '@playwright/test'

import type { components } from '../src/shared/api/schema'

import { ADMIN, FIXTURE_PATH, PEER_PASSWORD, type E2eChatFixture, type E2eFixture } from './fixture'

type Schemas = components['schemas']

async function json<T>(response: APIResponse, what: string): Promise<T> {
  if (!response.ok()) {
    throw new Error(`global-setup: ${what} → ${response.status()} ${await response.text()}`)
  }
  return (await response.json()) as T
}

/**
 * Sohbet tohumu (W160): bilinen parolalı ikinci hesap (`openAccount`, geçici parola DEĞİL) →
 * programa/birime üye → yönetici bir grup kurar ve birkaç mesaj yazar. Yalnız API çağrılarıyla
 * (backend seed yüzü yok). Yönetici belirteciyle çağrılır.
 */
async function seedChat(
  api: Awaited<ReturnType<typeof request.newContext>>,
  auth: Record<string, string>,
  base: Pick<E2eFixture, 'programId' | 'departmentId'>,
  run: string,
): Promise<E2eChatFixture> {
  const peerEmail = `sohbet-${run}@e2e.nizamio.test`
  const peerName = 'E2E Sohbet Üyesi'
  const peer = await json<Schemas['AccountResult']>(
    await api.post('/v1/admin/accounts', {
      headers: auth,
      data: {
        email: peerEmail,
        full_name: peerName,
        password: PEER_PASSWORD,
        force_password_change: false,
      } satisfies Schemas['OpenAccountRequest'],
    }),
    'sohbet üyesi hesabı',
  )
  await json<Schemas['UserResult']>(
    await api.post('/v1/admin/users', {
      headers: auth,
      data: {
        email: peerEmail,
        full_name: peerName,
        program_id: base.programId,
        department_id: base.departmentId,
        role: 'uye',
        // `openAccount` hesabı zaten açtı: e-posta kayıtlıdır, birime aktarım 409 `transfer_available`.
        transfer_account_id: peer.account_id,
      } satisfies Schemas['CreateUserRequest'],
    }),
    'sohbet üyesini birime atama',
  )
  const scoped = { ...auth, 'X-Nizamio-Program': base.programId }
  const groupName = `E2E Sohbet ${run}`
  const group = await json<Schemas['Chat']>(
    await api.post('/v1/chats/groups', {
      headers: { ...scoped, 'Idempotency-Key': randomBytes(16).toString('base64url') },
      data: {
        name: groupName,
        member_account_ids: [peer.account_id],
      } satisfies Schemas['CreateGroupChatRequest'],
    }),
    'grup kurma',
  )
  for (const body of ['Merhaba, hoş geldin.', 'Bu grup e2e tohumudur.']) {
    await json<Schemas['ChatMessage']>(
      await api.post(`/v1/chats/${group.chat_id}/messages`, {
        headers: scoped,
        data: {
          body,
          client_message_id: randomUUID(),
        } satisfies Schemas['SendChatMessageRequest'],
      }),
      'tohum mesajı',
    )
  }
  return {
    groupId: group.chat_id,
    groupName,
    peerAccountId: peer.account_id,
    peerEmail,
    peerName,
    peerPassword: PEER_PASSWORD,
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) throw new Error('global-setup: baseURL yok')
  const csrf = { 'X-Requested-With': 'XMLHttpRequest' }
  const api = await request.newContext({ baseURL })

  const login = await json<Schemas['LoginResponse']>(
    await api.post('/v1/auth/login', {
      headers: csrf,
      data: { email: ADMIN.email, password: ADMIN.password } satisfies Schemas['LoginRequest'],
    }),
    'yönetici girişi',
  )
  if (!login.token) throw new Error('global-setup: web girişinde token yok')
  const auth = { ...csrf, Authorization: `Bearer ${login.token}` }

  // İdempotent tohum (W148): fixture YALNIZ bir kez kurulur. Programları ≥2 olan veritabanında
  // kenar menüsü program seçicisini kendiliğinden açar ve saydam perde tıklamaları engeller
  // (smoke/two-tabs "perde tıklamayı yakalıyor" düşüşü); bu yüzden her koşumda yeni program
  // açılmaz — önceki koşumun fixture'ı hâlâ tek program ise yeniden kullanılır, değilse
  // (kirli veritabanı) neden açık bir hatayla durulur.
  const existing = await json<Schemas['ProgramList']>(
    await api.get('/v1/programs', { headers: auth }),
    'program listesi',
  )
  if (existing.programs.length > 0) {
    const previous = existsSync(FIXTURE_PATH)
      ? (JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as E2eFixture)
      : null
    const [only] = existing.programs
    if (
      existing.programs.length === 1 &&
      previous &&
      only?.program_id === previous.programId &&
      previous.adminAccountId === login.account_id
    ) {
      // Eski fixture (sohbet tohumu öncesi): yalnız sohbet tohumu bir kez eklenir.
      if (!previous.chat) {
        const chat = await seedChat(api, auth, previous, Date.now().toString(36))
        writeFileSync(FIXTURE_PATH, JSON.stringify({ ...previous, chat }, null, 2))
      }
      await api.post('/v1/auth/logout', { headers: auth })
      await api.dispose()
      return
    }
    throw new Error(
      `global-setup: veritabanında ${existing.programs.length} program var ve fixture ile eşleşmiyor; ` +
        'e2e tek program varsayar (≥2 programda program seçici açık kalır). ' +
        'Temiz başlangıç için: pnpm e2e:backend:down && pnpm e2e:backend:up',
    )
  }
  const run = Date.now().toString(36)

  const program = await json<Schemas['Program']>(
    await api.post('/v1/programs', {
      headers: auth,
      data: { name: `E2E Program ${run}`, year: 2026 } satisfies Schemas['CreateProgramRequest'],
    }),
    'program oluşturma',
  )
  const department = await json<Schemas['Department']>(
    await api.post('/v1/departments', {
      headers: auth,
      data: {
        name: `E2E Departman ${run}`,
        kind: 'calisma_grubu',
      } satisfies Schemas['CreateDepartmentRequest'],
    }),
    'departman oluşturma',
  )
  await json<Schemas['ProgramDepartmentLink']>(
    await api.post('/v1/program/departments', {
      headers: { ...auth, 'X-Nizamio-Program': program.program_id },
      data: { department_id: department.department_id } satisfies Schemas['LinkDepartmentRequest'],
    }),
    'departmanı programa bağlama',
  )
  const memberEmail = `uye-${run}@e2e.nizamio.test`
  const member = await json<Schemas['UserResult']>(
    await api.post('/v1/admin/users', {
      headers: auth,
      data: {
        email: memberEmail,
        full_name: 'E2E Üye',
        program_id: program.program_id,
        department_id: department.department_id,
        role: 'uye',
      } satisfies Schemas['CreateUserRequest'],
    }),
    'üye oluşturma',
  )

  const chat = await seedChat(
    api,
    auth,
    { programId: program.program_id, departmentId: department.department_id },
    run,
  )

  const logout = await api.post('/v1/auth/logout', { headers: auth })
  if (logout.status() !== 204) {
    throw new Error(`global-setup: çıkış → ${logout.status()} ${await logout.text()}`)
  }

  const fixture: E2eFixture = {
    adminAccountId: login.account_id,
    programId: program.program_id,
    departmentId: department.department_id,
    memberAccountId: member.account_id,
    memberEmail,
    chat,
  }
  mkdirSync(dirname(FIXTURE_PATH), { recursive: true })
  writeFileSync(FIXTURE_PATH, JSON.stringify(fixture, null, 2))
  await api.dispose()
}
