import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { workItem } from '../../model/__tests__/harness'
import type { WorkActorFacts } from '../../model/capabilities'
import { CHILD_STUBS, FACTS } from './__tests__/fixtures'
import DetailStatus from './DetailStatus.vue'

function mountStatus(facts: WorkActorFacts, status = workItem().status) {
  return mount(DetailStatus, {
    props: { item: workItem({ status }), facts },
    global: { stubs: CHILD_STUBS },
  })
}

describe('durum yeri (E-03-44) — capability s.141/s.142', () => {
  it.each([
    ['yönetici (tek başına)', FACTS.admin, false],
    ['koordinatör', FACTS.coordinator, true],
    ['atanmış üye', FACTS.assignedMember, true],
    ['atanmamış üye', FACTS.member, false],
    ['yönetici + koordinatör (P1: yetki birleşir)', { ...FACTS.admin, coordinator: true }, true],
  ])('%s → durum seçici: %s', (_name, facts, menu) => {
    const wrapper = mountStatus(facts)
    expect(wrapper.findComponent({ name: 'StatusMenu' }).exists()).toBe(menu)
    expect(wrapper.find('[data-testid="status-readonly"]').exists()).toBe(!menu)
  })

  it('salt okunur etiket: nokta + durum adı + "salt okunur"; iade_edildi = Geri gönderildi', () => {
    const wrapper = mountStatus(FACTS.admin, 'iade_edildi')
    const label = wrapper.get('[data-testid="status-readonly"]')
    expect(label.get('.rp-dot').classes()).toContain('rp-dot--back')
    expect(label.text()).toContain('Geri gönderildi')
    expect(label.text()).toContain('salt okunur')
  })

  it('StatusMenu requestEvidence → requestEvidence (E-03-58 → E-03-52)', () => {
    const wrapper = mountStatus(FACTS.coordinator)
    wrapper.findComponent({ name: 'StatusMenu' }).vm.$emit('requestEvidence')
    expect(wrapper.emitted('requestEvidence')).toHaveLength(1)
  })
})
