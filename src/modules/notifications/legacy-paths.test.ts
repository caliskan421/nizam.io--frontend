// @vitest-environment node
// "Eski yol yok" tanığı (KESİN 35d/37f; BE-144/145/146/156): canlanan satırların `designStub` kimliği ve
// istemci geçici yolları kaynakta KALMADI. Davranış (gerçek uç) testleri başka dosyalardadır; bu dosya
// yalnız silinen yolların geri gelmediğini sabitler.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('.', import.meta.url))
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path)
    return /\.(ts|vue)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : []
  })
}
const code = sources(root).map(
  (path) => [path.slice(root.length), readFileSync(path, 'utf8')] as const,
)
const strip = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('bildirim modülünde eski yol yok', () => {
  it('BE-144/146 stub kimlikleri, stubs.ts ve DesignStub kullanımı kalmadı', () => {
    expect(code.map(([name]) => name)).not.toContain('model/stubs.ts')
    for (const [name, text] of code) {
      expect(strip(text), name).not.toMatch(/AWAITING_TAB|INLINE_DECISION|designStub|DesignStub/)
      expect(strip(text), name).not.toMatch(/BE-14[46]\b/)
    }
  })

  it('"Okunmamış" sekmesinde istemci süzgeci yok (sunucu `unread_only`)', () => {
    for (const [name, text] of code) {
      expect(strip(text), name).not.toMatch(
        /\.filter\(\s*\(?\s*\w+\s*\)?\s*=>\s*!\w+\.is_read\s*\)/,
      )
    }
  })

  it('"Yakında" yer tutucusu ve 30 gün saklama iddiası metinde yok', () => {
    const text = readFileSync(join(root, '../../shared/i18n/tr/notifications.ts'), 'utf8')
    expect(text).not.toMatch(/Yakında|30 gün/)
  })

  it('sohbet satırı istemcide okundu işaretlenmez: activate sohbet hedefinde markOne çağırmaz', () => {
    const writes = strip(readFileSync(join(root, 'components/use-panel-writes.ts'), 'utf8'))
    expect(writes).toMatch(/target\?\.route !== 'collaboration\.chat'/)
  })
})
