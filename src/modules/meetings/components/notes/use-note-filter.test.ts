import { computed } from 'vue'
import { expect, it, vi } from 'vitest'
import { useNoteFilter } from './use-note-filter'
const state = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { notlar: 'benim' } }),
  useRouter: () => ({ replace: state.replace }),
}))
it('reads and updates the URL filter', () => {
  const { filter, setFilter } = useNoteFilter()
  expect(computed(() => filter.value).value).toBe('mine')
  setFilter('converted')
  expect(state.replace).toHaveBeenCalledWith({ query: { notlar: 'gorev' } })
})
