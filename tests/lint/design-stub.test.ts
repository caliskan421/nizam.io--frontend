// designStub ↔ eksik kaydı tutarlılığı (K13, ortak-kurallar §3). Gerçek depo yeşil olmalı;
// kırmızı/yeşil örnekler denetimin gerçekten yakaladığını kanıtlar.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  checkDesignStubs,
  collectSources,
  KNOWN_STATUSES,
  parseRegistry,
  statusOf,
  stubRejection,
  stripComments,
} from './design-stub-registry'

const REGISTRY_PATH = 'docs/backend-eksikleri/kayit.md'

// Gerçek kayıt biçiminde örnek tablo (9 sütun): BE | Faz | Ekran | Öğe | Eksik | Şimdilik | Bağ | Boyut | Durum
const SAMPLE = [
  '| BE | Faz | Ekran | Tasarım öğesi | Eksik | Şimdilik | Bağ | Boyut | Durum |',
  '|---|---|---|---|---|---|---|---|---|',
  '| BE-001 | F0 | Kenar | Avatar | alan yok | türetilmiş | yeni | S | açık |',
  "| BE-002 | F1 | 03 | Sayaç | uç yok | istemcide | yeni | M | backend'de (v0.12.0-api) |",
  '| BE-003 | F1 | 03 | Arama | uç yok | istemcide | yeni | S | bağlandı (#41) |',
  '| BE-004 | F0 | Üst çubuk | Zil paneli | eksik değil | F7 | — | — | vazgeçildi (faz sırası) |',
  '| BE-005 | F0 | Kabuk | Belge paketi | anlatım yok | stub yok (belge eksiği) | GAP-1 | S (belge) | açık |',
  '| BE-006 | sonra | 11 Tablolar | Modül | uçlar yok | v1 dışı | yeni | L | açık |',
].join('\n')

const ts = (text: string, path = 'src/app/x.ts') => ({ path, text })

describe('kayıt ayrıştırma', () => {
  it('gerçek kayıt: biçim sağlam, kimlikler tekil, durumlar bilinen kümede', () => {
    const rows = parseRegistry(readFileSync(REGISTRY_PATH, 'utf8'))
    expect(rows.size).toBeGreaterThanOrEqual(106)
    expect(rows.get('BE-001')?.phase).toBe('F0')
    for (const row of rows.values()) {
      expect(KNOWN_STATUSES, `${row.id}: '${row.status}'`).toContain(statusOf(row))
    }
  })

  it('bozuk satır sessizce geçilmez', () => {
    expect(() => parseRegistry('| BE-001 | F0 | eksik sütun |')).toThrow(/9 sütun/)
    expect(() =>
      parseRegistry(`${SAMPLE}\n| BE-001 | F0 | a | b | c | d | e | S | açık |`),
    ).toThrow(/iki kez/)
  })

  it('stub uygunluğu: yalnız açık/backend’de işlev eksiği', () => {
    const rows = parseRegistry(SAMPLE)
    expect(stubRejection(rows.get('BE-001'))).toBeNull()
    expect(stubRejection(rows.get('BE-002'))).toBeNull()
    expect(stubRejection(rows.get('BE-003'))).toMatch(/bağlandı/)
    expect(stubRejection(rows.get('BE-004'))).toMatch(/vazgeçildi/)
    expect(stubRejection(rows.get('BE-005'))).toMatch(/belge/)
    expect(stubRejection(rows.get('BE-006'))).toMatch(/v1 dışı/)
    expect(stubRejection(undefined)).toMatch(/kayıtta yok/)
  })

  it('gerçek kayıtta belge paketi (BE-036) ve v1 dışı satırlar stub kabul etmez', () => {
    const rows = parseRegistry(readFileSync(REGISTRY_PATH, 'utf8'))
    expect(stubRejection(rows.get('BE-036'))).toMatch(/belge/)
    expect(stubRejection(rows.get('BE-031'))).toMatch(/v1 dışı/)
    expect(stubRejection(rows.get('BE-002'))).toMatch(/vazgeçildi/)
    expect(stubRejection(rows.get('BE-001'))).toBeNull()
  })
})

describe('kod ↔ kayıt (yeşil)', () => {
  it.each([
    ['açık satır', "const c = designStub('BE-001', color)\n"],
    ["backend'de satır", 'const n = designStub("BE-002", 0)\n'],
    ['tip argümanlı çağrı', "const n = designStub<number>('BE-001', 0)\n"],
    ['çok satırlı çağrı', "const n = designStub(\n  'BE-001',\n  0,\n)\n"],
    ['bileşen', '<template><DesignStub id="BE-001"><span /></DesignStub></template>\n'],
    ['bileşen, dize bağlaması', `<template><DesignStub :id="'BE-002'" /></template>\n`],
    ['yorumdaki belge örneği', "// designStub('BE-NNN', …) ile işaretlenir\n/* designStub(x) */\n"],
    ['şablon yorumu', '<template><!-- <DesignStub :id="x" /> --><p /></template>\n'],
  ])('%s', (_name, text) => {
    expect(checkDesignStubs(SAMPLE, [ts(text, 'src/app/x.vue')])).toEqual([])
  })

  it('gerçek depo: src/ altındaki bütün kullanımlar kayıtla tutarlı', () => {
    const problems = checkDesignStubs(readFileSync(REGISTRY_PATH, 'utf8'), collectSources('.'))
    expect(problems).toEqual([])
  })
})

describe('kod ↔ kayıt (kırmızı)', () => {
  it.each([
    ['kayıtta olmayan kimlik', "designStub('BE-999', 1)\n", /BE-999 — kayıtta yok/],
    ['bağlandı satırı kodda kalmış', "designStub('BE-003', 1)\n", /BE-003 — .*bağlandı/],
    ['vazgeçildi satırı', "designStub('BE-004', 1)\n", /BE-004 — .*vazgeçildi/],
    ['belge kalemine stub', "designStub('BE-005', 1)\n", /BE-005 — belge/],
    ['v1 dışı modüle stub', "designStub('BE-006', 1)\n", /BE-006 — v1 dışı/],
    ['dinamik kimlik', 'designStub(id, 1)\n', /dize literali/],
    ['şablon dizgesi kimlik', 'designStub(`BE-${n}`, 1)\n', /dize literali/],
    ['biçimsiz kimlik', "designStub('BE-1', 1)\n", /dize literali/],
    [
      'takma adla içe aktarım',
      "import { designStub as ds } from '@/shared/design-stub'\n",
      /takma ad/,
    ],
    ['bileşende dinamik id', '<DesignStub :id="stubId" />\n', /dinamik/],
    [
      'bileşende kayıtsız dize bağlaması',
      `<DesignStub :id="'BE-999'" />\n`,
      /BE-999 — kayıtta yok/,
    ],
    ['bileşende bağlandı kimliği', '<DesignStub id="BE-003" />\n', /BE-003 — .*bağlandı/],
    ['bileşende id yok', '<DesignStub>x</DesignStub>\n', /id="BE-NNN"/],
    ['kebap adlı bileşen, kayıtsız id', '<design-stub id="BE-999" />\n', /BE-999 — kayıtta yok/],
  ])('%s', (_name, text, expected) => {
    const problems = checkDesignStubs(SAMPLE, [ts(text)])
    expect(problems.join('\n')).toMatch(expected)
  })

  it('gerçek kayıtla: BE-008 (açık) yeşil, BE-023 (vazgeçildi) kırmızı — çağrı ve bileşen', () => {
    const registry = readFileSync(REGISTRY_PATH, 'utf8')
    const green = [
      ts("export const hint = designStub('BE-008', null)\n"),
      ts(
        '<template><DesignStub id="BE-008"><button disabled /></DesignStub></template>\n',
        'src/a.vue',
      ),
      ts(`<template><DesignStub :id="'BE-008'" /></template>\n`, 'src/b.vue'),
    ]
    expect(checkDesignStubs(registry, green)).toEqual([])
    const red = [
      ts("designStub('BE-023', null)\n"),
      ts('<template><DesignStub id="BE-023" /></template>\n', 'src/a.vue'),
      ts(`<template><DesignStub :id="'BE-023'" /></template>\n`, 'src/b.vue'),
    ]
    const problems = checkDesignStubs(registry, red)
    expect(problems).toHaveLength(3)
    for (const problem of problems) expect(problem).toMatch(/BE-023 — .*vazgeçildi/)
  })

  it('sorun satırı dosya:satır ile raporlanır', () => {
    const problems = checkDesignStubs(SAMPLE, [ts("const a = 1\n\ndesignStub('BE-999', a)\n")])
    expect(problems).toEqual(['src/app/x.ts:3: BE-999 — kayıtta yok'])
  })
})

describe('yorum temizleme', () => {
  it('satır sayısını korur, URL ve dizeleri bozmaz', () => {
    const text = "const u = 'https://x.y/z' // not\n/* a\nb */ designStub('BE-001', 1)\n"
    const out = stripComments(text)
    expect(out.split('\n')).toHaveLength(text.split('\n').length)
    expect(out).toContain("'https://x.y/z'")
    expect(out).toContain("designStub('BE-001', 1)")
    expect(out).not.toContain('not')
  })
})
