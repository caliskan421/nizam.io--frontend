import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref, type App } from 'vue'

import { SEARCH_DEBOUNCE_MS, useDebouncedSearch } from './use-debounced-search'

const apps: App[] = []

function setup(initial = '') {
  const url = ref(initial)
  const commits: string[] = []
  let api!: ReturnType<typeof useDebouncedSearch>
  const app = createApp(
    defineComponent({
      setup() {
        api = useDebouncedSearch(url, (v) => commits.push(v))
        return () => null
      },
    }),
  )
  app.mount(document.createElement('div'))
  apps.push(app)
  return { url, commits, api }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  vi.useRealTimers()
})

describe('gecikmeli arama', () => {
  it('yazma gecikmeyle tek kez URL günceller (son değer)', async () => {
    const { api, commits } = setup()
    api.text.value = 'r'
    await nextTick()
    api.text.value = 'ra'
    await nextTick()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1)
    expect(commits).toEqual([])
    vi.advanceTimersByTime(1)
    expect(commits).toEqual(['ra'])
  })

  it('enter gecikmeyi atlar; değişmemişse yazmaz', async () => {
    const { api, commits } = setup('a')
    api.flush()
    expect(commits).toEqual([])
    api.text.value = 'ab'
    await nextTick()
    api.flush()
    expect(commits).toEqual(['ab'])
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2)
    expect(commits).toEqual(['ab'])
  })

  it('URL dışarıdan değişirse (geri tuşu) kutu uyar', async () => {
    const { api, url } = setup('a')
    url.value = 'baska'
    await nextTick()
    expect(api.text.value).toBe('baska')
  })

  it('bekleyen yazım sahip sökülünce iptal edilir (istek/URL yazımı yok)', async () => {
    const { api, commits } = setup()
    api.text.value = 'x'
    await nextTick()
    apps.splice(0)[0]!.unmount()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2)
    expect(commits).toEqual([])
  })
})
