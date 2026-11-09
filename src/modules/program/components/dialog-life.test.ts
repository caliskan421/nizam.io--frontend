import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ADMIN_SCOPE, harness, resetHarness } from '../__tests__/harness'
import { toTypedSchema, useDialogLife } from './dialog-life'

afterEach(() => resetHarness())

describe('pencere yaşamı', () => {
  it('tek uçuş: sürerken ikinci çağrı yok sayılır', async () => {
    const h = harness(ADMIN_SCOPE)
    const life = h.run(() => useDialogLife({ open: () => true, close: () => undefined })).result
    let release: () => void = () => undefined
    const task = vi.fn(() => new Promise<void>((r) => (release = r)))
    const first = life.once(task)
    void life.once(task)
    expect(task).toHaveBeenCalledTimes(1)
    expect(life.busy.value).toBe(true)
    release()
    await first
    expect(life.busy.value).toBe(false)
  })

  it('seçili program değişince açık pencere kapanır; sökülünce alive() false', async () => {
    const h = harness(ADMIN_SCOPE)
    const close = vi.fn()
    const { result: life, app } = h.run(() => useDialogLife({ open: () => true, close }))
    h.store.setProgram('p2')
    await h.flush()
    expect(close).toHaveBeenCalledTimes(1)
    expect(life.alive()).toBe(true)
    app.unmount()
    expect(life.alive()).toBe(false)
  })

  it('zod → vee-validate: yol başına hata listesi', async () => {
    const schema = toTypedSchema(z.object({ a: z.string().min(1, 'gerekli') }))
    await expect(schema.parse({ a: '' })).resolves.toEqual({
      errors: [{ path: 'a', errors: ['gerekli'] }],
    })
    await expect(schema.parse({ a: 'x' })).resolves.toEqual({ value: { a: 'x' }, errors: [] })
  })
})
