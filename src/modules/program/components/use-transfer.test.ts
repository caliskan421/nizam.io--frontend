// Dönem aktarımı (TransferPanel + useTransfer + TransferItems): önizleme olmadan aktarım yok;
// seçim değişince önizleme bayatlar; anahtar eylem başına; 409 preview_stale → yeniden önizle
// (otomatik tekrar YOK); eksik erişim bayrağı; sökülmede geç yanıt bildirim üretmez.
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
  PROGRAMS,
  resetHarness,
  sent,
  server,
  setValue,
  toasts,
} from '../__tests__/harness'
import TransferPanel from './TransferPanel.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const OPTIONS = PROGRAMS.map((p) => ({
  programId: p.program_id,
  name: p.name,
  year: p.year ?? null,
}))

const item = (id: string, title: string) => ({ work_item_id: id, title, department_id: 'd1' })

function preview(over: Record<string, unknown> = {}) {
  return {
    resolved_work_item_ids: ['w1', 'w2'],
    file_count: 1,
    file_total_bytes: 1024,
    preserved_dependency_count: 0,
    missing_access: false,
    granted_memberships: [],
    blockers: [],
    warnings: [],
    can_execute: true,
    preview_fingerprint: 'fp-1',
    ...over,
  }
}

const RESULT = {
  transfer_id: 't1',
  moved_work_item_ids: ['w1', 'w2'],
  moved_file_count: 1,
  cut_dependency_count: 0,
  restored_dependency_count: 0,
  granted_links: [],
  revoked_links: [],
  retained_links: [],
  granted_memberships: [],
  replayed: false,
}

async function ready(previewBody = preview()) {
  server.use(
    http.get(`${ORIGIN}/v1/program/work-items`, () =>
      json({ items: [item('w1', 'Motor testi'), item('w2', 'Rapor')] }),
    ),
    http.post(`${ORIGIN}/v1/program-transfers/preview`, () => json(previewBody)),
    http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
  )
  const h = harness(ADMIN_SCOPE)
  h.departments([{ id: 'd1', name: 'Roket' }])
  const wrapper = h.mount(TransferPanel, { programs: OPTIONS })
  await setValue('[name="target"]', 'p2')
  await setValue('[name="department"]', 'd1')
  await vi.waitFor(() => expect($('[data-testid="pg-select-all"]')).not.toBeNull())
  click('[data-testid="pg-select-all"]')
  await h.flush()
  return { h, wrapper }
}

async function previewNow(h: ReturnType<typeof harness>) {
  click('[data-testid="pg-preview"]')
  await vi.waitFor(() => expect($('[data-testid="pg-preview-card"]')).not.toBeNull())
  await h.flush()
}

const executeButton = () => $('[data-testid="pg-execute"]') as HTMLButtonElement | null

describe('dönem aktarımı', () => {
  it('kaynak = seçili program; hedef listesinde kendisi yok; önizleme yokken "Aktar" yok', async () => {
    const { h } = await ready()
    const targets = [...($('[name="target"]') as HTMLSelectElement).options].map((o) => o.value)
    expect(targets).toEqual(['', 'p2'])
    expect(($('[name="source"]') as HTMLInputElement).value).toBe('Teknofest 2026')
    expect(executeButton()).toBeNull()
    expect($('[data-testid="pg-selected-count"]')?.textContent).toContain('2 görev seçili')
    await previewNow(h)
    expect(bodyOf(sent('POST', '/v1/program-transfers/preview')[0])).toEqual({
      source_program_id: 'p1',
      target_program_id: 'p2',
      department_id: 'd1',
      work_item_ids: ['w1', 'w2'],
    })
    expect($('[data-testid="pg-preview-card"]')?.textContent).toContain('2 görev aktarılacak')
    expect(executeButton()?.disabled).toBe(false)
  })

  it('seçim değişince önizleme bayatlar; "Aktar" kapanır', async () => {
    const { h } = await ready()
    await previewNow(h)
    const box = $('[data-item="w2"]') as HTMLInputElement
    box.checked = false
    box.dispatchEvent(new Event('change'))
    await h.flush()
    expect($('[data-testid="pg-preview-stale"]')).not.toBeNull()
    expect(executeButton()?.disabled).toBe(true)
  })

  it('onaylı aktarım: Idempotency-Key + parmak izi; başarı bildirimi; önizleme düşer', async () => {
    const { h } = await ready()
    server.use(http.post(`${ORIGIN}/v1/program-transfers`, () => json(RESULT, 201)))
    await previewNow(h)
    click('[data-testid="pg-execute"]')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    expect(h.confirmQueue.current.value!.options.body).toEqual([
      '2 görev Teknofest 2027 programına taşınır. Aktarım hep ya da hiç yürür.',
    ])
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() =>
      expect(toasts()).toContain('Aktarım tamamlandı: 2 görev, 1 dosya taşındı.'),
    )
    const [req] = sent('POST', '/v1/program-transfers')
    expect(req!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(bodyOf(req)).toMatchObject({ preview_fingerprint: 'fp-1', work_item_ids: ['w1', 'w2'] })
    expect($('[data-testid="pg-preview-card"]')).toBeNull()
  })

  it('onay vazgeç → istek yok', async () => {
    const { h } = await ready()
    await previewNow(h)
    click('[data-testid="pg-execute"]')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    h.confirmQueue.cancel(h.confirmQueue.current.value!.id)
    await h.flush()
    expect(sent('POST', '/v1/program-transfers')).toHaveLength(0)
  })

  it('409 preview_stale → önizleme düşer, not; otomatik yeniden önizleme / gönderim yok', async () => {
    const { h } = await ready()
    server.use(
      http.post(`${ORIGIN}/v1/program-transfers`, () =>
        errorEnvelope('program.transfer_preview_stale', 409),
      ),
    )
    await previewNow(h)
    click('[data-testid="pg-execute"]')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() => expect($('[data-testid="pg-stale"]')).not.toBeNull())
    await h.flush()
    expect($('[data-testid="pg-preview-card"]')).toBeNull()
    expect(sent('POST', '/v1/program-transfers')).toHaveLength(1)
    expect(sent('POST', '/v1/program-transfers/preview')).toHaveLength(1)
  })

  it('eksik erişim: bayraksız "Aktar" kapalı; bayrakla açılır ve gövdeye girer', async () => {
    const { h } = await ready(
      preview({ can_execute: false, missing_access: true, blockers: ['missing_access'] }),
    )
    server.use(http.post(`${ORIGIN}/v1/program-transfers`, () => json(RESULT, 201)))
    await previewNow(h)
    expect(executeButton()?.disabled).toBe(true)
    expect($('[data-testid="pg-blockers"]')?.textContent).toContain('1 engel var')
    const flag = $('[name="add-missing-access"]') as HTMLInputElement
    flag.checked = true
    flag.dispatchEvent(new Event('change'))
    await h.flush()
    expect(executeButton()?.disabled).toBe(false)
    click('[data-testid="pg-execute"]')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() => expect(sent('POST', '/v1/program-transfers')).toHaveLength(1))
    await vi.waitFor(() =>
      expect(bodyOf(sent('POST', '/v1/program-transfers')[0])).toMatchObject({
        add_missing_access: true,
      }),
    )
  })

  it('başka engel varsa bayrak da açmaz', async () => {
    const { h } = await ready(
      preview({ can_execute: false, missing_access: true, blockers: ['a', 'b'] }),
    )
    await previewNow(h)
    const flag = $('[name="add-missing-access"]') as HTMLInputElement
    flag.checked = true
    flag.dispatchEvent(new Event('change'))
    await h.flush()
    expect(executeButton()?.disabled).toBe(true)
  })

  it('seçili program değişince seçim ve önizleme sıfırlanır (K2)', async () => {
    const { h } = await ready()
    await previewNow(h)
    h.store.setProgram('p2')
    await h.flush()
    expect($('[data-testid="pg-preview-card"]')).toBeNull()
    expect(($('[name="target"]') as HTMLSelectElement | null)?.value ?? '').toBe('')
  })

  it('uzun aktarımda sayfa sökülürse geç yanıt bildirim üretmez', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    const { h, wrapper } = await ready()
    server.use(
      http.post(`${ORIGIN}/v1/program-transfers`, async () => {
        await gate
        return json(RESULT, 201)
      }),
    )
    await previewNow(h)
    click('[data-testid="pg-execute"]')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    const accepted = h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() => expect(sent('POST', '/v1/program-transfers')).toHaveLength(1))
    wrapper.unmount()
    release()
    await accepted
    await h.flush()
    expect(toasts()).toEqual([])
    expect(sent('POST', '/v1/program-transfers')).toHaveLength(1)
  })

  it('tek program varken aktarım kurulmaz', () => {
    const h = harness(ADMIN_SCOPE)
    h.mount(TransferPanel, { programs: OPTIONS.slice(0, 1) })
    expect(document.body.textContent).toContain('Aktarım için en az iki program gerekir.')
    expect($('[data-testid="pg-transfer"]')).toBeNull()
  })
})
