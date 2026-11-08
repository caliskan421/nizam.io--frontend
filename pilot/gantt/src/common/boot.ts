import '../../../../src/shared/tokens/tokens.gen.css'
import { createApp, type Component } from 'vue'
import { measureFirstRender } from './state'

/** Ortak başlatma: kabuk + aday tek Vue uygulaması; ilk çizim ölçümü bağlamadan iki kareye. */
export function boot(candidate: string, root: Component, scrollSelector: string): void {
  void measureFirstRender(candidate, scrollSelector, () => {
    createApp(root).mount('#app')
  })
}
