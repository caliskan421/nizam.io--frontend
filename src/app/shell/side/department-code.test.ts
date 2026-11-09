import { focusManager } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { authSession } from '@/shared/http'
import { isScopedQueryKey, queryKeys } from '@/shared/http/query-keys'
import { isListTruncated } from '@/shared/http/truncation'
import { purgeScopedQueries } from '@/shared/scope/lifecycle'
import { SessionChangedError } from '@/shared/session/query-session'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useDepartmentCode } from './department-code'

type Row = { department_id: string; display_name: string; code?: string }
type Fetcher = (
  programId: string | null,
  signal?: AbortSignal,
) => Promise<{ departments: Row[]; truncated?: true }>

async function boot(fetcher: Fetcher | undefined, active = true) {
  const ctx = await sideContext()
  const { lifecycle, store } = createFakeLifecycle({
    lenses: [{ lens: 'coordinator', departmentCount: 1 }],
    departments: [{ departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' }],
  })
  store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
  const result = setupWithScope(ctx, lifecycle, () => useDepartmentCode(ref(active), fetcher))
  await flushPromises()
  return { ...result, ctx, store }
}

describe('dar menü birim kodu (E-00-40)', () => {
  it('ProgramDepartment.code department_id ile eşlenir; anahtar scoped departments', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve({
        departments: [
          { department_id: 'd0', display_name: 'Başka', code: 'BAŞ' },
          { department_id: 'd1', display_name: 'Sistem koordinatörlüğü', code: 'SİS' },
        ],
      }),
    )
    const { code, ctx, store } = await boot(fetcher)
    expect(code.value).toBe('SİS')
    const key = queryKeys.departments.all(store.snapshot)
    // Paylaşılan anahtarın tek şekli: `{ departments, truncated? }` (dizi değil; W71c).
    expect(ctx.queryClient.getQueryData<{ departments: Row[] }>(key)?.departments).toHaveLength(2)
    expect(isScopedQueryKey(key)).toBe(true)
    purgeScopedQueries(ctx.queryClient)
    expect(ctx.queryClient.getQueryData(key)).toBeUndefined()
  })

  it('kod yoksa ya da okuma başarısızsa baş harf', async () => {
    const none = await boot(() =>
      Promise.resolve({ departments: [{ department_id: 'd1', display_name: 'x' }] }),
    )
    expect(none.code.value).toBe('SK')
    const failed = await boot(() => Promise.reject(new Error('403')))
    expect(failed.code.value).toBe('SK')
  })

  it('etkin değilken istenmez', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ departments: [] }))
    const { code } = await boot(fetcher, false)
    expect(fetcher).not.toHaveBeenCalled()
    expect(code.value).toBe('SK')
  })
})

// CX-F2-Ö-01: kabuk okuyucusu oturuma bağlı (`sessionBound`) ve iptal sinyalini okuyucuya iletir.
// Çıkış → başka hesapla giriş sırasında geç yanıt / geçici hata tekrarı yeni oturuma uygulanmaz.
describe('dar menü birim kodu okuyucu kapısı (CX-F2-Ö-01)', () => {
  const login = (accountId: string) => ({
    token: `tok-${accountId}`,
    account_id: accountId,
    expires_at: Math.floor(Date.now() / 1000) + 900,
    force_password_change: false,
  })
  const ROWS = [{ department_id: 'd1', display_name: 'Sistem koordinatörlüğü', code: 'ESK' }]

  afterEach(() => {
    focusManager.setFocused(undefined)
    authSession.clear()
  })

  async function bootWith(fetcher: Fetcher, retries = false) {
    authSession.establish(login('acc-1'))
    const ctx = await sideContext()
    if (retries) {
      ctx.queryClient.setDefaultOptions({ queries: { retry: 1, retryDelay: 0, gcTime: Infinity } })
    }
    const { lifecycle, store } = createFakeLifecycle({
      lenses: [{ lens: 'coordinator', departmentCount: 1 }],
      departments: [{ departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' }],
    })
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const { code } = setupWithScope(ctx, lifecycle, () => useDepartmentCode(ref(true), fetcher))
    const key = queryKeys.departments.all(store.snapshot)
    return { code, ctx, key }
  }

  function switchAccount(): void {
    authSession.clear()
    authSession.establish(login('acc-2'))
  }

  it('geciktirilmiş GET: geç yanıt önbelleğe yazılmaz; okuyucu iptal sinyalini alır', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const fetcher = vi.fn<Fetcher>(async () => {
      await gate
      return { departments: ROWS }
    })
    const { code, ctx, key } = await bootWith(fetcher)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(fetcher.mock.calls[0]![0]).toBe('p1')
    expect(fetcher.mock.calls[0]![1]).toBeInstanceOf(AbortSignal)
    switchAccount()
    release()
    await vi.waitFor(() => expect(ctx.queryClient.getQueryState(key)?.status).toBe('error'))
    expect(ctx.queryClient.getQueryData(key)).toBeUndefined()
    expect(ctx.queryClient.getQueryState(key)?.error).toBeInstanceOf(SessionChangedError)
    expect(code.value).toBe('SK')
  })

  it('geçici hata tekrarı: eski sorgu yeni hesabın kimliğiyle sürdürülmez', async () => {
    const fetcher = vi.fn<Fetcher>(() => Promise.reject(new Error('503')))
    // Tekrar, odak dönene dek bekler (TanStack `pause`): hesap değişimi tam bu aralıkta olur.
    focusManager.setFocused(false)
    const { code, ctx, key } = await bootWith(fetcher, true)
    await vi.waitFor(() => expect(ctx.queryClient.getQueryState(key)?.fetchStatus).toBe('paused'))
    switchAccount()
    fetcher.mockImplementation(() => Promise.resolve({ departments: ROWS }))
    focusManager.setFocused(true)
    await vi.waitFor(() => expect(ctx.queryClient.getQueryState(key)?.status).toBe('error'))
    // Tek çağrı (başarısız ilk deneme); tekrar okuyucuya ulaşmadı, yeni oturumda veri yazılmadı.
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(ctx.queryClient.getQueryState(key)?.error).toBeInstanceOf(SessionChangedError)
    expect(ctx.queryClient.getQueryData(key)).toBeUndefined()
    expect(code.value).toBe('SK')
  })
})

// Tek şekil (W71c): K/Ü merceğinde dar menü birim kodu ve 03 görev listesinin ad sözlüğü AYNI
// `scoped(['departments'])` anahtarını aynı anda okur → tek istek, ikisi de doğru veri (eskiden
// menü dizi yazıyordu; hangisi önce doldurursa öteki yanlış şekli okuyordu).
describe('scoped departments anahtarı: dar menü + görev listesi aynı anda (tek şekil)', () => {
  const server = setupServer(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json(
        {
          departments: [
            { department_id: 'd0', display_name: 'Başka', code: 'BAS' },
            { department_id: 'd1', display_name: 'Sistem koordinatörlüğü', code: 'SIS' },
          ],
        },
        { headers: { 'X-Result-Truncated': 'true' } },
      ),
    ),
  )
  const seen: string[] = []
  server.events.on('request:start', ({ request }) => {
    seen.push(`${request.headers.get('X-Nizamio-Program')} ${new URL(request.url).pathname}`)
  })
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterAll(() => server.close())

  it.each(['menü önce', 'liste önce'])('%s: tek istek, ikisi de doğru veri', async (order) => {
    seen.length = 0
    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle({
      lenses: [{ lens: 'coordinator', departmentCount: 1 }],
      departments: [{ departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' }],
    })
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const both = setupWithScope(ctx, lifecycle, () => {
      if (order === 'menü önce') {
        const menu = useDepartmentCode(ref(true))
        return { menu, list: useProgramDepartments() }
      }
      const list = useProgramDepartments()
      return { menu: useDepartmentCode(ref(true)), list }
    })
    await vi.waitFor(() => expect(both.menu.code.value).toBe('SIS'))
    await flushPromises()
    expect(both.list.byId.value.get('d0')?.code).toBe('BAS')
    expect(seen).toEqual(['p1 /v1/program/departments'])
    const data = ctx.queryClient.getQueryData(queryKeys.departments.all(store.snapshot))
    expect(isListTruncated(data)).toBe(true)
  })
})
