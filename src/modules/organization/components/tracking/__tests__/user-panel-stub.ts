// Komşu O2b bileşeni `UserPanel` (W75) taslağı — sözleşme adı ve prop/emit imzasıyla (TASLAK).
import { defineComponent, h } from 'vue'

export const UserPanelStub = defineComponent({
  name: 'UserPanel',
  props: { accountId: { type: String, required: true }, embedded: Boolean },
  emits: ['close', 'deleted'],
  setup:
    (p, { emit }) =>
    () =>
      h('div', {
        'data-user-panel': p.accountId,
        'data-embedded': String(p.embedded),
        onClick: () => emit('deleted', p.accountId),
      }),
})
