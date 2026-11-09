/**
 * CX-F1-E-05 (not düzenleme) — ilk PATCH beklerken bileşen sökülür, geç `409 work.edit_conflict`
 * gelir (sürüm ilerlemiş, içerik tabanla aynı → "kendiliğinden birleşen" çakışma). Sökülmeden
 * sonra yeniden gönderim YOK; ilk çağrı tamamlanır, diyalog/bildirim yok. Gerçek hook + MSW.
 * Dürüst sınır: tüketici savunması (`use-note-actions` içindeki `owner.alive()` denetimi, D3)
 * derinlik savunmasıdır ve tek başına hiçbir testle yakalanmaz — kaldırılırsa çözümleyici (D2)
 * ve motor kapısı (D1) bu testi yine yeşil tutar; üçü birden kaldırılınca kırmızıya döner.
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import {
  errorEnvelope,
  http,
  json,
  note,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import { NOTES_PATH, notesHarness, resetNotes, toastMessages } from './__tests__/notes-harness'
import { useNoteActions } from './use-note-actions'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetNotes())
afterAll(() => server.close())

const URL = `${ORIGIN}${NOTES_PATH}`
const base = note({ note_id: 'n1', content: 'Eski', edit_revision: 2 })

function mountActions() {
  const h = notesHarness({ role: 'uye' })
  const refetch = vi.fn(() => Promise.resolve())
  let actions!: ReturnType<typeof useNoteActions>
  const Owner = defineComponent({
    setup() {
      actions = useNoteActions(() => workItem(), refetch)
      return () => null
    },
  })
  const wrapper = mount(Owner, {
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { actions, refetch, unmount: () => wrapper.unmount() }
}

/** İlk PATCH bekletilir ve 409 döner; güncel not: sürüm 3, içerik tabanla aynı ('Eski'). */
function lateConflict() {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  let patches = 0
  server.use(
    http.patch(`${URL}/n1`, async () => {
      if (++patches > 1) return json({ ...base, content: 'Benim', edit_revision: 4 })
      arrived()
      await gate
      return errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }])
    }),
    http.get(URL, () => json({ notes: [{ ...base, edit_revision: 3 }], total: 1 })),
  )
  return { reached, release }
}

describe('not düzenleme — sökülmeden sonra geç edit_conflict (CX-F1-E-05)', () => {
  it('sökülme → geç 409 → yeniden gönderim 0; ilk çağrı tamamlanır, diyalog ve bildirim yok', async () => {
    const late = lateConflict()
    const { actions, refetch, unmount } = mountActions()
    const pending = actions.saveNote(base, 'Benim')
    await late.reached
    unmount()
    late.release()
    await expect(pending).resolves.toEqual({ done: false, notice: null })
    expect(sent('PATCH', `${NOTES_PATH}/n1`)).toHaveLength(1)
    expect(actions.conflict.open.value).toBe(false)
    expect(toastMessages()).toEqual([])
    expect(refetch).not.toHaveBeenCalled()
  })

  it('kontrol — canlı sahipte aynı sıra kendiliğinden birleşir: ikinci PATCH yeni tabanla gider', async () => {
    const late = lateConflict()
    const { actions, unmount } = mountActions()
    const pending = actions.saveNote(base, 'Benim')
    await late.reached
    late.release()
    expect(await pending).toEqual({ done: true, notice: null })
    const calls = sent('PATCH', `${NOTES_PATH}/n1`)
    expect(calls).toHaveLength(2)
    expect(calls[1]!.body).toMatchObject({ content: 'Benim', expected_revision: 3 })
    unmount()
  })
})
