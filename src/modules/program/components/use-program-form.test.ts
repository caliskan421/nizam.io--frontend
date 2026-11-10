// Program formu (ProgramFormDialog + useProgramForm): oluştur / mevcut ad / düzenle (yalnız
// değişen alan) / alan hatası / okuma hatası; BE-001 kısa ad + renk gerçek alan (üç hâlli yazma).
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

  it('K-2: geçersiz gönderimde odak ilk hatalı alana (ad)', async () => {
    const h = harness(ADMIN_SCOPE)
    h.mount(ProgramFormDialog, { open: true })
    // Pencere açılış odağı yerleşsin; ardından klavye: açıklama alanındayken form gönderilir.
    await vi.waitFor(() =>
      expect($('[role="dialog"]')!.contains(document.activeElement)).toBe(true),
    )
    const description = $('[name="description"]') as HTMLElement
    description.focus()
    expect(document.activeElement).toBe(description)
    $('#pg-program-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await vi.waitFor(() => expect(document.activeElement).toBe($('[name="name"]')))
    expect(document.activeElement?.getAttribute('aria-invalid')).toBe('true')
  })

  it('oluşturur; yıl, kısa ad ve renk gövdeye girer (BE-001)', async () => {
    server.use(
      refetch,
      http.post(`${ORIGIN}/v1/programs`, () =>
        json({ program_id: 'p9', name: 'Yeni', created: true }, 201),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true })
    expect($('[data-design-stub="BE-001"]')).toBeNull()
    expect($('[data-testid="pg-short-name"]')?.hasAttribute('disabled')).toBe(false)
    const year = String(new Date().getFullYear() + 1)
    await setValue('[name="name"]', ' Yeni ')
    await setValue('[name="year"]', year)
    await setValue('[name="short-name"]', ' ŞT26 ')
    await setValue('[name="color"]', 'teal')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['p9']]))
    await vi.waitFor(() =>
      expect(bodyOf(sent('POST', '/v1/programs')[0])).toEqual({
        name: 'Yeni',
        year: Number(year),
        short_name: 'ŞT26',
        color: 'teal',
      }),
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

  it('kısa ad 4 karakterden uzunsa istek yok (istemci); sunucu invalid_short_name alanda', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/programs`, () =>
        errorEnvelope('program.input_invalid', 422, [
          { field: 'short_name', code: 'program.invalid_short_name', message: 'x' },
        ]),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    h.mount(ProgramFormDialog, { open: true })
    await setValue('[name="name"]', 'Yeni')
    await setValue('[name="short-name"]', 'BEŞKR')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Kısa ad 1–4 harf ya da rakamdan oluşmalı.'),
    )
    expect(sent('POST', '/v1/programs')).toHaveLength(0)
    // Sunucu kuralı istemciden farklı yorumlarsa (ör. simge) yine alana düşer.
    await setValue('[name="short-name"]', 'AB')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() =>
      expect($('[name="short-name"]')?.getAttribute('aria-invalid')).toBe('true'),
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

  it('kısa ad değişir, renk temizlenir → PATCH üç hâlli (short_name yazılır, color null)', async () => {
    server.use(
      refetch,
      http.get(`${ORIGIN}/v1/program`, () =>
        json({ program_id: 'p1', name: 'A', short_name: 'TF', color: 'blue' }),
      ),
      http.patch(`${ORIGIN}/v1/programs/p1`, () => json({ program_id: 'p1', name: 'A' })),
    )
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramFormDialog, { open: true, programId: 'p1' })
    await vi.waitFor(() =>
      expect(($('[name="short-name"]') as HTMLInputElement | null)?.value).toBe('TF'),
    )
    expect(($('[name="color"]') as HTMLSelectElement).value).toBe('blue')
    await setValue('[name="short-name"]', 'T26')
    await setValue('[name="color"]', '')
    click('[data-testid="pg-form-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['p1']]))
    await vi.waitFor(() =>
      expect(bodyOf(sent('PATCH', '/v1/programs/p1')[0])).toEqual({
        short_name: 'T26',
        color: null,
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
