import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { useConfirm } from '@/shared/ui/confirm'

import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  note,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItemNote } from '../../model/types'
import { NOTES_PATH, notesHarness, resetNotes, toastMessages } from './__tests__/notes-harness'
import NotesTab from './NotesTab.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetNotes())
afterAll(() => server.close())

const URL = `${ORIGIN}${NOTES_PATH}`
const list = (...notes: WorkItemNote[]) => json({ notes, total: notes.length })
const mine = note({ note_id: 'n1', author_account_id: 'acc-1', content: 'Benim notum' })
const theirs = note({ note_id: 'n2', author_account_id: 'acc-2', author_full_name: 'Can' })

function setup(seed: Parameters<typeof notesHarness>[0], item = workItem()) {
  const h = notesHarness(seed)
  const wrapper = h.mountWith(NotesTab, { item })
  return { h, wrapper }
}

async function loaded(wrapper: ReturnType<typeof setup>['wrapper']) {
  await vi.waitFor(() => expect(wrapper.findAll('[data-testid="note"]').length).toBeGreaterThan(0))
}

describe('NotesTab — görünürlük (s.143–s.145)', () => {
  it('şirket yöneticisi: yazma alanı HER durumda gizli (koordinatör satırı olsa da), liste görünür', async () => {
    server.use(http.get(URL, () => list(mine, theirs)))
    const { wrapper } = setup({ admin: true, role: 'koordinator' })
    await loaded(wrapper)
    expect(wrapper.find('[data-testid="note-input"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="note-body"]').map((b) => b.text())).toEqual([
      'Benim notum',
      'İlk',
    ])
    expect(sent('GET', NOTES_PATH)[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
  })

  it.each([
    ['koordinatör', { role: 'koordinator' as const }, workItem({ assignee_account_ids: [] }), true],
    ['atanmış üye', { role: 'uye' as const }, workItem(), true],
    ['atanmamış üye', { role: 'uye' as const }, workItem({ assignee_account_ids: ['x'] }), false],
  ])('%s: yazma alanı %#', async (_name, seed, item, visible) => {
    server.use(http.get(URL, () => list(mine)))
    const { wrapper } = setup(seed, item)
    await loaded(wrapper)
    expect(wrapper.find('[data-testid="note-input"]').exists()).toBe(visible)
  })

  it('düzenle/sil yalnız kendi notunda (yazar + ekip satırı)', async () => {
    server.use(http.get(URL, () => list(mine, theirs)))
    const { wrapper } = setup({ role: 'uye' })
    await loaded(wrapper)
    const [own, other] = wrapper.findAll('[data-testid="note"]')
    expect(own!.find('[data-testid="note-edit"]').exists()).toBe(true)
    expect(own!.find('[data-testid="note-delete"]').exists()).toBe(true)
    expect(other!.find('[data-testid="note-edit"]').exists()).toBe(false)
    expect(other!.find('[data-testid="note-delete"]').exists()).toBe(false)
  })

  it('403 work.not_assigned: metin hata kodundan (i18n), sunucu iletisi gösterilmez', async () => {
    server.use(http.get(URL, () => errorEnvelope('work.not_assigned', 403)))
    const { wrapper } = setup({ role: 'uye' })
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.text()).toContain('Bu görev size atanmamış.')
    expect(wrapper.text()).not.toContain('sunucu iletisi')
  })

  it('başka görev açılınca taslak taşınmaz', async () => {
    server.use(
      http.get(URL, () => list(mine)),
      http.get(`${ORIGIN}/v1/work-items/w2/notes`, () => list()),
    )
    const { wrapper } = setup({ role: 'uye' })
    await loaded(wrapper)
    const input = wrapper.find('[data-testid="note-input"]')
    await input.setValue('Yarım')
    await wrapper.setProps({ item: workItem({ work_item_id: 'w2' }) })
    expect((input.element as HTMLTextAreaElement).value).toBe('')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Henüz not yok'))
  })

  it('boş liste: nötr boş durum (örnek veri yok)', async () => {
    server.use(http.get(URL, () => list()))
    const { wrapper } = setup({ role: 'uye' })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Henüz not yok'))
  })
})

describe('NotesTab — yazmalar', () => {
  it('not ekle: IK, kırpılmış içerik, görev kapsamı; başarıda taslak boşalır ve liste yeniden okunur', async () => {
    server.use(
      http.get(URL, () => list(mine)),
      http.post(URL, () => json(note({ note_id: 'n9' }), 201)),
    )
    const { wrapper } = setup({ role: 'uye' })
    await loaded(wrapper)
    await wrapper.find('[data-testid="note-input"]').setValue('  Yeni not  ')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(sent('GET', NOTES_PATH)).toHaveLength(2))
    const [req] = sent('POST', NOTES_PATH)
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    await vi.waitFor(() => expect(req!.body).toEqual({ content: 'Yeni not' }))
    await vi.waitFor(() =>
      expect(
        (wrapper.find('[data-testid="note-input"]').element as HTMLTextAreaElement).value,
      ).toBe(''),
    )
  })

  it('403 work.not_authorized yazmada: bildirim metni i18n', async () => {
    server.use(
      http.get(URL, () => list(mine)),
      http.post(URL, () => errorEnvelope('work.not_authorized', 403)),
    )
    const { wrapper } = setup({ role: 'koordinator' })
    await loaded(wrapper)
    await wrapper.find('[data-testid="note-input"]').setValue('x')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(toastMessages()).toContain('Bu işlem için yetkiniz yok.'))
  })

  it('409 edit_conflict: alan seçimi ("Benim değerim") → yeni tabanla yeni gönderim', async () => {
    let patches = 0
    server.use(
      http.get(URL, () =>
        patches === 0 ? list(mine) : list({ ...mine, content: 'Başkası', edit_revision: 3 }),
      ),
      http.patch(`${URL}/n1`, () => {
        patches += 1
        return patches === 1
          ? errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }])
          : json({ status: 'updated', edit_revision: 4 })
      }),
    )
    const { wrapper } = setup({ role: 'uye' })
    await loaded(wrapper)
    await wrapper.find('[data-testid="note-edit"]').trigger('click')
    await wrapper.find('[data-testid="note"] [data-testid="note-input"]').setValue('Benim')
    await wrapper.find('[data-testid="note"] form').trigger('submit')
    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="conflict-fields"]')).not.toBeNull(),
    )
    expect(document.querySelector('[data-testid="conflict-mine"]')!.textContent).toBe('Benim')
    expect(document.querySelector('[data-testid="conflict-theirs"]')!.textContent).toBe('Başkası')
    document.querySelector<HTMLButtonElement>('.rp-seg button')!.click()
    await nextTick()
    document.querySelector<HTMLButtonElement>('[data-testid="conflict-submit"]')!.click()
    await vi.waitFor(() => expect(sent('PATCH', `${NOTES_PATH}/n1`)).toHaveLength(2))
    await vi.waitFor(() =>
      expect(sent('PATCH', `${NOTES_PATH}/n1`)[1]!.body).toEqual({
        content: 'Benim',
        expected_revision: 3,
      }),
    )
  })

  it('sil: istemci onayı; vazgeçte istek yok, onayda DELETE', async () => {
    server.use(
      http.get(URL, () => list(mine)),
      http.delete(`${URL}/n1`, () => json({ status: 'deleted' })),
    )
    const { wrapper } = setup({ role: 'uye' })
    await loaded(wrapper)
    const confirm = useConfirm()
    await wrapper.find('[data-testid="note-delete"]').trigger('click')
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    expect(confirm.current.value!.options.title).toBe('Not silinsin mi?')
    confirm.cancel(confirm.current.value!.id)
    await nextTick()
    expect(sent('DELETE', `${NOTES_PATH}/n1`)).toHaveLength(0)
    await wrapper.find('[data-testid="note-delete"]').trigger('click')
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    await confirm.accept(confirm.current.value!.id)
    await vi.waitFor(() => expect(sent('DELETE', `${NOTES_PATH}/n1`)).toHaveLength(1))
  })

  it('sonuç bilinmiyor (ağ): taslak korunur, aynı taslak yeni anahtarla gönderilemez', async () => {
    server.use(
      http.get(URL, () => list(mine)),
      http.post(URL, () => HttpResponse.error()),
    )
    const { wrapper } = setup({ role: 'uye' })
    await loaded(wrapper)
    const input = wrapper.find('[data-testid="note-input"]')
    await input.setValue('Taslak')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="outcome-notice"]').exists()).toBe(true),
    )
    expect((input.element as HTMLTextAreaElement).value).toBe('Taslak')
    expect(wrapper.find('[data-testid="note-submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="outcome-retry"]').exists()).toBe(true)
  })
})
