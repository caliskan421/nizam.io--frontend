import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { workItem } from '../../model/__tests__/harness'
import type { WorkItem } from '../../model/types'
import TaskRow from './TaskRow.vue'

const SubtaskBlockStub = defineComponent({
  name: 'SubtaskBlock',
  props: { item: { type: Object, required: true } },
  emits: ['openSubtasks'],
  setup:
    (_props, { emit }) =>
    () =>
      h('button', { 'data-stub': 'subtasks', onClick: () => emit('openSubtasks', 'w1') }),
})

function mountRow(over: Partial<WorkItem> = {}, props: Record<string, unknown> = {}) {
  return mount(TaskRow, {
    props: {
      item: workItem(over),
      departmentName: 'Mekanik sistemler',
      code: 'MEK',
      href: '/gorevler?gorev=w1',
      selected: false,
      expanded: false,
      today: '2026-11-09',
      ...props,
    },
    global: { stubs: { SubtaskBlock: SubtaskBlockStub } },
    attachTo: document.body,
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('görev satırı (E-03-18…29)', () => {
  it('başlık bağlantısı, kısa kod (önek + statik —), departman, durum, bitiş, kalan', () => {
    const row = mountRow({ title: 'Faz3 asfalt', status: 'devam_ediyor', end_on: '2026-11-12' })
    expect(row.get('a.rp-title').text()).toBe('Faz3 asfalt')
    expect(row.get('a.rp-title').attributes('href')).toBe('/gorevler?gorev=w1')
    expect(row.get('.task-row__code').text()).toBe('MEK-—')
    expect(row.get('.task-row__dept').text()).toBe('Mekanik sistemler')
    expect(row.get('.rp-status').text()).toBe('Devam ediyor')
    expect(row.get('.rp-dot').classes()).toContain('rp-dot--doing')
    expect(row.get('.rp-mono').text()).toBe('12.11.2026')
    expect(row.get('.task-row__note').text()).toBe('3 gün kaldı')
  })

  it('kodsuz departmanda kısa kod gösterilmez (E-03-20)', () => {
    expect(mountRow({}, { code: null }).get('.task-row__code').text()).toBe('')
  })

  it('iade_edildi satırda Geri gönderildi (rp-dot--back); gecikme kırmızı', () => {
    const row = mountRow({ status: 'iade_edildi', is_overdue: true, days_overdue: 5 })
    expect(row.get('.rp-status').text()).toBe('Geri gönderildi')
    expect(row.get('.rp-dot').classes()).toContain('rp-dot--back')
    expect(row.get('.task-row__note').classes()).toContain('rp-danger-text')
    expect(row.get('.task-row__note').text()).toBe('5 gün gecikti')
  })

  it('tamamlanmış görevde not yok', () => {
    expect(mountRow({ status: 'tamamlandi' }).find('.task-row__note').exists()).toBe(false)
  })

  it('talep etiketi + ipucu (E-03-26)', () => {
    const row = mountRow({
      end_on: '2026-09-05',
      pending_date_request: {
        request_id: 'r',
        new_start_on: '2026-09-01',
        new_end_on: '2026-11-15',
      },
    })
    const tag = row.get('.rp-reqtag')
    expect(tag.text()).toBe('Talep · 15 Kas')
    expect(tag.attributes('title')).toBe('Bitiş 05 Eyl → 15 Kas talep edildi')
  })

  it('çok atananlı yığın; null ad → Bilinmeyen kişi (G4)', () => {
    const row = mountRow({
      assignees: [
        { account_id: 'a1', full_name: 'Ayşe Yılmaz' },
        { account_id: 'a2', full_name: null },
      ],
    })
    const people = row.findAll('.task-row__person')
    expect(people.map((p) => p.attributes('aria-label'))).toEqual([
      'Ayşe Yılmaz',
      'Bilinmeyen kişi',
    ])
    expect(people[0]!.attributes('data-tip')).toBe('Ayşe Yılmaz')
    expect(people[0]!.text()).toBe('AY')
  })

  it('dört atanan: iki avatar + "+2" (kalan adlar ipucunda), sütuna sığar (E-03-27)', () => {
    const row = mountRow({
      assignees: [
        { account_id: 'a1', full_name: 'Ayşe Yılmaz' },
        { account_id: 'a2', full_name: 'Bora Kaya' },
        { account_id: 'a3', full_name: 'Can Ak' },
        { account_id: 'a4', full_name: null },
      ],
    })
    const people = row.findAll('.task-row__person')
    expect(people).toHaveLength(3)
    expect(people.slice(0, 2).map((p) => p.text())).toEqual(['AY', 'BK'])
    const more = row.get('.task-row__more')
    expect(more.text()).toBe('+2')
    expect(more.attributes('aria-label')).toBe('2 kişi daha: Can Ak, Bilinmeyen kişi')
    expect(more.attributes('data-tip')).toBe('2 kişi daha: Can Ak, Bilinmeyen kişi')
  })

  it('toplu seçim kutusu ve öncelik DOM’da yok (P7, E-03-29)', () => {
    const row = mountRow({ priority: 'acil' })
    expect(row.find('input[type="checkbox"]').exists()).toBe(false)
    expect(row.find('.rp-prio').exists()).toBe(false)
    expect(row.text()).not.toContain('Acil')
  })

  it('seçili satır rp-sel (E-03-28)', () => {
    expect(mountRow({}, { selected: true }).get('[role="row"]').classes()).toContain('rp-sel')
  })

  it('alt görev düğmesi data-has/data-done/aria-expanded; tıklama toggle yayar', async () => {
    const row = mountRow({ subtask_counts: { total: 4, done: 4 } }, { expanded: true })
    const tog = row.get('.rp-subtog')
    expect(tog.attributes()).toMatchObject({
      'data-has': 'true',
      'data-done': 'true',
      'aria-expanded': 'true',
    })
    expect(tog.text()).toBe('4/4')
    await tog.trigger('click')
    expect(row.emitted('toggle')).toHaveLength(1)
    expect(row.emitted('open')).toBeUndefined()
    // Açık blok: W44 SubtaskBlock; başlığı → paneli Alt görevler sekmesinde açar (E-03-32).
    await row.get('[data-stub="subtasks"]').trigger('click')
    expect(row.emitted('openSubtasks')).toEqual([['w1']])
  })

  it('başlık ve satır tıklaması panel açar; avatar tıklaması açmaz', async () => {
    const row = mountRow()
    await row.get('a.rp-title').trigger('click')
    await row.get('[role="row"]').trigger('click')
    await row.get('.task-row__person').trigger('click')
    expect(row.emitted('open')).toHaveLength(2)
    expect(row.find('[data-stub="subtasks"]').exists()).toBe(false)
  })
})
