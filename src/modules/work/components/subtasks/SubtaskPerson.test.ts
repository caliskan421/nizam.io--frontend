import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { subtask, workItem } from '../../model/__tests__/harness'
import SubtaskPerson from './SubtaskPerson.vue'

const item = workItem({
  assignees: [
    { account_id: 'acc-1', full_name: 'Ayşe' },
    { account_id: 'acc-2', full_name: null },
  ],
})

function setup(editable = true, s = subtask({ assignee_account_id: 'acc-1' })) {
  return mount(SubtaskPerson, { props: { item, subtask: s, editable, busy: false } })
}

describe('SubtaskPerson (E-03-33)', () => {
  it('seçenekler: "Kişi yok" + YALNIZ ana göreve atananlar ("Bilinmeyen kişi"); zorunluluk işareti yok', () => {
    const w = setup()
    expect(w.findAll('option').map((o) => o.text())).toEqual([
      'Kişi yok',
      'Ayşe',
      'Bilinmeyen kişi',
    ])
    expect(w.find('[data-req]').exists()).toBe(false)
  })

  it('seçim değişikliği yayılır, select sunucu değerinde kalır (iyimser değil)', async () => {
    const w = setup()
    const select = w.get<HTMLSelectElement>('select')
    await select.setValue('acc-2')
    expect(w.emitted('change')).toEqual([['acc-2']])
    expect(select.element.value).toBe('acc-1')
    await select.setValue('')
    expect(w.emitted('change')?.[1]).toEqual([''])
  })

  it('yetkisizde salt metin', () => {
    const w = setup(false, subtask())
    expect(w.find('select').exists()).toBe(false)
    expect(w.get('[data-testid="subtask-person-text"]').text()).toBe('Kişi yok')
  })
})
