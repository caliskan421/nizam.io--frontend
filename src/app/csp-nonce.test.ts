import { afterEach, describe, expect, it } from 'vitest'

import { readCspNonce } from '@/app/csp-nonce'

function withMeta(content: string | null): void {
  document.head.innerHTML = ''
  if (content === null) return
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'csp-nonce')
  meta.setAttribute('content', content)
  document.head.append(meta)
}

describe('readCspNonce', () => {
  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('Caddy şablonunun yazdığı istek başı değeri döndürür', () => {
    withMeta('3f2b9c1e-6d4a-4f7b-9a51-0c8e2d7f4b10')
    expect(readCspNonce()).toBe('3f2b9c1e-6d4a-4f7b-9a51-0c8e2d7f4b10')
  })

  it('şablonlanmamış yer tutucuda nonce yoktur (vite dev/preview)', () => {
    withMeta('{{placeholder `http.request.uuid`}}')
    expect(readCspNonce()).toBeUndefined()
  })

  it('öğe yoksa veya boşsa nonce yoktur', () => {
    withMeta(null)
    expect(readCspNonce()).toBeUndefined()
    withMeta('   ')
    expect(readCspNonce()).toBeUndefined()
  })

  it('nonce karakter kümesi dışındaki değeri (ör. tırnak) kabul etmez', () => {
    withMeta(`abc" onload="x`)
    expect(readCspNonce()).toBeUndefined()
  })
})
