// F8 canlıya alma ↔ kayıt bütünlüğü (KESİN 35, W176 O3 senaryo 2). `design-stub.test.ts` bağlandı
// satırının kodda stub bırakmadığını denetler; bu dosya ters yönü ve kayıt biçimini denetler:
//  - `bağlandı (pin v0.23.0-api, F8 W17x)` satırı biçimi ve yalnız W171–W175;
//  - Durumu `açık` kalan F8 satırı (kısmi) kalan boşluğu GAP/BE kimliğiyle yazar;
//  - kodda stub'ı süren her kimlik kayıtta `açık`/`backend'de` (design-stub.test.ts) VE canlıya alınmış
//    satırın "tam" sayılan kısmına ait bir stub kodda yoktur;
//  - matrisin `tam` dediği satır, kayıtta `bağlandı` ya da açıkça kısmi (kalan boşluk yazılı) olur.
import { existsSync, readFileSync } from 'node:fs'

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

/**
 * F10 W193'te kapanan silinenler satırları (v0.26.0-api). BE-076 (arşiv son stub'ı), BE-075/077/165
 * W194 kümesindedir; BE-069/112 ürün kararıyla vazgeçilmiştir (bu kümede DEĞİLDİR).
 */
const F10_W193_CLOSED = new Set(['BE-109', 'BE-110', 'BE-111', 'BE-115', 'BE-163'])

/** F10 W194 (arşiv taşıma/arama/dosya çöpü): `bağlandı (pin v0.26.0-api, F10 W194)` yalnız bu dört satıra. */
const F10_W194_CLOSED = new Set(['BE-075', 'BE-076', 'BE-077', 'BE-165'])
/** P45 ürün kararıyla vazgeçilen satırlar: kodda stub yok ve `vazgeçildi (P45: …, F10 W194)` gerekçeli. */
const F10_W194_WAIVED = new Set(['BE-069', 'BE-112'])
const F10_W194_BOUND = 'bağlandı (pin v0.26.0-api, F10 W194)'
const F10_W194_WAIVER = /^vazgeçildi \(P45: [^)]+, F10 W194\)$/
/** Kapanış kanıtı olarak depoda var olması gereken gerçek test dosyaları (yoksa kapanış sahte). */
const F16_AUDIT_BOUND = 'bağlandı (pin v0.28.0-api, F16)'
const F16_AUDIT_IDS = new Set([
  'BE-007',
  'BE-010',
  'BE-015',
  'BE-030',
  'BE-087',
  'BE-088',
  'BE-089',
  'BE-090',
  'BE-091',
  'BE-092',
])
const F16_AUDIT_EVIDENCE = [
  'docs/yurutme/web-16/README.md',
  'src/modules/audit/pages/AuditHistoryPage.test.ts',
  'src/modules/home/components/RecentActivity.test.ts',
  'src/modules/work/components/detail/DetailTimeline.test.ts',
]
const F15_FULLSCREEN_BOUND = 'bağlandı (pin v0.28.0-api, F15 E-06-50)'
const F15_FULLSCREEN_EVIDENCE = [
  'docs/yurutme/web-15/referans/Arsiv-Tam-Ekran-Onizleme.html',
  'docs/yurutme/web-15/referans/Arsiv-Onizleme-Notlar.dc.html',
  'src/modules/archive/components/files/FileGrid.thumbnails.test.ts',
  'src/modules/archive/components/preview/FullFilePreview.test.ts',
  'src/modules/archive/pages/folder/use-full-preview-history.test.ts',
]
const F10_W194_EVIDENCE: Readonly<Record<string, readonly string[]>> = {
  'BE-075': ['src/app/__tests__/integration/archive-move.test.ts'],
  'BE-077': ['src/app/__tests__/integration/archive-search-scope.test.ts'],
  'BE-076': [],
  'BE-165': [],
}

/** F8'de yok olan bir iş, yalnız sonraki fazın tam matris kanıtı ve stub yokluğuyla kapanır. */
function laterBoundAllowed(
  id: string,
  status: string,
  stubs: Set<string>,
  matrix: string,
): boolean {
  if (status === F16_AUDIT_BOUND) {
    return F16_AUDIT_IDS.has(id) && !stubs.has(id) && F16_AUDIT_EVIDENCE.every(existsSync)
  }
  if (status === F15_FULLSCREEN_BOUND) {
    return id === 'BE-026' && !stubs.has(id) && F15_FULLSCREEN_EVIDENCE.every(existsSync)
  }
  // F10 W193: kapanış kodda kimlikli stub kalmamasıyla ve sabit satır kümesiyle sınırlıdır.
  if (/^bağlandı \(pin v0\.26\.0-api, F10 W193\)$/.test(status)) {
    return F10_W193_CLOSED.has(id) && !stubs.has(id)
  }
  // F10 W194: sabit dört satır, kodda stub yok ve kanıt dosyaları depoda var (kayıt sözüne güvenilmez).
  if (status === F10_W194_BOUND) {
    return (
      F10_W194_CLOSED.has(id) &&
      !stubs.has(id) &&
      (F10_W194_EVIDENCE[id] ?? []).every((path) => existsSync(path))
    )
  }
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
      expect.arrayContaining(['BE-018', 'BE-025', 'BE-123', 'BE-127', 'BE-136']),
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

describe('BE-026 F8 geçmişi ve F15 bağlama', () => {
  it('F8 kapsamı yok olarak kalır ve F15 kanıtı yalnız BE-026 kapanışını destekler', () => {
    expect(matrixDecisions().get('BE-026')).toBe('yok')
    const row = cells().find((entry) => entry.id === 'BE-026')
    expect(row?.status).toBe(F15_FULLSCREEN_BOUND)
    expect(row?.bag).toMatch(/GAP-233.*getFileThumbnail.*v0\.27.*F15 v0\.28.*06e/)
    expect(parseRegistry(REGISTRY).get('BE-026')?.current).toMatch(
      /E-06-41\/42.*JPEG küçük resmi.*E-06-50 erişim denetimli tam ekran/,
    )
    expect(laterBoundAllowed('BE-026', F15_FULLSCREEN_BOUND, stubIds(), '')).toBe(true)
    expect(laterBoundAllowed('BE-024', F15_FULLSCREEN_BOUND, new Set(), '')).toBe(false)
    expect(laterBoundAllowed('BE-026', F15_FULLSCREEN_BOUND, new Set(['BE-026']), '')).toBe(false)
  })
})

describe('F16 audit bağlama', () => {
  it('yalnız on audit kaydı bağlanır, F8 rol kapsamı kararı tarihsel kalır', () => {
    expect(matrixDecisions().get('BE-091')).toBe('yok')
    const stubs = stubIds()
    const bound = cells().filter((row) => row.status === F16_AUDIT_BOUND)
    expect(new Set(bound.map((row) => row.id))).toEqual(F16_AUDIT_IDS)
    for (const id of F16_AUDIT_IDS) {
      expect(laterBoundAllowed(id, F16_AUDIT_BOUND, stubs, ''), id).toBe(true)
    }
    expect(laterBoundAllowed('BE-018', F16_AUDIT_BOUND, stubs, '')).toBe(false)
    expect(laterBoundAllowed('BE-091', F16_AUDIT_BOUND, new Set(['BE-091']), '')).toBe(false)
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

describe('F10 W193 kapanışı: silinenler satırları', () => {
  const rows = () => cells().filter((c) => F10_W193_CLOSED.has(c.id))

  it('BE-109/110/111/115/163 bağlandı (pin v0.26.0-api, F10 W193); tarihsel F8 notu silinmez', () => {
    expect(rows().map((c) => c.id)).toEqual(['BE-109', 'BE-110', 'BE-111', 'BE-115', 'BE-163'])
    for (const row of rows()) {
      expect(row.status, row.id).toBe('bağlandı (pin v0.26.0-api, F10 W193)')
      expect(row.bag, row.id).toContain('F10 canlıya alma (W193)')
    }
    const history = (id: string) => rows().find((c) => c.id === id)!.bag
    expect(history('BE-110')).toContain('F8 W174')
    expect(history('BE-115')).toContain('F8 W174')
    expect(history('BE-163')).toContain('F8 W174')
  })

  it('bu satırların kimliği kodda stub olarak kalmaz; BE-076 W194 kümesine geçmiştir (W193 kapanışı değil)', () => {
    const stubs = stubIds()
    for (const id of F10_W193_CLOSED) expect(stubs.has(id), `${id} stub kaldı`).toBe(false)
    const be076 = cells().find((c) => c.id === 'BE-076')!
    expect(F10_W193_CLOSED.has('BE-076')).toBe(false)
    expect(be076.status).not.toContain('F10 W193')
  })

  it('kapsam dışı satırlar bu W ile kapanmaz (BE-075, BE-077, BE-069, BE-112, BE-165)', () => {
    for (const id of ['BE-075', 'BE-077', 'BE-069', 'BE-112', 'BE-165']) {
      const row = cells().find((c) => c.id === id)!
      expect(row.status, id).not.toContain('F10 W193')
    }
  })

  it('F10 kapanış kuralı yalnız sabit kümeyi ve stub yokluğunu kabul eder', () => {
    const status = 'bağlandı (pin v0.26.0-api, F10 W193)'
    expect(laterBoundAllowed('BE-110', status, new Set(), '')).toBe(true)
    expect(laterBoundAllowed('BE-110', status, new Set(['BE-110']), '')).toBe(false)
    expect(laterBoundAllowed('BE-076', status, new Set(), '')).toBe(false)
    expect(laterBoundAllowed('BE-109', 'bağlandı (pin v0.26.0-api, F10 W194)', new Set(), '')).toBe(
      false,
    )
  })
})

describe('F10 W194 kapanışı: arşiv satırları', () => {
  const byId = () => new Map(cells().map((c) => [c.id, c]))

  it('BE-075/076/077/165 yalnız bu W için bağlandı; sabit dört satır, W193 beş satırdan ayrı', () => {
    const bound = cells().filter((c) => c.status === F10_W194_BOUND)
    expect(bound.map((c) => c.id)).toEqual(['BE-075', 'BE-076', 'BE-077', 'BE-165'])
    for (const row of bound) expect(row.bag, row.id).toContain('F10 canlıya alma (W194)')
    for (const id of F10_W193_CLOSED) expect(F10_W194_CLOSED.has(id), id).toBe(false)
  })

  it('BE-069/112 P45 gerekçesiyle vazgeçildi; kodda stub yok, bağlandı sayılmaz', () => {
    const stubs = stubIds()
    for (const id of F10_W194_WAIVED) {
      const row = byId().get(id)!
      expect(row.status, id).toMatch(F10_W194_WAIVER)
      expect(stubs.has(id), `${id} vazgeçildi ama kodda stub var`).toBe(false)
      expect(laterBoundAllowed(id, F10_W194_BOUND, stubs, ''), id).toBe(false)
    }
  })

  it('gerçek depo: kapanan dört kimlik kodda stub değil; eski arşiv stub dışa aktarımları yok; kanıt dosyaları var', () => {
    const stubs = stubIds()
    for (const id of F10_W194_CLOSED) {
      expect(stubs.has(id), `${id} stub kaldı`).toBe(false)
      for (const path of F10_W194_EVIDENCE[id] ?? []) expect(existsSync(path), path).toBe(true)
      expect(laterBoundAllowed(id, F10_W194_BOUND, stubs, ''), id).toBe(true)
    }
    const archiveStubs = readFileSync('src/modules/archive/model/stubs.ts', 'utf8')
    for (const name of ['MOVE_FILE', 'RESTORE_FILE', 'SEARCH_SCOPE', 'UNATTACHED_UPLOAD']) {
      expect(archiveStubs, name).not.toContain(name)
    }
  })

  it('kapsam: W194 satırları W193 etiketi taşımaz; W193 satırları W194 etiketi taşımaz', () => {
    for (const row of cells()) {
      if (F10_W194_CLOSED.has(row.id)) expect(row.status, row.id).not.toContain('F10 W193')
      if (F10_W193_CLOSED.has(row.id)) expect(row.status, row.id).not.toContain('F10 W194')
    }
  })
})

describe('F10 W194 kapanış kuralı (negatifler)', () => {
  const none = new Set<string>()
  it('yalnız doğru W194 kümesi + stub yok + doğru etiket kabul edilir', () => {
    for (const id of F10_W194_CLOSED) {
      expect(laterBoundAllowed(id, F10_W194_BOUND, none, ''), id).toBe(true)
    }
  })
  it.each([
    ['ilgisiz satır', 'BE-110', F10_W194_BOUND],
    ['W193 satırı W194 etiketiyle', 'BE-163', F10_W194_BOUND],
    ['W194 satırı W193 etiketiyle', 'BE-075', 'bağlandı (pin v0.26.0-api, F10 W193)'],
    ['aynı pin yanlış W', 'BE-075', 'bağlandı (pin v0.26.0-api, F10 W195)'],
    ['yanlış pin', 'BE-075', 'bağlandı (pin v0.25.0-api, F10 W194)'],
    ['eski pin', 'BE-077', 'bağlandı (pin v0.23.0-api, F10 W194)'],
    ['açık durum', 'BE-076', 'açık'],
    ['vazgeçilen satır bağlandı diye', 'BE-069', F10_W194_BOUND],
    ['vazgeçilen satır bağlandı diye (112)', 'BE-112', F10_W194_BOUND],
    ['F8 etiketi', 'BE-165', 'bağlandı (pin v0.23.0-api, F8 W174)'],
  ])('reddeder: %s', (_name, id, status) => {
    expect(laterBoundAllowed(id, status, none, '')).toBe(false)
  })
  it.each(['BE-075', 'BE-076', 'BE-077', 'BE-165'])(
    'kodda kalan stub (%s) kapanışı geçersiz kılar',
    (id) => {
      expect(laterBoundAllowed(id, F10_W194_BOUND, new Set([id]), '')).toBe(false)
    },
  )
  it('kanıt dosyası yoksa kapanış reddedilir', () => {
    const original = F10_W194_EVIDENCE['BE-075']
    ;(F10_W194_EVIDENCE as Record<string, readonly string[]>)['BE-075'] = ['yok/olmayan.test.ts']
    try {
      expect(laterBoundAllowed('BE-075', F10_W194_BOUND, none, '')).toBe(false)
    } finally {
      ;(F10_W194_EVIDENCE as Record<string, readonly string[]>)['BE-075'] = original!
    }
  })
})
