import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { expect, it, vi } from 'vitest'
import type { MeetingNote } from '../../model/types'
import { useNoteDelete } from './use-note-delete'

it('program seçili değilse silme onayı açmaz', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const refresh = vi.fn()
  const focus = vi.fn()
  let remove!: ReturnType<typeof useNoteDelete>
  const wrapper = mount(
    defineComponent({
      setup() {
        remove = useNoteDelete(
          () => ({ programId: 'p', id: 'm' }),
          () => 0,
          refresh,
          focus,
        )
        return () => null
      },
    }),
    { global: { plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]] } },
  )
  await remove({ note_id: 'n' } as MeetingNote)
  expect(refresh).not.toHaveBeenCalled()
  expect(focus).not.toHaveBeenCalled()
  wrapper.unmount()
})
