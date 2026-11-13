import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { COORD_SEARCH_DEBOUNCE_MS, useCoordControls } from './use-coord-controls'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const scope = effectScope()
  const key = ref('p1')
  const controls = scope.run(() => useCoordControls(() => key.value))!
  return { scope, key, controls }
}

describe('koordinatörlük yerel durumu (mekanizma §3)', () => {
  it('varsayılanlar: arama boş, süzgeç Tümü, ölçüt Gecikme, ters değil', () => {
    const { controls, scope } = setup()
    expect([controls.text.value, controls.query.value, controls.filter.value]).toEqual([
      '',
      '',
      'all',
    ])
    expect([controls.sortKey.value, controls.reversed.value]).toEqual(['late', false])
    scope.stop()
  })

  it('arama gecikmeli süzülür; hızlı yazımda yalnız son metin', async () => {
    const { controls, scope } = setup()
    controls.text.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(COORD_SEARCH_DEBOUNCE_MS - 1)
    controls.text.value = 'ab'
    await nextTick()
    vi.advanceTimersByTime(COORD_SEARCH_DEBOUNCE_MS - 1)
    expect(controls.query.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(controls.query.value).toBe('ab')
    scope.stop()
  })

  it('ölçüt seçimi ters çevirmeyi sıfırlar; ters çevirme terslenir; devre dışı ölçüt seçilmez', () => {
    const { controls, scope } = setup()
    controls.flip()
    expect(controls.reversed.value).toBe(true)
    controls.pickSort('name')
    expect([controls.sortKey.value, controls.reversed.value]).toEqual(['name', false])
    controls.pickSort('last_upload')
    expect(controls.sortKey.value).toBe('name')
    controls.flip()
    controls.flip()
    expect(controls.reversed.value).toBe(false)
    scope.stop()
  })

  it('kapsam değişince hepsi sıfırlanır ve bekleyen gecikme iptal edilir (K2, KESİN 26a)', async () => {
    const { controls, key, scope } = setup()
    controls.text.value = 'altyapı'
    controls.filter.value = 'late'
    controls.pickSort('name')
    await nextTick()
    key.value = 'p2'
    await nextTick()
    await nextTick()
    expect(controls.text.value).toBe('')
    expect([controls.filter.value, controls.sortKey.value]).toEqual(['all', 'late'])
    vi.advanceTimersByTime(COORD_SEARCH_DEBOUNCE_MS * 2)
    expect(controls.query.value).toBe('')
    scope.stop()
  })

  it('sahip sökülünce bekleyen gecikme iptal edilir: sonradan süzme yok', async () => {
    const { controls, scope } = setup()
    controls.text.value = 'x'
    await nextTick()
    scope.stop()
    vi.advanceTimersByTime(COORD_SEARCH_DEBOUNCE_MS * 2)
    expect(controls.query.value).toBe('')
  })
})
