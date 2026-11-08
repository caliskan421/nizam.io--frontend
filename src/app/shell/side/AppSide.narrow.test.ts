// Dar ekran (≤ 900 px) kenar menüsü: varsayılan kapalı, `narrowOpen` ile perdeli kaplama; seçim
// bekleniyorsa kaplama açtırılır (O4 görsel borç, P3 en sade).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import AppSide from './AppSide.vue'
import { createFakeLifecycle, mountWithScope, sideContext } from './__tests__/fake-lifecycle'

afterEach(() => {
  document.body.innerHTML = ''
})

const sideCss = readFileSync(resolve(process.cwd(), 'src/app/shell/side/side.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)
const narrow = sideCss.slice(sideCss.indexOf('@media (max-width: 900px)'))

async function mountSide(props: Record<string, unknown>, state = {}) {
  const ctx = await sideContext()
  const { lifecycle, store } = createFakeLifecycle(state)
  store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const wrapper = mountWithScope(ctx, lifecycle, AppSide, props)
  await flushPromises()
  return wrapper
}

describe('AppSide — dar ekran', () => {
  it('kaplama bayrağı sınıfa yansır; aria-controls hedefi kimlikli', async () => {
    const closed = await mountSide({ collapsed: false })
    const aside = closed.get('aside')
    expect(aside.attributes('id')).toBe('app-side')
    expect(aside.classes()).not.toContain('rp-side--open')
    await closed.setProps({ narrowOpen: true })
    expect(aside.classes()).toContain('rp-side--open')
  })

  it('seçim bekleniyorsa reveal yayılır; beklenmiyorsa yayılmaz', async () => {
    const idle = await mountSide({ collapsed: false })
    expect(idle.emitted('reveal')).toBeUndefined()
    const pending = await mountSide(
      { collapsed: false },
      {
        programs: [
          { programId: 'p1', name: 'Program Bir', year: null },
          { programId: 'p2', name: 'Program İki', year: null },
        ],
        status: 'selecting',
        pending: 'program',
      },
    )
    expect(pending.emitted('reveal')).toHaveLength(1)
  })

  it('CSS: ≤ 900 px menü varsayılan gizli, açıkken soldan sabit kaplama (içerik ilk ekranda)', () => {
    expect(narrow).toMatch(/\.rp-side \{\s*display: none;/)
    expect(narrow).toMatch(
      /\.rp-side\.rp-side--open \{[^}]*position: fixed;[^}]*width: var\(--rp-side-w\);/,
    )
    expect(narrow).not.toMatch(/flex-basis: 100%/)
  })
})
