import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, nextTick, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'

import { fixtureRow } from '../__tests__/fixtures'
import type { DeletedRow } from '../model/types'
import { useSelection } from './use-selection'

const row = (id: string): DeletedRow => fixtureRow({ id, key: `tasks:${id}` })
const k = (id: string) => `tasks:${id}`

function setup(initial: string[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const rows = ref<DeletedRow[]>(initial.map(row))
  const key = ref('a')
  let selection!: ReturnType<typeof useSelection>
  const app = createApp(
    defineComponent({
      setup() {
        selection = useSelection(
          () => rows.value,
          () => key.value,
        )
        return () => null
      },
    }),
  )
  app.use(pinia).mount(document.createElement('div'))
  return { selection, rows, key, app }
}

beforeEach(() => document.body.replaceChildren())

describe('useSelection (BE-114)', () => {
  it('toggle ekler/çıkarır; selectedRows yüklenen satırlardan; tümünü seç tri-state', () => {
    const { selection, app } = setup(['w1', 'w2', 'w3'])
    selection.toggle(k('w1'))
    expect(selection.count.value).toBe(1)
    expect(selection.some.value).toBe(true)
    expect(selection.allSelected.value).toBe(false)
    selection.toggleAll()
    expect(selection.selectedRows.value.map((r) => r.id)).toEqual(['w1', 'w2', 'w3'])
    expect(selection.allSelected.value).toBe(true)
    expect(selection.some.value).toBe(false)
    selection.toggleAll()
    expect(selection.count.value).toBe(0)
    selection.toggle(k('w2'))
    selection.toggle(k('w2'))
    expect(selection.count.value).toBe(0)
    app.unmount()
  })

  it('aynı kimlik iki türde çakışmaz; bilinmeyen tür satırı seçilemez ve toplamı bozmaz', () => {
    const { selection, rows, app } = setup([])
    rows.value = [
      fixtureRow({ id: '7', key: 'files:7', kind: 'files', rawKind: 'files' }),
      fixtureRow({ id: '7', key: 'subtasks:7', kind: 'subtasks', rawKind: 'subtasks' }),
      fixtureRow({ id: 'z', key: 'calendar_events:z', kind: null, rawKind: 'calendar_events' }),
    ]
    selection.toggle('files:7')
    expect(selection.selectedRows.value.map((r) => r.key)).toEqual(['files:7'])
    selection.toggleAll()
    expect(selection.selectedRows.value.map((r) => r.key)).toEqual(['files:7', 'subtasks:7'])
    expect(selection.allSelected.value).toBe(true)
    app.unmount()
  })

  it('boş listede tümünü seç hiçbir şey seçmez', () => {
    const { selection, app } = setup([])
    selection.toggleAll()
    expect(selection.count.value).toBe(0)
    expect(selection.allSelected.value).toBe(false)
    app.unmount()
  })

  it('liste yenilenince listede olmayan kimlikler düşer', async () => {
    const { selection, rows, app } = setup(['w1', 'w2'])
    selection.toggleAll()
    rows.value = [row('w2')]
    await nextTick()
    expect([...selection.ids.value]).toEqual([k('w2')])
    app.unmount()
  })

  it('sıfırlama anahtarı, kapsam ve oturum değişince seçim temizlenir; aynı değer sıfırlamaz', async () => {
    const { selection, key, app } = setup(['w1'])
    selection.toggle(k('w1'))
    key.value = 'a'
    await nextTick()
    expect(selection.count.value).toBe(1)
    key.value = 'b'
    await nextTick()
    expect(selection.count.value).toBe(0)
    selection.toggle(k('w1'))
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    expect(selection.count.value).toBe(0)
    app.unmount()
  })

  it('keepOnly yalnız verilen ve seçili kimlikleri bırakır', () => {
    const { selection, app } = setup(['w1', 'w2', 'w3'])
    selection.toggleAll()
    selection.keepOnly([k('w2'), 'zz'])
    expect([...selection.ids.value]).toEqual([k('w2')])
    app.unmount()
  })
})
