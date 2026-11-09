// "Teknofest ve sezon" sayfası: liste (tr-TR sırası, sayaç), "program yok" → oluştur yolu,
// "Bu programa geç" kapsamı değiştirir, eylemler pencereleri açar; seçili program değişince açık
// bağ penceresi kapanır (K2).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN_SCOPE,
  click,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  server,
} from '../__tests__/harness'
import ProgramsPage from './ProgramsPage.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

function backend() {
  server.use(
    http.get(`${ORIGIN}/v1/program-transfers`, () => json({ transfers: [] })),
    http.get(`${ORIGIN}/v1/departments`, () => json({ departments: [] })),
  )
}

describe('Teknofest ve sezon sayfası', () => {
  it('liste ad sırasıyla, sayaç; seçili rozetli; aktarım ve geçmiş kartları', async () => {
    backend()
    const h = harness(ADMIN_SCOPE, {
      programs: [
        { program_id: 'p1', name: 'Zafer 2026', year: 2026 },
        { program_id: 'p2', name: 'Çağrı 2027', year: 2027 },
        { program_id: 'p3', name: 'Ankara 2025' },
      ],
    })
    h.departments([{ id: 'd1', name: 'Roket' }])
    h.mount(ProgramsPage, {})
    await h.flush()
    const names = [...document.querySelectorAll('[data-testid="pg-list"] .pg-list__name')].map(
      (n) => n.textContent,
    )
    expect(names).toEqual(['Ankara 2025', 'Çağrı 2027', 'Zafer 2026'])
    expect($('[data-testid="pg-sub"]')?.textContent).toContain('3 program')
    expect($('[data-program="p1"]')?.dataset.current).toBe('true')
    expect($('[data-testid="pg-transfer"]')).not.toBeNull()
    expect($('[data-testid="pg-history"]')).not.toBeNull()
    expect($('[data-testid="pg-departments"]')?.textContent).toContain('Roket')
  })

  it('program yok → boş durum + "Yeni program" formu açar', async () => {
    backend()
    const h = harness({ programId: null, lens: null, departmentId: null }, { programs: [] })
    h.mount(ProgramsPage, {})
    await h.flush()
    expect($('[data-testid="pg-empty"]')?.textContent).toContain('Henüz program yok')
    click('[data-testid="pg-empty"] button')
    await vi.waitFor(() => expect($('#pg-program-form')).not.toBeNull())
    expect(document.body.textContent).toContain('Yeni program')
  })

  it('"Bu programa geç" kapsamı değiştirir; açık bağ penceresi kapanır', async () => {
    backend()
    const h = harness(ADMIN_SCOPE)
    h.departments([])
    h.mount(ProgramsPage, {})
    await h.flush()
    click('[data-testid="pg-link"]')
    await vi.waitFor(() => expect($('#pg-link-form')).not.toBeNull())
    click('[data-program="p2"] [data-testid="pg-select"]')
    await h.flush()
    expect(h.store.programId).toBe('p2')
    await vi.waitFor(() => expect($('#pg-link-form')).toBeNull())
  })

  it('düzenle / sıfırla / sil pencereleri doğru kayıtla açılır', async () => {
    backend()
    server.use(http.get(`${ORIGIN}/v1/program`, () => json({ program_id: 'p2', name: 'B' })))
    const h = harness(ADMIN_SCOPE)
    h.departments([])
    h.mount(ProgramsPage, {})
    await h.flush()
    click('[data-program="p2"] [data-testid="pg-delete"]')
    await vi.waitFor(() => expect($('#pg-danger-form')?.dataset.mode).toBe('delete'))
    expect(document.body.textContent).toContain('Teknofest 2027 ve programın bütün içeriği')
  })
})
