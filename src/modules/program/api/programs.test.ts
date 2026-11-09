// Program uçları: gerçek istemci + MSW. Anahtar `['programs']` kabukla aynı; yazmalar anahtarsız;
// silme/sıfırlama parolası önbellekte/sonuçta kalmaz (KESİN 7); başarıda standing + kapsam.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { isDetached, reachesOwner } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { SessionChangedError } from '@/shared/session/query-session'
import { notifyOutcome, outcomeToast } from '@/shared/ui/confirm'

import {
  ADMIN_SCOPE,
  bodyOf,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  toasts,
} from '../__tests__/harness'
import {
  fetchProgram,
  useCreateProgram,
  useDeleteProgram,
  useProgramList,
  useResetProgram,
  useUpdateProgram,
} from './programs'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const scopedKey = (h: ReturnType<typeof harness>) => queryKeys.workItems.all(h.store.snapshot)

describe('program okumaları', () => {
  it('liste `["programs"]` anahtarında kabukla aynı şekil (tek önbellek)', async () => {
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useProgramList()).result
    expect(list.programs.value.map((p) => p.programId)).toEqual(['p1', 'p2'])
    expect(sent('GET', '/v1/programs')).toHaveLength(0)
    server.use(
      http.get(`${ORIGIN}/v1/programs`, () =>
        json({ programs: [{ program_id: 'p3', name: 'Yeni' }] }, 200, {
          'X-Result-Truncated': 'true',
        }),
      ),
    )
    await h.queryClient.invalidateQueries({ queryKey: queryKeys.programs.all() })
    await h.flush()
    expect(list.programs.value).toEqual([{ programId: 'p3', name: 'Yeni', year: null }])
    expect(list.truncated.value).toBe(true)
  })

  it('tek program açıklamasıyla, program başlığı açıkça', async () => {
    harness(ADMIN_SCOPE)
    server.use(
      http.get(`${ORIGIN}/v1/program`, () =>
        json({ program_id: 'p2', name: 'B', description: 'Açıklama' }),
      ),
    )
    await expect(fetchProgram('p2')).resolves.toMatchObject({ description: 'Açıklama' })
    expect(sent('GET', '/v1/program')[0]!.headers.get('X-Nizamio-Program')).toBe('p2')
  })
})

describe('program yazmaları', () => {
  it('oluşturma: gövde, X-Requested-With, anahtarsız; başarıda standing tazelenir', async () => {
    const h = harness(ADMIN_SCOPE)
    server.use(
      http.post(`${ORIGIN}/v1/programs`, () =>
        json({ program_id: 'p3', name: 'Yeni', created: true }, 201),
      ),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
    )
    const create = h.run(() => useCreateProgram()).result
    const outcome = await create.submit({ name: 'Yeni', year: 2027 })
    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/programs')
    expect(bodyOf(req)).toEqual({ name: 'Yeni', year: 2027 })
    expect(req!.headers.get('X-Requested-With')).toBeTruthy()
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(h.queryClient.getQueryState(queryKeys.me.root())?.isInvalidated).toBe(true)
  })

  it('güncelleme yalnız verilen alanlar (PATCH)', async () => {
    const h = harness(ADMIN_SCOPE)
    server.use(
      http.patch(`${ORIGIN}/v1/programs/p1`, () => json({ program_id: 'p1', name: 'X' })),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
    )
    const update = h.run(() => useUpdateProgram()).result
    await update.submit({ programId: 'p1', changes: { description: null } })
    expect(bodyOf(sent('PATCH', '/v1/programs/p1')[0])).toEqual({ description: null })
  })

  it('silme: parola gövdede; sonuç taslağı parolasız; mutasyon önbelleği boş; kapsam sorguları geçersiz', async () => {
    const h = harness(ADMIN_SCOPE)
    h.queryClient.setQueryData(scopedKey(h), { items: [] })
    server.use(
      http.delete(`${ORIGIN}/v1/programs/p1`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
    )
    const remove = h.run(() => useDeleteProgram()).result
    const outcome = await remove.submit({ programId: 'p1', password: 'gizli-parola' })
    expect(outcome.kind).toBe('success')
    await vi.waitFor(() =>
      expect(bodyOf(sent('DELETE', '/v1/programs/p1')[0])).toEqual({ password: 'gizli-parola' }),
    )
    expect(
      JSON.stringify(
        h.queryClient
          .getMutationCache()
          .getAll()
          .map((m) => m.state),
      ),
    ).not.toContain('gizli-parola')
    expect(h.queryClient.getQueryState(scopedKey(h))?.isInvalidated).toBe(true)
  })

  it('sıfırlama 401 password_invalid → failed; sonuç bilinmiyorsa taslak parolasız, kör tekrar yok', async () => {
    const h = harness(ADMIN_SCOPE)
    server.use(
      http.post(`${ORIGIN}/v1/programs/p1/reset`, () =>
        errorEnvelope('program.password_invalid', 401),
      ),
    )
    const reset = h.run(() => useResetProgram()).result
    const failed = await reset.submit({ programId: 'p1', password: 'yanlis' })
    expect(failed.kind === 'failed' && failed.error.code).toBe('program.password_invalid')
    server.use(
      http.post(`${ORIGIN}/v1/programs/p1/reset`, () => HttpResponse.error()),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
    )
    const unknown = await reset.submit({ programId: 'p1', password: 'gizli-parola' })
    expect(unknown.kind).toBe('unknown_outcome')
    if (unknown.kind === 'unknown_outcome') {
      expect(unknown.draft.password).toBe('')
      expect(unknown.retry).toBeNull()
    }
  })
})

describe('CX-F2-Ö-02 sahibi sökülmüş sonuç redaksiyonu', () => {
  it('geç sonuç parolasız döner, sökülmüş-sahip işareti korunur: reachesOwner=false, bildirim yok', async () => {
    const h = harness(ADMIN_SCOPE)
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/programs/p1/reset`, async () => {
        await gate
        return HttpResponse.error()
      }),
      http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
    )
    const { result: reset, app } = h.run(() => useResetProgram())
    const pending = reset.submit({ programId: 'p1', password: 'gizli-parola' })
    await vi.waitFor(() => expect(sent('POST', '/v1/programs/p1/reset')).toHaveLength(1))
    app.unmount() // sahip (ekran) istek uçuştayken söküldü
    release()
    const late = await pending

    expect(late.kind).toBe('unknown_outcome')
    expect(late.kind === 'unknown_outcome' && late.draft.password).toBe('')
    expect(isDetached(late)).toBe(true)
    expect(reachesOwner(late)).toBe(false)
    expect(outcomeToast(late)).toBeNull()
    expect(h.run(() => notifyOutcome(late)).result).toBe(false)
    await h.flush()
    expect(toasts()).toEqual([])
  })
})

describe('W82c okuyucu kapısı', () => {
  it('program listesi okunurken oturum değişirse yanıt `["programs"]` önbelleğine yazılmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}/v1/programs`, async () => {
        await gate
        return json({ programs: [{ program_id: 'p9', name: 'Eski oturum' }] })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useProgramList()).result
    const before = h.queryClient.getQueryData(queryKeys.programs.all())
    void h.queryClient.invalidateQueries({ queryKey: queryKeys.programs.all() })
    await vi.waitFor(() => expect(sent('GET', '/v1/programs')).toHaveLength(1))
    authSession.clear()
    release()
    await vi.waitFor(() => expect(list.query.isFetching.value).toBe(false))
    expect(h.queryClient.getQueryData(queryKeys.programs.all())).toEqual(before)
    expect(list.programs.value.map((p) => p.programId)).not.toContain('p9')
    expect(h.queryClient.getQueryState(queryKeys.programs.all())?.error).toBeInstanceOf(
      SessionChangedError,
    )
  })
})
