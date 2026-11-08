import { describe, expect, it } from 'vitest'

import { rovingTarget } from './roving'

function buttons(disabled: number[] = []): HTMLButtonElement[] {
  document.body.innerHTML = ''
  return [0, 1, 2].map((i) => {
    const b = document.createElement('button')
    b.disabled = disabled.includes(i)
    document.body.append(b)
    return b
  })
}

const key = (k: string) => new KeyboardEvent('keydown', { key: k, cancelable: true })

describe('rovingTarget', () => {
  it('ileri/geri sarar, Home/End uçlara gider, devre dışı atlanır', () => {
    const [a, b, c] = buttons([1])
    a!.focus()
    expect(rovingTarget(key('ArrowRight'), [a!, b!, c!], 'horizontal')).toBe(c)
    expect(rovingTarget(key('ArrowRight'), [a!, b!, c!], 'horizontal')).toBe(a)
    expect(rovingTarget(key('ArrowLeft'), [a!, b!, c!], 'horizontal')).toBe(c)
    expect(rovingTarget(key('Home'), [a!, b!, c!], 'horizontal')).toBe(a)
    expect(rovingTarget(key('End'), [a!, b!, c!], 'horizontal')).toBe(c)
    expect(document.activeElement).toBe(c)
  })

  it('eksen dışı tuş işlenmez; işlenen tuşta varsayılan engellenir', () => {
    const items = buttons()
    items[0]!.focus()
    const right = key('ArrowRight')
    expect(rovingTarget(right, items, 'vertical')).toBeNull()
    expect(right.defaultPrevented).toBe(false)
    const down = key('ArrowDown')
    expect(rovingTarget(down, items, 'vertical')).toBe(items[1])
    expect(down.defaultPrevented).toBe(true)
  })

  it('hepsi devre dışıysa hiçbir şey yapmaz', () => {
    expect(rovingTarget(key('ArrowDown'), buttons([0, 1, 2]), 'vertical')).toBeNull()
  })
})
