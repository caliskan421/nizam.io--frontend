// K12 boyut kapıları, K1 rol dizesi, K10 rol önekli rota ve K13 designStub lint kurallarının
// GERÇEKTEN yakaladığının kanıtı (negatif örnekler + kaçış denemeleri + izinli yollar).
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

import { lintMessages, ruleIds } from './lint-helper'

// eslint.config.js tip bildirimsiz JS'tir; dışa açık sabitleri adres üzerinden okunur.
interface GateConfig {
  SIZE_LIMITS: Record<string, number>
  ROLE_ALLOWED_FILES: string[]
  vueSizeExceptions: Record<string, string>
  functionSizeExceptions: Record<string, { reason: string }>
}
const { SIZE_LIMITS, ROLE_ALLOWED_FILES, vueSizeExceptions, functionSizeExceptions } =
  (await import(pathToFileURL(resolve('eslint.config.js')).href)) as GateConfig

const APP_TS = 'src/app/__lint_fixture__.ts'
const APP_VUE = 'src/app/__lint_fixture__.vue'
const ROLE_RULE = 'nizamio/rol-dizesi'
const ROUTE_RULE = 'nizamio/rol-onekli-rota'
const STUB_RULE = 'nizamio/design-stub-cagrisi'

function vueWithLines(total: number): string {
  const head = ['<template><div /></template>', '<script setup lang="ts">']
  const body = Array.from({ length: total - head.length - 1 }, (_, i) => `const v${i} = ${i}`)
  return [...head, ...body, '</script>'].join('\n')
}

/** İmza ve kapanış dahil `total` satırlık fonksiyon. */
function fnWithLines(total: number): string {
  const body = Array.from({ length: total - 3 }, (_, i) => `  const v${i} = ${i}`)
  return ['export function f(): number {', ...body, '  return 0', '}', ''].join('\n')
}

function fnWithBranches(branches: number): string {
  const ifs = Array.from({ length: branches }, (_, i) => `  if (x === ${i}) return ${i}`)
  return ['export function f(x: number): number {', ...ifs, '  return -1', '}', ''].join('\n')
}

describe('K12 boyut kapıları', () => {
  it('başlangıç eşikleri: .vue 250/400, fonksiyon 60 satır, karmaşıklık 12', () => {
    expect(SIZE_LIMITS).toEqual({ vueWarn: 250, vueError: 400, functionLines: 60, complexity: 12 })
  })

  it('.vue 250 satır temiz, 251 uyarı, 401 hata', async () => {
    expect(await ruleIds(APP_VUE, vueWithLines(250))).not.toContain('max-lines')
    const warn = await lintMessages(APP_VUE, vueWithLines(251))
    expect(warn).toContainEqual({ ruleId: 'max-lines', severity: 1 })
    expect(warn.map((m) => m.ruleId)).not.toContain('nizamio/dosya-tavani')
    const error = await lintMessages(APP_VUE, vueWithLines(401))
    expect(error).toContainEqual({ ruleId: 'nizamio/dosya-tavani', severity: 2 })
  })

  it('fonksiyon 60 satır temiz, 61 hata', async () => {
    expect(await ruleIds(APP_TS, fnWithLines(60))).not.toContain('max-lines-per-function')
    expect(await ruleIds(APP_TS, fnWithLines(61))).toContain('max-lines-per-function')
  })

  it('karmaşıklık 12 temiz, 13 hata', async () => {
    expect(await ruleIds(APP_TS, fnWithBranches(11))).not.toContain('complexity')
    expect(await ruleIds(APP_TS, fnWithBranches(12))).toContain('complexity')
  })

  it('.vue betiğindeki fonksiyon da sınırda', async () => {
    const code = `<script setup lang="ts">\n${fnWithBranches(12)}</script>\n<template><div /></template>\n`
    expect(await ruleIds(APP_VUE, code)).toContain('complexity')
  })

  it('test dosyaları fonksiyon sınırından muaf', async () => {
    expect(await ruleIds('src/app/__lint_fixture__.test.ts', fnWithLines(80))).not.toContain(
      'max-lines-per-function',
    )
  })

  it('istisnalar yazılı gerekçeli ve yalnız ölçülen değere kadar', async () => {
    for (const [file, limit] of Object.entries(functionSizeExceptions)) {
      expect(limit.reason.length, file).toBeGreaterThan(20)
    }
    for (const reason of Object.values(vueSizeExceptions)) expect(reason.length).toBeGreaterThan(20)
    const client = 'src/shared/http/client.ts'
    expect(await ruleIds(client, fnWithLines(62))).not.toContain('max-lines-per-function')
    expect(await ruleIds(client, fnWithLines(63))).toContain('max-lines-per-function')
  })
})

describe('K1 rol dizesi yalnız izinli dosyalarda', () => {
  it.each([
    ['literal karşılaştırma', "export const f = (r: string) => r === 'koordinator'\n"],
    ['uye literali', "export const r = 'uye'\n"],
    ['şablon dizgesi', 'export const r = `koordinator`\n'],
    [
      'company_admin okuması',
      'export const f = (me: { company_admin: boolean }) => me.company_admin\n',
    ],
    ['köşeli parantez', "export const f = (me: Record<string, boolean>) => me['company_admin']\n"],
    [
      'yapı bozma takma adı',
      'export const f = ({ company_admin: isAdmin }: { company_admin: boolean }) => isAdmin\n',
    ],
    [
      'sabit takma adla .role karşılaştırması',
      "import { ROLE_C } from '@/shared/scope/standing'\nexport const f = (row: { role: string }) => row.role === ROLE_C\n",
    ],
    [
      'yapı bozulmuş role değişkeni',
      'export const f = ({ role }: { role: string }, x: string) => role !== x\n',
    ],
    [
      'switch (row.role)',
      'export function f(row: { role: string }): number {\n  switch (row.role) {\n    default:\n      return 0\n  }\n}\n',
    ],
    [
      'includes(row.role)',
      'export const f = (row: { role: string }, xs: string[]) => xs.includes(row.role)\n',
    ],
  ])('%s yakalanır', async (_name, code) => {
    expect(await ruleIds(APP_TS, code)).toContain(ROLE_RULE)
  })

  it.each([
    ['şablonda rol karşılaştırması', `<template><p v-if="row.role === 'uye'">x</p></template>`],
    ['şablonda company_admin', `<template><p v-if="me.company_admin">x</p></template>`],
  ])('.vue %s yakalanır', async (_name, template) => {
    const code = `<script setup lang="ts">\nconst row = { role: '' }\nconst me = {}\n</script>\n${template}\n`
    expect(await ruleIds(APP_VUE, code)).toContain(ROLE_RULE)
  })

  const roleCode =
    "export const isCoord = (row: { role: string }) => row.role === 'koordinator'\n" +
    'export const isAdmin = (me: { company_admin: boolean }) => me.company_admin\n'

  it('izinli dosya listesi tam olarak üç desen', () => {
    expect(ROLE_ALLOWED_FILES).toEqual([
      'src/modules/*/model/capabilities.ts',
      'src/shared/scope/standing*',
      'src/shared/session/standing*',
    ])
  })

  it.each([
    'src/modules/work/model/capabilities.ts',
    'src/shared/scope/standing.ts',
    'src/shared/scope/standing-lens.ts',
    'src/shared/session/standing.ts',
  ])('izinli: %s', async (file) => {
    expect(await ruleIds(file, roleCode)).not.toContain(ROLE_RULE)
  })

  it.each([
    'src/modules/work/model/sub/capabilities.ts',
    'src/modules/work/model/capabilities/index.ts',
    'src/modules/work/x/model/capabilities.ts',
    'src/modules/work/model/capabilities2.ts',
    'src/shared/scope/standing/evil.ts',
    'src/shared/scope/sub/standing.ts',
    'src/shared/scope/store.ts',
    'src/app/capabilities.ts',
  ])('alt dizin / benzer ad kaçışı yakalanır: %s', async (file) => {
    expect(await ruleIds(file, roleCode)).toContain(ROLE_RULE)
  })

  it('depolama bağdaştırıcısının no-restricted-syntax istisnası rol kuralını ezmez (W13)', async () => {
    const ids = await ruleIds('src/shared/preferences/storage-adapter.ts', roleCode)
    expect(ids).toContain(ROLE_RULE)
  })

  it('tip konumundaki literal karşılaştırma değildir', async () => {
    expect(
      await ruleIds(APP_TS, "export type Lens = 'admin' | 'koordinator' | 'uye'\n"),
    ).not.toContain(ROLE_RULE)
  })

  it('test fikstürü muaf, ama yalnız *.test.ts', async () => {
    expect(await ruleIds('src/shared/scope/store.test.ts', roleCode)).not.toContain(ROLE_RULE)
    expect(await ruleIds('src/shared/scope/store.testing.ts', roleCode)).toContain(ROLE_RULE)
  })
})

describe('K10 rol önekli rota yasağı', () => {
  it.each([
    ['kök yol', "export const r = { path: '/admin/kullanicilar' }\n"],
    ['koordinatör öneki', "export const p = '/koordinator'\n"],
    ['üye öneki, şablon dizgesi', 'export const p = (id: string) => `/uye/${id}`\n'],
    ['ara parça', 'export const p = (base: string) => `${base}/admin`\n'],
    [
      'alt rota (göreli yol)',
      "export const r = { path: '/x', children: [{ path: 'yonetici' }] }\n",
    ],
    ['iç segment', "export const r = { path: 'panel/coordinator/gorevler' }\n"],
    ['takma ad sabiti', "const ADMIN = '/Admin'\nexport const r = { path: ADMIN }\n"],
    ['gezinme', "declare const router: { push(p: string): void }\nrouter.push('/member/1')\n"],
  ])('%s yakalanır', async (_name, code) => {
    expect(await ruleIds(APP_TS, code)).toContain(ROUTE_RULE)
  })

  it.each([
    'src/modules/work/routes/admin.ts',
    'src/modules/work/deep/nested/routes.ts',
    'src/modules/work/model/capabilities.ts',
    'src/shared/scope/standing.ts',
  ])('alt dizin ve izinli rol dosyasında da yakalanır: %s', async (file) => {
    expect(await ruleIds(file, "export const r = { path: '/admin' }\n")).toContain(ROUTE_RULE)
  })

  it.each([
    ['statik bağlantı', '<template><RouterLink to="/admin/x">x</RouterLink></template>'],
    ['bağlı ifade', `<template><RouterLink :to="'/uye'">x</RouterLink></template>`],
  ])('.vue %s yakalanır', async (_name, template) => {
    const code = `<script setup lang="ts">\nconst x = 1\n</script>\n${template}\n`
    expect(await ruleIds(APP_VUE, code)).toContain(ROUTE_RULE)
  })

  it.each([
    ['özellik yolu', "export const r = { path: '/koordinatorlukler/:departmentId' }\n"],
    ['API yolu', "export const u = '/v1/admin/users'\n"],
    ['sorgu değeri', "export const q = { sekme: 'uyeler' }\n"],
  ])('yanlış alarm yok: %s', async (_name, code) => {
    expect(await ruleIds(APP_TS, code)).not.toContain(ROUTE_RULE)
  })
})

describe('K13 designStub çağrı biçimi', () => {
  const imp = "import { designStub } from '@/shared/design-stub'\n"

  it('literal kimlik serbest', async () => {
    expect(
      await ruleIds(APP_TS, `${imp}export const c = designStub('BE-001', 'x')\n`),
    ).not.toContain(STUB_RULE)
  })

  it.each([
    ['değişken kimlik', `${imp}const id = 'BE-001' as const\nexport const c = designStub(id, 1)\n`],
    ['şablon dizgesi', `${imp}export const c = designStub(\`BE-001\`, 1)\n`],
    ['biçimsiz kimlik', `${imp}export const c = designStub('BE-1', 1)\n`],
    [
      'takma ad',
      "import { designStub as ds } from '@/shared/design-stub'\nexport const c = ds('BE-001', 1)\n",
    ],
    [
      'ad alanı',
      "import * as stub from '@/shared/design-stub'\nexport const c = stub.designStub('BE-001', 1)\n",
    ],
  ])('%s yakalanır', async (_name, code) => {
    expect(await ruleIds(APP_TS, code)).toContain(STUB_RULE)
  })
})
