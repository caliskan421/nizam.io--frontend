import { describe, expect, it } from 'vitest'

import { useConflictResolver } from './use-conflict'

const input = {
  base: { title: 'A', priority: 'orta' },
  draft: { title: 'C', priority: 'acil' },
  server: { title: 'B', priority: 'orta' },
  labels: { title: 'Başlık', priority: 'Öncelik' },
}

describe('useConflictResolver', () => {
  it('gerçek çakışma yoksa diyalog açılmadan boş seçim', async () => {
    const resolver = useConflictResolver()
    await expect(resolver.resolve({ ...input, draft: { priority: 'acil' } })).resolves.toEqual({})
    expect(resolver.open.value).toBe(false)
  })

  it('çakışmada diyalog açılır; seçim sözü çözer ve kapanır', async () => {
    const resolver = useConflictResolver()
    const pending = resolver.resolve(input)
    expect(resolver.open.value).toBe(true)
    expect(resolver.fields.value.map((f) => f.field)).toEqual(['title'])
    resolver.choose({ title: 'mine' })
    await expect(pending).resolves.toEqual({ title: 'mine' })
    expect(resolver.open.value).toBe(false)
  })

  it('vazgeç → null; yeni istek eskisini vazgeçle kapatır', async () => {
    const resolver = useConflictResolver()
    const first = resolver.resolve(input)
    const second = resolver.resolve(input)
    await expect(first).resolves.toBeNull()
    resolver.dismiss()
    await expect(second).resolves.toBeNull()
  })
})
