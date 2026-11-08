import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { useNarrowNav } from './narrow-nav'

describe('dar ekran kenar menüsü durumu', () => {
  it('varsayılan kapalı; aç/kapat, reveal açar', () => {
    const nav = useNarrowNav(() => '/')
    expect(nav.open.value).toBe(false)
    nav.toggle()
    expect(nav.open.value).toBe(true)
    nav.toggle()
    expect(nav.open.value).toBe(false)
    nav.reveal()
    expect(nav.open.value).toBe(true)
    nav.close()
    expect(nav.open.value).toBe(false)
  })

  it('rota değişince kapanır', async () => {
    const path = ref('/')
    const nav = useNarrowNav(() => path.value)
    nav.toggle()
    path.value = '/gorevler'
    await nextTick()
    expect(nav.open.value).toBe(false)
  })
})
