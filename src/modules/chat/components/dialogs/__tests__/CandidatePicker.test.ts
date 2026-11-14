import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CandidatePicker from '../CandidatePicker.vue'

const candidates = [
  { account_id: 'u1', full_name: 'Ayşe Yılmaz' },
  { account_id: 'u2', full_name: 'Can Demir' },
  { account_id: 'me', full_name: 'Ben' },
]

function make(props: Record<string, unknown> = {}) {
  return mount(CandidatePicker, { props: { candidates, label: 'Ara…', ...props } })
}

describe('CandidatePicker', () => {
  it('kendisi satırlarda yok; arama ada göre süzer; eşleşme yoksa ipucu', async () => {
    const w = make({ excludeId: 'me' })
    expect(w.findAll('.chat-dlg-row')).toHaveLength(2)
    await w.find('input').setValue('CAN')
    expect(w.findAll('.chat-dlg-row')).toHaveLength(1)
    await w.find('input').setValue('yok')
    expect(w.find('[data-testid="chat-picker-empty"]').text()).toBe('Eşleşen kişi yok')
    expect(w.find('[data-testid="chat-picker-list"]').exists()).toBe(false)
  })

  it('tekli kip: tık "pick" yayar, aria-pressed yok', async () => {
    const w = make()
    await w.findAll('.chat-dlg-row')[1]!.trigger('click')
    expect(w.emitted('pick')).toEqual([['u2']])
    expect(w.findAll('.chat-dlg-row')[0]!.attributes('aria-pressed')).toBeUndefined()
  })

  it('çoklu kip: toggle, aria-pressed, çip + "‹Ad› çıkar"', async () => {
    const w = make({ multi: true, selected: ['u1'] })
    expect(w.findAll('.chat-dlg-row')[0]!.attributes('aria-pressed')).toBe('true')
    expect(w.findAll('.chat-dlg-row')[1]!.attributes('aria-pressed')).toBe('false')
    const remove = w.find('.t-chip__x')
    expect(remove.attributes('aria-label')).toBe('Ayşe Yılmaz çıkar')
    await remove.trigger('click')
    await w.findAll('.chat-dlg-row')[1]!.trigger('click')
    expect(w.emitted('toggle')).toEqual([['u1'], ['u2']])
  })

  it('kesilmiş liste notu', () => {
    expect(make({ truncated: true }).find('[data-testid="chat-picker-truncated"]').text()).toBe(
      'Liste ilk 200 kişiyle sınırlı',
    )
    expect(make().find('[data-testid="chat-picker-truncated"]').exists()).toBe(false)
  })

  it('liste yokken aria-controls verilmez (KESİN 27)', () => {
    const w = make({ candidates: [] })
    expect(w.html()).not.toContain('aria-controls')
  })
})
