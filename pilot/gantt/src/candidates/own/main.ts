import { defineComponent, h } from 'vue'
import PilotShell from '../../common/PilotShell.vue'
import { boot } from '../../common/boot'
import { makeGantt } from '../../common/mock'
import { pilot } from '../../common/state'
import OwnGantt from './OwnGantt.vue'

const data = makeGantt()
const Root = defineComponent({
  render: () =>
    h(PilotShell, { title: 'Kendi SVG', taskCount: data.tasks.length }, () =>
      h(OwnGantt, { gantt: data, scale: pilot.scale }),
    ),
})
boot('own', Root, '.og')
