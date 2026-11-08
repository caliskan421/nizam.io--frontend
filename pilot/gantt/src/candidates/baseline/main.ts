import { defineComponent, h } from 'vue'
import PilotShell from '../../common/PilotShell.vue'
import { boot } from '../../common/boot'
import { makeGantt } from '../../common/mock'

const data = makeGantt()
boot(
  'baseline',
  defineComponent({
    render: () => h(PilotShell, { title: 'Taban', taskCount: data.tasks.length }),
  }),
  'main',
)
