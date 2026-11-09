import { describe, expect, it } from 'vitest'

import { isListTruncated, unwrapList } from './truncation'

function result(body: object, truncated?: string) {
  const headers = new Headers(truncated ? { 'X-Result-Truncated': truncated } : {})
  return Promise.resolve({ data: body, response: new Response(null, { status: 200, headers }) })
}

describe('unwrapList (X-Result-Truncated)', () => {
  it('kesilmemiş yanıt şekli değişmez', async () => {
    const data = await unwrapList(result({ departments: [] }))
    expect(data).toEqual({ departments: [] })
    expect(isListTruncated(data)).toBe(false)
  })

  it('kesilmiş yanıt truncated: true taşır', async () => {
    const data = await unwrapList(result({ departments: [] }, 'true'))
    expect(data).toEqual({ departments: [], truncated: true })
    expect(isListTruncated(data)).toBe(true)
  })

  it('başlık "false" ya da veri yok → kesilmemiş', async () => {
    expect(isListTruncated(await unwrapList(result({ members: [] }, 'false')))).toBe(false)
    expect(isListTruncated(undefined)).toBe(false)
    expect(isListTruncated(null)).toBe(false)
  })
})
