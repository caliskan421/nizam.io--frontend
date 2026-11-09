// Sil / sıfırla (ProgramDangerDialog + useProgramDanger): onaysız istek yok; parola yalnız
// bileşende; 401 → parola alanı; sökülmüş sahipte geç yanıt bildirim üretmez.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN_SCOPE,
  bodyOf,
  click,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  setValue,
  toasts,
} from '../__tests__/harness'
import ProgramDangerDialog from './ProgramDangerDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const TARGET = { programId: 'p2', name: 'Teknofest 2027' }

function open(mode: 'delete' | 'reset') {
  const h = harness(ADMIN_SCOPE)
  server.use(http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })))
  const wrapper = h.mount(ProgramDangerDialog, { open: true, mode, target: TARGET })
  return { h, wrapper }
}

async function submitWith(password: string) {
  await setValue('[name="password"]', password)
  click('[data-testid="pg-danger-submit"]')
}

describe('program sil / sıfırla', () => {
  it('parola boşsa istek ve onay yok', async () => {
    const { h } = open('delete')
    click('[data-testid="pg-danger-submit"]')
    await h.flush()
    expect(h.confirmQueue.current.value).toBeNull()
    expect(document.body.textContent).toContain('Parolanızı girin.')
    expect(sent('DELETE', '/v1/programs/p2')).toHaveLength(0)
  })

  it('onay vazgeçilirse istek gitmez', async () => {
    const { h, wrapper } = open('delete')
    await submitWith('parola')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    expect(h.confirmQueue.current.value!.options.tone).toBe('danger')
    expect(h.confirmQueue.current.value!.options.title).toBe('Teknofest 2027 silinsin mi?')
    h.confirmQueue.cancel(h.confirmQueue.current.value!.id)
    await h.flush()
    expect(sent('DELETE', '/v1/programs/p2')).toHaveLength(0)
    expect(wrapper.emitted('done')).toBeUndefined()
  })

  it('onayla silme: parola gövdede; bildirim + done; parola alanı temizlenir', async () => {
    server.use(
      http.delete(`${ORIGIN}/v1/programs/p2`, () => new HttpResponse(null, { status: 204 })),
    )
    const { h, wrapper } = open('delete')
    await submitWith('dogru-parola')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() => expect(wrapper.emitted('done')).toEqual([['delete', 'p2']]))
    await vi.waitFor(() =>
      expect(bodyOf(sent('DELETE', '/v1/programs/p2')[0])).toEqual({ password: 'dogru-parola' }),
    )
    expect(toasts()).toContain('Program silindi.')
  })

  it('sıfırlama sonucu sayılarla; 401 password_invalid → parola alanı', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/programs/p2/reset`, () =>
        errorEnvelope('program.password_invalid', 401),
      ),
    )
    const { h, wrapper } = open('reset')
    expect(document.body.textContent).toContain('Programı sıfırla')
    await submitWith('yanlis')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() =>
      expect($('[name="password"]')?.getAttribute('aria-invalid')).toBe('true'),
    )
    expect(document.body.textContent).toContain('Parola hatalı.')
    expect(wrapper.emitted('done')).toBeUndefined()

    server.use(
      http.post(`${ORIGIN}/v1/programs/p2/reset`, () =>
        json({ program_id: 'p2', tasks: 3, files: 2, messages: 5, meetings: 1 }),
      ),
    )
    await submitWith('dogru')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    await h.confirmQueue.accept(h.confirmQueue.current.value!.id)
    await vi.waitFor(() => expect(wrapper.emitted('done')).toEqual([['reset', 'p2']]))
    expect(toasts()).toContain('Program sıfırlandı: 3 görev, 2 dosya, 1 toplantı, 5 mesaj silindi.')
  })

  it('bileşen sökülünce bekleyen onay vazgeçle kapanır; istek ve bildirim yok', async () => {
    const { h, wrapper } = open('delete')
    await submitWith('parola')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    wrapper.unmount()
    await h.flush()
    expect(h.confirmQueue.current.value).toBeNull()
    expect(sent('DELETE', '/v1/programs/p2')).toHaveLength(0)
    expect(toasts()).toEqual([])
  })

  it('kapsam (seçili program) değişince açık onay vazgeçle kapanır', async () => {
    const { h } = open('delete')
    await submitWith('parola')
    await vi.waitFor(() => expect(h.confirmQueue.current.value).not.toBeNull())
    h.store.setProgram('p2')
    await h.flush()
    expect(h.confirmQueue.current.value).toBeNull()
    expect(sent('DELETE', '/v1/programs/p2')).toHaveLength(0)
  })
})
