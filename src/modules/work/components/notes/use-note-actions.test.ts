import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
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
import { NOTES_PATH, notesHarness, resetNotes, toastMessages } from './__tests__/notes-harness'
import { noticeContent, settle, useNoteActions } from './use-note-actions'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetNotes())
afterAll(() => server.close())

const URL = `${ORIGIN}${NOTES_PATH}`
const base = note({ note_id: 'n1', content: 'Eski', edit_revision: 2 })
const conflict409 = () =>
  errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }])

function setup() {
  const h = notesHarness({ role: 'uye' })
  const refetch = vi.fn(() => Promise.resolve())
  const actions = h.run(() => useNoteActions(() => workItem(), refetch))
  return { h, refetch, actions }
}

describe('settle (ortak sonuç dalı)', () => {
  it('başarı → done; sonuç bilinmiyor → yerinde bildirim; diğerleri → bildirim kuyruğu', async () => {
    const refetch = vi.fn(() => Promise.resolve())
    const success = { kind: 'success', data: {}, status: 201, replayed: false, idempotencyKey: 'k' }
    expect(await settle(success as never, refetch)).toEqual({ done: true, notice: null })
    const unknown = { kind: 'unknown_outcome', draft: { content: 'x' }, retry: null } as never
    expect(await settle(unknown, refetch)).toEqual({ done: false, notice: unknown })
    expect(noticeContent(unknown)).toBe('x')
    expect(noticeContent(null)).toBeNull()
    const failed = { kind: 'failed', error: new ApiError({ code: 'work.not_assigned' }) } as const
    expect(await settle(failed, refetch)).toEqual({ done: false, notice: null })
    expect(toastMessages()).toEqual(['Bu görev size atanmamış.'])
    expect(refetch).not.toHaveBeenCalled()
  })

  it('404 work.note_not_found → liste yeniden okunur, düzenleyici kapanır', async () => {
    const refetch = vi.fn(() => Promise.resolve())
    const gone = { kind: 'failed', error: new ApiError({ code: 'work.note_not_found' }) } as const
    expect(await settle(gone, refetch)).toEqual({ done: true, notice: null })
    expect(refetch).toHaveBeenCalledOnce()
    expect(toastMessages()).toEqual(['Not bulunamadı.'])
  })
})

describe('useNoteActions — düzenleme ve çakışma', () => {
  it('içerik değişmediyse istek yok', async () => {
    const { actions } = setup()
    expect(await actions.saveNote(base, 'Eski')).toEqual({ done: true, notice: null })
    expect(sent('PATCH', `${NOTES_PATH}/n1`)).toHaveLength(0)
  })

  it('çakışmada "Güncel değer" → yeniden gönderim yok, liste yeniden okunur', async () => {
    server.use(
      http.patch(`${URL}/n1`, conflict409),
      http.get(URL, () =>
        json({ notes: [{ ...base, content: 'Onun', edit_revision: 3 }], total: 1 }),
      ),
    )
    const { actions, refetch } = setup()
    const pending = actions.saveNote(base, 'Benim')
    await vi.waitFor(() => expect(actions.conflict.open.value).toBe(true))
    expect(actions.conflict.fields.value).toEqual([
      { field: 'content', label: 'Not', mine: 'Benim', theirs: 'Onun' },
    ])
    actions.conflict.choose({ content: 'theirs' })
    expect(await pending).toEqual({ done: true, notice: null })
    expect(sent('PATCH', `${NOTES_PATH}/n1`)).toHaveLength(1)
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('çakışmada vazgeç → düzenleyici açık kalır (taslak korunur)', async () => {
    server.use(
      http.patch(`${URL}/n1`, conflict409),
      http.get(URL, () =>
        json({ notes: [{ ...base, content: 'Onun', edit_revision: 3 }], total: 1 }),
      ),
    )
    const { actions } = setup()
    const pending = actions.saveNote(base, 'Benim')
    await vi.waitFor(() => expect(actions.conflict.open.value).toBe(true))
    actions.conflict.dismiss()
    expect(await pending).toEqual({ done: false, notice: null })
  })

  it('çakışmada not artık yok → "Not bulunamadı", düzenleyici kapanır', async () => {
    server.use(
      http.patch(`${URL}/n1`, conflict409),
      http.get(URL, () => json({ notes: [], total: 0 })),
    )
    const { actions, refetch } = setup()
    expect(await actions.saveNote(base, 'Benim')).toEqual({ done: true, notice: null })
    expect(actions.conflict.open.value).toBe(false)
    expect(toastMessages()).toEqual(['Not bulunamadı.'])
    expect(refetch).toHaveBeenCalledOnce()
  })
})

describe('useNoteActions — silme', () => {
  it('sonuç bilinmiyor → kalıcı bildirim + liste yeniden okunur', async () => {
    server.use(http.delete(`${URL}/n1`, () => HttpResponse.error()))
    const { actions, refetch } = setup()
    const confirm = useConfirm()
    const pending = actions.deleteNote(base)
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    expect(confirm.current.value!.options).toMatchObject({
      tone: 'danger',
      confirmLabel: 'Notu sil',
    })
    await confirm.accept(confirm.current.value!.id)
    expect(await pending).toBe(false)
    expect(refetch).toHaveBeenCalledOnce()
    expect(toastMessages()).toHaveLength(1)
  })

  it('403 work.note_not_yours → bildirim metni i18n', async () => {
    server.use(http.delete(`${URL}/n1`, () => errorEnvelope('work.note_not_yours', 403)))
    const { actions } = setup()
    const confirm = useConfirm()
    const pending = actions.deleteNote(base)
    await vi.waitFor(() => expect(confirm.current.value).not.toBeNull())
    await confirm.accept(confirm.current.value!.id)
    expect(await pending).toBe(false)
    expect(toastMessages()).toEqual(['Bu not size ait değil.'])
  })
})
