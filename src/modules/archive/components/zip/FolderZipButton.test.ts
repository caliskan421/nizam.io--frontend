import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD,
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import FolderZipButton from './FolderZipButton.vue'
import {
  mountZip,
  spySaves,
  standingHandlers,
  TARGET,
  ticketOk,
  unmountAll,
  zipBody,
  type Who,
} from './__tests__/zip-harness'

import { flushPromises } from '@vue/test-utils'

import { settleQueries } from '@/shared/http/__tests__/settle'
import type { ScopeSelection } from '@/shared/scope/resolve'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const folder = { folder_id: 'd7', name: 'Mekanik', is_virtual: false }
const virtual = { folder_id: 'my-tasks', name: 'Görevlerim', is_virtual: true }

const ADMIN_SCOPE = { programId: 'p1', lens: 'admin', departmentId: null } as const
const MEMBER_SCOPE = { programId: 'p1', lens: 'member', departmentId: 'd1' } as const

async function mountButton(who: Who, scope: ScopeSelection = COORD, f: typeof folder = folder) {
  server.use(...standingHandlers(who))
  return mountZip(FolderZipButton, { target: TARGET, folder: f }, scope)
}

const button = (w: { find: (s: string) => { element: Element } }) =>
  w.find('[data-testid="folder-zip-button"]').element as HTMLButtonElement

describe('FolderZipButton — görünürlük (capability; mercek yetki değil)', () => {
  it('ŞY her klasörde görür (koordinatör merceğinde bile)', async () => {
    const { wrapper } = await mountButton({ admin: true }, COORD)
    expect(wrapper.find('[data-testid="folder-zip-button"]').exists()).toBe(true)
  })

  it('koordinatör yalnız kendi klasöründe; başkasınınkinde gizli', async () => {
    const rows = [['p1', 'd7', 'koordinator']] as const
    const own = await mountButton({ rows })
    expect(own.wrapper.find('[data-testid="folder-zip"]').exists()).toBe(true)
    unmountAll()
    const other = await mountButton({ rows: [['p1', 'd9', 'koordinator']] })
    expect(other.wrapper.find('[data-testid="folder-zip"]').exists()).toBe(false)
  })

  it('üye yalnız sanal klasörde; gerçek klasörde gizli', async () => {
    const rows = [['p1', 'd1', 'uye']] as const
    const v = await mountButton({ rows }, MEMBER_SCOPE, virtual)
    expect(v.wrapper.find('[data-testid="folder-zip"]').exists()).toBe(true)
    unmountAll()
    const real = await mountButton({ rows }, MEMBER_SCOPE)
    expect(real.wrapper.find('[data-testid="folder-zip"]').exists()).toBe(false)
  })

  it('erişim adı tasarımla aynı: "Klasörü ZIP olarak indir"', async () => {
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    expect(wrapper.get('button').attributes('aria-label')).toBe('Klasörü ZIP olarak indir')
  })
})

describe('FolderZipButton — bilet → tüketim', () => {
  it('tıklama: yönetici S3 başlıklarıyla bilet, hemen tüketim, kayıt; sürerken ikinci tıklama yok', async () => {
    const saved = spySaves()
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await gate
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      zipBody({ 'Content-Disposition': `attachment; filename*=UTF-8''Mekanik.zip` }),
    )
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    const el = button(wrapper)
    el.focus()
    await wrapper.get('[data-testid="folder-zip-button"]').trigger('click')
    await wrapper.get('[data-testid="folder-zip-button"]').trigger('click')
    expect(wrapper.get('[data-testid="folder-zip-note"]').text()).toBe('ZIP hazırlanıyor…')
    expect(el.getAttribute('aria-busy')).toBe('true')
    // Sürerken odak düğmede kalır (devre dışı bırakılıp gövdeye düşmez).
    expect(document.activeElement).toBe(el)
    release()
    await vi.waitFor(() => expect(saved).toEqual(['Mekanik.zip']))
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="folder-zip-note"]').text()).toMatch(/ZIP indirildi/),
    )
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({
      method: 'GET',
      path: '/v1/records/archive/folders/d7/download-zip',
    })
    expect(issue!.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(document.activeElement).toBe(el)
    expect(wrapper.get('[data-testid="folder-zip-note"]').attributes('role')).toBe('status')
  })

  it('ad yoksa yedek ad "<klasör>.zip"', async () => {
    const saved = spySaves()
    server.use(ticketOk(), zipBody())
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(saved).toEqual(['Mekanik.zip']))
  })
})

describe('FolderZipButton — hatalar (otomatik tekrar yok, odak düğmede)', () => {
  async function failWith(code: string, status: number, headers: Record<string, string> = {}) {
    const saved = spySaves()
    let redeems = 0
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => {
        redeems += 1
        return errorEnvelope(code, status, headers)
      }),
    )
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    const el = button(wrapper)
    el.focus()
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(redeems).toBe(1)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(saved).toEqual([])
    expect(document.activeElement).toBe(el)
    return wrapper.get('[data-testid="folder-zip-note"]').text()
  }

  it('422 records.too_large → klasör çok büyük', async () => {
    expect(await failWith('records.too_large', 422)).toBe(
      'Bu klasör tek ZIP için çok büyük; görevlerden tek tek indirin.',
    )
  })

  it('429 records.busy + Retry-After → süre metni; sunucu iletisi gösterilmez', async () => {
    const text = await failWith('records.busy', 429, { 'Retry-After': '30' })
    expect(text).toBe('Çok fazla istek gönderildi; 30 saniye sonra yeniden deneyin.')
    expect(text).not.toContain('sunucu iletisi')
  })

  it('403 records.not_authorized → ortak yetki metni', async () => {
    expect(await failWith('records.not_authorized', 403)).toBe('Bu işlem için yetkiniz yok.')
  })

  it('akış kopması → yarım indirme, tekrar deneyin; yeni tıklama yeni bilet alır', async () => {
    spySaves()
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => HttpResponse.error()),
    )
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="folder-zip-note"]').text()).toMatch(
        /yarım kalmış olabilir/,
      ),
    )
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(sent('POST', '/v1/download-tickets')).toHaveLength(2))
  })

  it('bilet üretimi 429 → Retry-After metni, tek istek', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '60' }),
      ),
    )
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Çok fazla istek gönderildi; 1 dakika sonra yeniden deneyin.',
    )
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
  })
})

describe('FolderZipButton — söküm ve değişim', () => {
  it('bilet beklenirken sökülürse bilet tüketilmez, kayıt ve bildirim yok', async () => {
    const saved = spySaves()
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const hit = new Promise<void>((resolve) => (started = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        started()
        await gate
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      zipBody(),
    )
    const { wrapper, queryClient } = await mountButton({ admin: true }, ADMIN_SCOPE)
    await wrapper.get('button').trigger('click')
    await hit
    wrapper.unmount()
    release()
    await settleQueries(queryClient)
    await flushPromises()
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(saved).toEqual([])
  })

  it('klasör değişince eski durum silinir (bayat sonuç yeni klasöre yazılmaz)', async () => {
    spySaves()
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('records.too_large', 422)),
    )
    const { wrapper } = await mountButton({ admin: true }, ADMIN_SCOPE)
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    await wrapper.setProps({ folder: { ...folder, folder_id: 'd8' } })
    expect(wrapper.find('[data-testid="folder-zip-note"]').exists()).toBe(false)
  })
})
