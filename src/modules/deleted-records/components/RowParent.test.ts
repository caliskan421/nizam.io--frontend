import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { fixtureRow } from '../__tests__/fixtures'
import type { DeletedRow } from '../model/types'
import RowParent from './RowParent.vue'

const row = (parent: DeletedRow['parent']) => fixtureRow({ parent })

describe('RowParent (ebeveyn çöpte uyarısı)', () => {
  it('ebeveyn silinmemişse ya da yoksa hiçbir şey çizilmez', () => {
    expect(
      mount(RowParent, {
        props: { row: row({ kind: 'tasks', id: 'w', name: 'A', deleted: false }) },
      }).html(),
    ).toBe('<!--v-if-->')
    expect(mount(RowParent, { props: { row: row(null) } }).html()).toBe('<!--v-if-->')
  })

  it('görev ve toplantı uyarıları; "birlikte geri yüklenir" cümlesi yok', () => {
    const task = mount(RowParent, {
      props: { row: row({ kind: 'tasks', id: 'w', name: 'Pano', deleted: true }) },
    })
    expect(task.text()).toContain('Önce bağlı görevi geri yükleyin.')
    expect(task.text()).toContain('Silinen görevlerde aç')
    const meeting = mount(RowParent, {
      props: { row: row({ kind: 'meetings', id: 'm', name: 'Toplantı', deleted: true }) },
    })
    expect(meeting.text()).toContain('Önce bağlı toplantıyı geri yükleyin.')
    expect(meeting.text()).toContain('Silinen toplantılarda aç')
    expect(task.text()).not.toContain('birlikte')
  })

  it('bağlantı yalnız bilinen tür ve okunabilir adla; tıklama open yayar', async () => {
    const unnamed = mount(RowParent, {
      props: { row: row({ kind: 'tasks', id: 'gizli', name: null, deleted: true }) },
    })
    expect(unnamed.find('button').exists()).toBe(false)
    expect(unnamed.text()).not.toContain('gizli')
    const unknown = mount(RowParent, {
      props: { row: row({ kind: null, id: 'x', name: 'Takvim', deleted: true }) },
    })
    expect(unknown.text()).toContain('Bağlı kayıt silinmiş.')
    expect(unknown.find('button').exists()).toBe(false)
    const linked = mount(RowParent, {
      props: { row: row({ kind: 'tasks', id: 'w', name: 'Pano', deleted: true }) },
    })
    await linked.get('button').trigger('click')
    expect(linked.emitted('open')).toHaveLength(1)
  })
})
