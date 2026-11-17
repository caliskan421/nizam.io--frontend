// F8 canlıya alma ↔ kayıt bütünlüğü (KESİN 35, W176 O3 senaryo 2). `design-stub.test.ts` bağlandı
// satırının kodda stub bırakmadığını denetler; bu dosya ters yönü ve kayıt biçimini denetler:
//  - `bağlandı (pin v0.23.0-api, F8 W17x)` satırı biçimi ve yalnız W171–W175;
//  - Durumu `açık` kalan F8 satırı (kısmi) kalan boşluğu GAP/BE kimliğiyle yazar;
//  - kodda stub'ı süren her kimlik kayıtta `açık`/`backend'de` (design-stub.test.ts) VE canlıya alınmış
//    satırın "tam" sayılan kısmına ait bir stub kodda yoktur;
//  - matrisin `tam` dediği satır, kayıtta `bağlandı` ya da açıkça kısmi (kalan boşluk yazılı) olur.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { collectSources, parseRegistry, scanSource, statusOf } from './design-stub-registry'

const REGISTRY = readFileSync('docs/backend-eksikleri/kayit.md', 'utf8')
const MATRIX = readFileSync('docs/yurutme/web-8/canliya-alma-matrisi.md', 'utf8')
const F9_MATRIX = readFileSync('docs/yurutme/web-9/canliya-alma-matrisi.md', 'utf8')

interface Cells {
  id: string
  bag: string
  status: string
}

function cells(): Cells[] {
  const out: Cells[] = []
  for (const line of REGISTRY.split('\n')) {
    if (!line.startsWith('| BE-')) continue
    const c = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
    out.push({ id: c[0]!.trim(), bag: c[6]!.trim(), status: c[8]!.trim() })
  }
  return out
}

function matrixDecisions(): Map<string, string> {
  const out = new Map<string, string>()
  for (const line of MATRIX.split('\n')) {
    const m = /^\| M-\w+ \| (BE-\d{3}) \|/.exec(line)
    if (!m) continue
    const decision = /\*\*(tam|kısmi|yok)\*\*/.exec(line)?.[1]
    if (decision) out.set(m[1]!, decision)
  }
  return out
}

/** F8'de yok olan bir iş, yalnız sonraki fazın tam matris kanıtı ve stub yokluğuyla kapanır. */
function laterBoundAllowed(
  id: string,
  status: string,
  stubs: Set<string>,
  matrix: string,
): boolean {
  const match = /^bağlandı \(pin v(\d+)\.(\d+)\.(\d+)-api, F9 W18\d+[a-z]?\)$/.exec(status)
  if (!match || stubs.has(id)) return false
  // F9 matrisi v0.25 etiketiyle hazırlanmıştır; bugünkü api-pin'e bağlı değildir.
  if (match[1] !== '0' || match[2] !== '25' || match[3] !== '0') return false
  return matrix.split('\n').some((line) => {
    const first = /^\|\s*(BE-\d{3})(?:\s+\([^|()]+\))?\s*\|/.exec(line)
    return first?.[1] === id && /\| tam (?:\([^|]*\) )?\|/.test(line)
  })
}

const stubIds = (): Set<string> => {
  const ids = new Set<string>()
  for (const file of collectSources('.')) {
    if (/\.test\.ts$/.test(file.path)) continue
    for (const use of scanSource(file).uses) ids.add(use.id)
  }
  return ids
}

describe('F8 kayıt ↔ kod bütünlüğü', () => {
  it('bağlandı (pin v0.23.0-api, F8 W17x): biçim sabit, işçi W171–W175, kodda stub yok', () => {
    const stubs = stubIds()
    const bound = cells().filter((c) => c.status.startsWith('bağlandı (pin v0.23.0-api'))
    expect(bound.length).toBeGreaterThanOrEqual(35)
    for (const row of bound) {
      expect(row.status, row.id).toMatch(
        /^bağlandı \(pin v0\.23\.0-api, F8 W17[1-5](\/W17[1-5])?\)$/,
      )
      expect(statusOf({ ...row, phase: '', size: '', current: '' }), row.id).toBe('bağlandı')
      expect(stubs.has(row.id), `${row.id} bağlandı ama kodda stub var`).toBe(false)
    }
  })

  it('F8 canlıya alma notu olup Durumu açık kalan satır: kalan boşluk GAP/BE kimliğiyle yazılı', () => {
    const partial = cells().filter(
      (c) =>
        /F8 (canlıya alma|W17[1-5])|\(F8 W17[1-5]\)/.test(c.bag) &&
        !c.status.startsWith('bağlandı'),
    )
    expect(partial.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        'BE-018',
        'BE-025',
        'BE-110',
        'BE-115',
        'BE-123',
        'BE-127',
        'BE-136',
      ]),
    )
    for (const row of partial) {
      expect(row.bag, `${row.id}: kısmi satır "kalan" yazmalı`).toMatch(/kalan|kısmen|kısmi/)
      expect(row.bag, `${row.id}: kalan boşluk kimliği`).toMatch(/GAP-\d{3}|BE-\d{3}|ADR-\d{4}/)
    }
  })

  it('matris "tam" satırı kayıtta bağlandı ya da kalanı yazılı kısmi satırdır (kayıtsız tam yok)', () => {
    const registry = parseRegistry(REGISTRY)
    const byId = new Map(cells().map((c) => [c.id, c]))
    const full = [...matrixDecisions()].filter(([, d]) => d === 'tam').map(([id]) => id)
    expect(full.length).toBeGreaterThanOrEqual(30)
    for (const id of full) {
      const row = byId.get(id)
      expect(registry.has(id), `${id} kayıtta yok`).toBe(true)
      if (row!.status.startsWith('bağlandı')) continue
      expect(row!.bag, `${id}: matris tam, kayıt bağlandı değil ve kalan yazılı değil`).toMatch(
        /kalan|kısmen/,
      )
    }
  })

  it('matris "yok" satırının stub kimliği kodda kalır (yanlışlıkla bağlandı yapılmamış)', () => {
    const stubs = stubIds()
    const byId = new Map(cells().map((c) => [c.id, c]))
    for (const [id, decision] of matrixDecisions()) {
      if (decision !== 'yok') continue
      const status = byId.get(id)?.status ?? ''
      if (status.startsWith('bağlandı')) {
        expect(
          laterBoundAllowed(id, status, stubs, F9_MATRIX),
          `${id} yok ama geçerli sonraki faz kanıtı yok`,
        ).toBe(true)
      }
    }
    // Kodda süren stub kimliklerinin hiçbiri bağlandı satırı değildir (design-stub.test.ts'in ters yüzü).
    for (const id of stubs) {
      expect(byId.get(id)?.status.startsWith('bağlandı') ?? false, id).toBe(false)
    }
  })
})

describe('F8 yok sonrası bağlanma kanıtı', () => {
  const id = 'BE-081'
  const matrix = '| BE-081 | E-10 | v0.25 | tam | yüzey | kanıt |'
  const status = 'bağlandı (pin v0.25.0-api, F9 W183)'
  it('sonraki faz tam ve stub yoksa geçer; daha sonra pin değişmesi sonucu değiştirmez', () => {
    expect(laterBoundAllowed(id, status, new Set(), matrix)).toBe(true)
  })
  it('yüzey ekli BE-027 ve nitelikli tam kararı tanır', () => {
    const f9 = '| BE-027 (liste yüzü) | E-10-16 | v0.25 | tam (+W184) | yüzey | kanıt |'
    expect(laterBoundAllowed('BE-027', status.replace('W183', 'W185'), new Set(), f9)).toBe(true)
    expect(
      laterBoundAllowed(
        'BE-027',
        status.replace('W183', 'W185'),
        new Set(),
        f9.replace('| tam (+W184) |', '| kalır |'),
      ),
    ).toBe(false)
  })
  it.each(['v0.23.0', 'v0.22.0', 'v0.24.9'])('aynı/eski pin %s reddedilir', (pin) => {
    expect(laterBoundAllowed(id, status.replace('v0.25.0', pin), new Set(), matrix)).toBe(false)
  })
  it('kalır veya eksik matris ve kalan stub reddedilir', () => {
    expect(laterBoundAllowed(id, status, new Set(), matrix.replace('| tam |', '| kalır |'))).toBe(
      false,
    )
    expect(laterBoundAllowed(id, status, new Set(), '')).toBe(false)
    expect(laterBoundAllowed(id, status, new Set([id]), matrix)).toBe(false)
  })
})
