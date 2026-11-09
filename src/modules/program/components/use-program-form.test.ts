// Program formu (ProgramFormDialog + useProgramForm): oluştur / mevcut ad / düzenle (yalnız
// değişen alan) / alan hatası / okuma hatası; BE-001 kısa ad statik ve devre dışı.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN_SCOPE,
  bodyOf,
  click,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  setValue,
  toasts,
} from '../__tests__/harness'
import ProgramFormDialog from './ProgramFormDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const refetch = http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] }))

describe('program formu — oluşturma', () => {
  it('ad zorunlu: boşsa istek yok', async () => {
    const h = harness(ADMIN_SCOPE)
    h.mount(ProgramFormDialog, { open: true })
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Program adı gerekli.'))
    expect(sent('POST', '/v1/programs')).toHaveLength(0)
  })

  it('oluşturur; yıl seçilebilir; kısa ad/renk statik (BE-001) ve gönderilmez', async () => {
    server.use(
      refetch,
      http.post(`${ORIGIN}/v1/programs`, () =>
        json({ program_id: 'p9', name: 'Yeni', created: true }, 201),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true })
    expect($('[data-design-stub="BE-001"] [data-testid="pg-short-name"]')).not.toBeNull()
    expect($('[data-testid="pg-short-name"]')?.hasAttribute('disabled')).toBe(true)
    const year = String(new Date().getFullYear() + 1)
    await setValue('[name="name"]', ' Yeni ')
    await setValue('[name="year"]', year)
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['p9']]))
    await vi.waitFor(() =>
      expect(bodyOf(sent('POST', '/v1/programs')[0])).toEqual({ name: 'Yeni', year: Number(year) }),
    )
    expect(toasts()).toContain('Program oluşturuldu.')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('aynı ad varsa (200, created:false) kullanıcıya söylenir', async () => {
    server.use(
      refetch,
      http.post(`${ORIGIN}/v1/programs`, () =>
        json({ program_id: 'p1', name: 'Teknofest 2026', created: false }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    h.mount(ProgramFormDialog, { open: true })
    await setValue('[name="name"]', 'Teknofest 2026')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() =>
      expect(toasts()).toContain('Bu adla bir program zaten vardı; mevcut program gösteriliyor.'),
    )
  })

  it('422 invalid_year → yıl alanında; pencere açık', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/programs`, () =>
        errorEnvelope('program.input_invalid', 422, [
          { field: 'year', code: 'program.invalid_year', message: 'x' },
        ]),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true })
    await setValue('[name="name"]', 'Yeni')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect($('[name="year"]')?.getAttribute('aria-invalid')).toBe('true'))
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})

describe('program formu — düzenleme', () => {
  it('kaydı readProgram ile okur; yalnız değişen alanı PATCH eder', async () => {
    server.use(
      refetch,
      http.get(`${ORIGIN}/v1/program`, () =>
        json({ program_id: 'p1', name: 'Teknofest 2026', year: 2026, description: 'Eski' }),
      ),
      http.patch(`${ORIGIN}/v1/programs/p1`, () => json({ program_id: 'p1', name: 'X' })),
    )
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true, programId: 'p1' })
    expect($('[data-testid="pg-form-loading"]')).not.toBeNull()
    await vi.waitFor(() =>
      expect(($('[name="description"]') as HTMLTextAreaElement | null)?.value).toBe('Eski'),
    )
    expect(sent('GET', '/v1/program')[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    await setValue('[name="description"]', 'Yeni açıklama')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['p1']]))
    await vi.waitFor(() =>
      expect(bodyOf(sent('PATCH', '/v1/programs/p1')[0])).toEqual({
        description: 'Yeni açıklama',
      }),
    )
  })

  it('değişiklik yoksa istek yok, pencere kapanır', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program`, () => json({ program_id: 'p1', name: 'A', year: 2026 })),
    )
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true, programId: 'p1' })
    await vi.waitFor(() => expect($('[name="name"]')).not.toBeNull())
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['p1']]))
    expect(sent('PATCH', '/v1/programs/p1')).toHaveLength(0)
  })

  it('okuma hatası → yeniden dene', async () => {
    server.use(http.get(`${ORIGIN}/v1/program`, () => errorEnvelope('program.not_found', 404)))
    const h = harness(ADMIN_SCOPE)
    h.mount(ProgramFormDialog, { open: true, programId: 'p1' })
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Program bilgisi okunamadı.'),
    )
    expect($('[name="name"]')).toBeNull()
    server.use(http.get(`${ORIGIN}/v1/program`, () => json({ program_id: 'p1', name: 'A' })))
    click('.pg-note button')
    await vi.waitFor(() => expect($('[name="name"]')).not.toBeNull())
  })

  it('seçili program değişince açık pencere kapanır (K2)', async () => {
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true })
    h.store.setProgram('p2')
    await h.flush()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
