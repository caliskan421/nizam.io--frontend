import { focusManager } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { SessionChangedError } from '@/shared/session/query-session'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useDepartmentCode } from './department-code'

type Row = {
  program_id: string
  department_id: string
  display_name: string
  department_code: string | null
}
type Fetcher = NonNullable<Parameters<typeof useDepartmentCode>[1]>

const row = (over: Partial<Row>): Row => ({
  program_id: 'p1',
  department_id: 'd1',
  display_name: 'Sistem koordinatörlüğü',
  department_code: null,
  ...over,
})
// Yalnız kodun okunduğu alanlar (kalanı bu testte okunmaz): şemaya dar yayın.
const list = (...rows: Row[]) =>
  ({ data: { departments: rows }, truncated: false }) as unknown as Awaited<ReturnType<Fetcher>>

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
  it('MyDepartment.department_code (program + departman) ile eşlenir; anahtar me/departments', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        list(
          row({ department_id: 'd0', department_code: 'BAŞ' }),
          row({ program_id: 'p2', department_code: 'ÖTE' }),
          row({ department_code: 'SİS' }),
        ),
      ),
    )
    const { code, ctx } = await boot(fetcher)
    expect(code.value).toBe('SİS')
    expect(ctx.queryClient.getQueryData(queryKeys.me.departments())).toBeDefined()
  })

  it('department_code null ya da okuma başarısızsa baş harf', async () => {
    const none = await boot(() => Promise.resolve(list(row({ department_code: null }))))
    expect(none.code.value).toBe('SK')
    const failed = await boot(() => Promise.reject(new Error('403')))
    expect(failed.code.value).toBe('SK')
  })

  it('etkin değilken istenmez', async () => {
    const fetcher = vi.fn(() => Promise.resolve(list()))
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
  const ROWS = list(row({ department_code: 'ESK' }))

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
    const key = queryKeys.me.departments()
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
      return ROWS
    })
    const { code, ctx, key } = await bootWith(fetcher)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(fetcher.mock.calls[0]![0]).toBeInstanceOf(AbortSignal)
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
    fetcher.mockImplementation(() => Promise.resolve(ROWS))
    focusManager.setFocused(true)
    await vi.waitFor(() => expect(ctx.queryClient.getQueryState(key)?.status).toBe('error'))
    // Tek çağrı (başarısız ilk deneme); tekrar okuyucuya ulaşmadı, yeni oturumda veri yazılmadı.
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(ctx.queryClient.getQueryState(key)?.error).toBeInstanceOf(SessionChangedError)
    expect(ctx.queryClient.getQueryData(key)).toBeUndefined()
    expect(code.value).toBe('SK')
  })
})

// Eski yol yok (KESİN 35d): kod `me/departments` satırındadır; menü S2 `listProgramDepartments`
// (`/v1/program/departments`) okumaz.
describe('eski yol yok: dar menü S2 departman listesini okumaz', () => {
  const server = setupServer(
    http.get('http://localhost/v1/me/departments', () =>
      HttpResponse.json({ departments: [row({ department_code: 'SIS' })] }),
    ),
  )
  const seen: string[] = []
  server.events.on('request:start', ({ request }) => {
    seen.push(new URL(request.url).pathname)
  })
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterAll(() => server.close())

  it('gerçek istemci: yalnız /v1/me/departments, kod alandan', async () => {
    seen.length = 0
    const { code } = await boot(undefined)
    await vi.waitFor(() => expect(code.value).toBe('SIS'))
    expect(seen).toEqual(['/v1/me/departments'])
  })
})
