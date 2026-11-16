// W176 O3: gerçek backend (v0.23) canlıya alma senaryoları için API tohum yardımcıları. Veri YALNIZ
// API çağrılarıyla kurulur (backend seed yüzü yok, D-0162); her koşum benzersiz adlar kullanır
// (veritabanı koşumlar arası kalıcıdır). Çağrılar `vite preview` proxy'si üzerinden gider
// (tarayıcıyla aynı yol); Idempotency-Key 22 karakterlik base64url'dir.
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { request, type APIRequestContext, type APIResponse } from '@playwright/test'

import type { components } from '../src/shared/api/schema'

import { ADMIN, readFixture } from './fixture'

type Schemas = components['schemas']

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' }
const LIVE_PATH = resolve(import.meta.dirname, '.state/live.json')

/** Bilinen parolalı, kalıcı tohum hesapları (yalnız atılabilir e2e veritabanı). */
export const COORD_PASSWORD = 'E2e-Koordinator-Parola-2026'
export const DEPARTMENT_CODE = 'E2E'

/** 1×1 PNG: arşiv yüklemesi içerik türünü doğrular (düz metin reddedilir). */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

export const idemKey = (): string => randomBytes(16).toString('base64url')

export interface LiveFixture {
  coordEmail: string
  coordAccountId: string
}

async function ok<T>(response: APIResponse, what: string): Promise<T> {
  if (!response.ok())
    throw new Error(`live-seed: ${what} → ${response.status()} ${await response.text()}`)
  const text = await response.text()
  return (text === '' ? undefined : JSON.parse(text)) as T
}

/** Oturumlu API bağlamı (belirteç bellekte; yazma başlıkları ve kapsam hazır). */
export class Api {
  private constructor(
    readonly ctx: APIRequestContext,
    private readonly token: string,
    readonly programId: string,
    readonly departmentId: string,
  ) {}

  static async login(baseURL: string, email: string, password: string): Promise<Api> {
    const fixture = readFixture()
    const ctx = await request.newContext({ baseURL })
    const login = await ok<Schemas['LoginResponse']>(
      await ctx.post('/v1/auth/login', { headers: CSRF, data: { email, password } }),
      `giriş ${email}`,
    )
    if (!login.token) throw new Error('live-seed: belirteç yok')
    return new Api(ctx, login.token, fixture.programId, fixture.departmentId)
  }

  static admin(baseURL: string): Promise<Api> {
    return Api.login(baseURL, ADMIN.email, ADMIN.password)
  }

  headers(
    scope: 'S1' | 'S2' | 'S3' = 'S3',
    extra: Record<string, string> = {},
  ): Record<string, string> {
    return {
      ...CSRF,
      Authorization: `Bearer ${this.token}`,
      ...(scope !== 'S1' ? { 'X-Nizamio-Program': this.programId } : {}),
      ...(scope === 'S3' ? { 'X-Nizamio-Department': this.departmentId } : {}),
      ...extra,
    }
  }

  async createTask(title: string, assigneeAccountId?: string, over: Record<string, unknown> = {}) {
    return ok<Schemas['WorkItem']>(
      await this.ctx.post('/v1/work-items', {
        headers: this.headers('S3', { 'Idempotency-Key': idemKey() }),
        data: {
          title,
          start_on: '2026-11-16',
          end_on: '2027-01-20',
          completion_evidence_required: false,
          ...(assigneeAccountId ? { assignee_account_id: assigneeAccountId } : {}),
          ...over,
        },
      }),
      `görev ${title}`,
    )
  }

  async uploadPng(taskId: string, name: string, tag = 'plan') {
    return ok<Schemas['FileRecord']>(
      await this.ctx.post(`/v1/work-items/${taskId}/files?tag=${tag}`, {
        headers: this.headers('S3', { 'Idempotency-Key': idemKey() }),
        multipart: { file: { name, mimeType: 'image/png', buffer: PNG } },
      }),
      `dosya ${name}`,
    )
  }

  async deleteTask(taskId: string): Promise<void> {
    const res = await this.ctx.delete(`/v1/work-items/${taskId}`, { headers: this.headers('S3') })
    if (!res.ok()) throw new Error(`live-seed: görev silme → ${res.status()} ${await res.text()}`)
  }

  async transition(taskId: string, body: Record<string, unknown>) {
    return ok<Schemas['TransitionResult']>(
      await this.ctx.post(`/v1/work-items/${taskId}/transitions`, {
        headers: this.headers('S3'),
        data: body,
      }),
      `geçiş ${String(body.to)}`,
    )
  }

  async createMeeting(
    title: string,
    date: string,
    inviteMode: 'coordinatorship' | 'person' = 'coordinatorship',
  ) {
    return ok<{ meeting: Schemas['MeetingDetail'] }>(
      await this.ctx.post('/v1/meetings', {
        headers: this.headers('S2', { 'Idempotency-Key': idemKey() }),
        data: {
          title,
          meeting_date: date,
          department_ids: [this.departmentId],
          invite_mode: inviteMode,
          agenda_items: ['Açılış'],
        },
      }),
      `toplantı ${title}`,
    )
  }

  async dispose(): Promise<void> {
    await this.ctx.post('/v1/auth/logout', { headers: this.headers('S1') }).catch(() => undefined)
    await this.ctx.dispose()
  }
}

/**
 * Kalıcı tohum (bir kez): departman kısa kodu (görev kodu `E2E-n`) ve bilinen parolalı koordinatör
 * (K1 senaryosu). İkincisi `openAccount` (geçici parola DEĞİL) + birime `koordinator` rolüyle atama.
 */
export async function ensureLiveFixture(baseURL: string): Promise<LiveFixture> {
  if (existsSync(LIVE_PATH)) return JSON.parse(readFileSync(LIVE_PATH, 'utf8')) as LiveFixture
  const fixture = readFixture()
  const api = await Api.admin(baseURL)
  try {
    const run = Date.now().toString(36)
    const update = await api.ctx.patch(`/v1/departments/${fixture.departmentId}`, {
      headers: api.headers('S1'),
      data: { code: DEPARTMENT_CODE },
    })
    if (!update.ok() && update.status() !== 409) {
      throw new Error(`live-seed: departman kodu → ${update.status()} ${await update.text()}`)
    }
    const coordEmail = `koord-${run}@e2e.nizamio.test`
    const account = await ok<Schemas['AccountResult']>(
      await api.ctx.post('/v1/admin/accounts', {
        headers: api.headers('S1'),
        data: {
          email: coordEmail,
          full_name: 'E2E Koordinatör',
          password: COORD_PASSWORD,
          force_password_change: false,
        },
      }),
      'koordinatör hesabı',
    )
    await ok(
      await api.ctx.post('/v1/admin/users', {
        headers: api.headers('S1'),
        data: {
          email: coordEmail,
          full_name: 'E2E Koordinatör',
          program_id: fixture.programId,
          department_id: fixture.departmentId,
          role: 'koordinator',
          transfer_account_id: account.account_id,
        } satisfies Schemas['CreateUserRequest'],
      }),
      'koordinatörü birime atama',
    )
    const live: LiveFixture = { coordEmail, coordAccountId: account.account_id }
    mkdirSync(dirname(LIVE_PATH), { recursive: true })
    writeFileSync(LIVE_PATH, JSON.stringify(live, null, 2))
    return live
  } finally {
    await api.dispose()
  }
}
