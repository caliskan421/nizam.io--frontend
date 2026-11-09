import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { subtask } from '../../model/__tests__/harness'
import type { WorkItemSubtask } from '../../model/types'
import SubtaskDates from './SubtaskDates.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function setup(s: WorkItemSubtask = subtask(), editable = true) {
  return mount(SubtaskDates, {
    props: { subtask: s, editable, open: true, busy: false },
    attachTo: document.body,
  })
}

const dated = subtask({ start_on: '2026-06-05', end_on: '2026-06-10' })

describe('SubtaskDates (E-03-34)', () => {
  it('yuva etiketi "GG Aaa – GG Aaa" ya da "Tarih yok"; açılır role=dialog', () => {
    expect(setup(dated).get('[data-testid="subtask-dates"]').text()).toBe('05 Haz – 10 Haz')
    const empty = setup()
    expect(empty.get('[data-testid="subtask-dates"]').text()).toBe('Tarih yok')
    expect(empty.get('[role="dialog"]').attributes('aria-label')).toBe('Alt görev tarihleri')
  })

  it('değer değişiminde yazma yok; "Tamam" tek yazma ve kapanır', async () => {
    const w = setup(dated)
    await w.get('[data-testid="subtask-end"]').setValue('2026-06-12')
    expect(w.emitted('save')).toBeUndefined()
    expect(w.get('[data-testid="subtask-end"]').attributes('min')).toBe('2026-06-05')
    await w.get('[data-testid="subtask-dates-ok"]').trigger('click')
    expect(w.emitted('save')).toEqual([[{ start_on: '2026-06-05', end_on: '2026-06-12' }]])
    expect(w.emitted('open')).toEqual([[false]])
  })

  it('değişiklik yoksa "Tamam" yazmaz; tek tarih → uyarı, gönderilemez', async () => {
    const w = setup(dated)
    await w.get('[data-testid="subtask-dates-ok"]').trigger('click')
    expect(w.emitted('save')).toBeUndefined()
    const fresh = setup()
    await fresh.get('[data-testid="subtask-start"]').setValue('2026-06-05')
    expect(fresh.get('[role="alert"]').text()).toBe('Başlangıç ve bitiş birlikte girilir.')
    expect(fresh.get('[data-testid="subtask-dates-ok"]').attributes('disabled')).toBeDefined()
  })

  it('"Tarihi kaldır": tarih varsa boş çift, yoksa yazma yok', async () => {
    const w = setup(dated)
    await w.get('[data-testid="subtask-dates-clear"]').trigger('click')
    expect(w.emitted('save')).toEqual([[{ start_on: '', end_on: '' }]])
    const none = setup()
    await none.get('[data-testid="subtask-dates-clear"]').trigger('click')
    expect(none.emitted('save')).toBeUndefined()
  })

  it('Esc kapatır; yetkisizde salt metin', async () => {
    const w = setup(dated)
    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('open')).toEqual([[false]])
    const ro = setup(dated, false)
    expect(ro.find('[data-testid="subtask-dates"]').exists()).toBe(false)
    expect(ro.get('[data-testid="subtask-dates-text"]').text()).toBe('05 Haz – 10 Haz')
  })
})
