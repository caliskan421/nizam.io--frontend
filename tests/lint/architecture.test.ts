// Mimari lint kurallarının GERÇEKTEN yakaladığının kanıtı (negatif + pozitif örnekler).
// Kaynak metin sanal dosya yoluyla ESLint'e verilir; içe aktarılan hedefler depodaki
// gerçek dosyalardır, böylece sınır kuralı gerçek çözümlemeyle sınanır.
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'

// Sanal dosyalar tsconfig projesinde olmadığından tip bilgili kurallar bu testte kapatılır;
// sınanan mimari kurallar sözdizimsel/çözümlemeseldir ve tip bilgisi istemez.
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfig: tseslint.configs.disableTypeChecked,
})

async function ruleIds(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  if (!result) throw new Error('ESLint sonucu yok')
  const fatal = result.messages.filter((m) => m.fatal)
  if (fatal.length > 0) throw new Error(fatal.map((m) => m.message).join('\n'))
  return result.messages.map((m) => m.ruleId ?? '')
}

describe('sınır kuralı (boundaries/dependencies)', () => {
  it('shared → modules yasak', async () => {
    const ids = await ruleIds(
      'src/shared/__lint_fixture__.ts',
      "import { identityRoutes } from '@/modules/identity/public'\nexport const x = identityRoutes\n",
    )
    expect(ids).toContain('boundaries/dependencies')
  })

  it('shared → app yasak', async () => {
    const ids = await ruleIds(
      'src/shared/__lint_fixture__.ts',
      "import { createAppRouter } from '@/app/router'\nexport const x = createAppRouter\n",
    )
    expect(ids).toContain('boundaries/dependencies')
  })

  it('modül → başka modülün iç dosyası yasak, public.ts serbest', async () => {
    const internal = await ruleIds(
      'src/modules/program/__lint_fixture__.ts',
      "import { identityRoutes } from '@/modules/identity/routes'\nexport const x = identityRoutes\n",
    )
    expect(internal).toContain('boundaries/dependencies')

    const viaPublic = await ruleIds(
      'src/modules/program/__lint_fixture__.ts',
      "import { identityRoutes } from '@/modules/identity/public'\nexport const x = identityRoutes\n",
    )
    expect(viaPublic).not.toContain('boundaries/dependencies')
  })

  it('app → modül iç dosyası yasak', async () => {
    const ids = await ruleIds(
      'src/app/__lint_fixture__.ts',
      "import { identityRoutes } from '@/modules/identity/routes'\nexport const x = identityRoutes\n",
    )
    expect(ids).toContain('boundaries/dependencies')
  })

  it('modülün kendi iç dosyaları ve shared serbest', async () => {
    const ids = await ruleIds(
      'src/modules/identity/__lint_fixture__.ts',
      "import { identityRoutes } from './routes'\nimport type { ScopeClass } from '@/shared/scope/scope-class'\n" +
        "export const x: ScopeClass = 'S0'\nexport const y = identityRoutes\n",
    )
    expect(ids).not.toContain('boundaries/dependencies')
  })
})

describe('depolama yasağı', () => {
  it.each([
    "localStorage.setItem('t', 'x')",
    "sessionStorage.setItem('t', 'x')",
    "window.localStorage.setItem('t', 'x')",
    "globalThis['sessionStorage'].setItem('t', 'x')",
  ])('%s yakalanır', async (code) => {
    const ids = await ruleIds('src/shared/__lint_fixture__.ts', `${code}\nexport {}\n`)
    expect(ids.some((id) => id === 'no-restricted-globals' || id === 'no-restricted-syntax')).toBe(
      true,
    )
  })
})

describe('elle DTO yasağı (src/modules/**/api)', () => {
  const API = 'src/modules/identity/api/__lint_fixture__.ts'

  it.each([
    ['interface', 'export interface MeDto { account_id: string }\n'],
    ['type alias — nesne', 'export type MeDto = { account_id: string }\n'],
    ['type alias — Record', 'export type MeDto = Record<string, string>\n'],
    ['type alias — tuple', 'export type Pair = [string, number]\n'],
    ['type alias — mapped', "export type M = { [K in 'a' | 'b']: string }\n"],
    ['type alias — literal birleşimi', "export type Role = 'uye' | 'koordinator'\n"],
    ['type alias — primitive birleşimi', 'export type Id = string | number\n'],
    [
      'type alias — schema takma adı bile',
      "import type { components } from '@/shared/api/schema'\nexport type Me = components['schemas']['MeResponse']\n",
    ],
    ['class', "export class MeDto { account_id = '' }\n"],
    ['class ifadesi', "export const MeDto = class { account_id = '' }\n"],
    ['enum', "export enum Role { Uye = 'uye' }\n"],
    ['namespace', 'export namespace Dto { export const x = 1 }\n'],
    [
      'satır içi tip literali (parametre)',
      'export function f(x: { a: string }): string { return x.a }\n',
    ],
    ['satır içi tip literali (as)', "export const x = JSON.parse('{}') as { a: string }\n"],
    [
      'satır içi Record',
      'export function f(x: Record<string, string>): number { return Object.keys(x).length }\n',
    ],
    [
      'satır içi Pick',
      "import type { MeResponse } from '@/shared/api/types'\nexport function f(x: Pick<MeResponse, 'email'>): string { return x.email }\n",
    ],
    ['satır içi tuple', 'export function f(x: [string, string]): string { return x[0] }\n'],
    ['satır içi literal tip', "export function f(x: 'a'): string { return x }\n"],
    ['şablon literal tip', 'export function f(x: `a${string}`): string { return x }\n'],
  ])('%s yakalanır', async (_name, code) => {
    const ids = await ruleIds(API, code)
    expect(ids).toContain('no-restricted-syntax')
  })

  it('izin verilen yol: @/shared/api tiplerini içe aktarıp kullanmak', async () => {
    const ids = await ruleIds(
      API,
      "import type { MeResponse } from '@/shared/api/types'\nexport type { MeResponse }\n" +
        'export function email(me: MeResponse): string { return me.email }\n',
    )
    expect(ids).not.toContain('no-restricted-syntax')
  })

  it('api/ dışında aynı kural uygulanmaz', async () => {
    const ids = await ruleIds(
      'src/modules/identity/store/__lint_fixture__.ts',
      'export interface LocalState { open: boolean }\n',
    )
    expect(ids).not.toContain('no-restricted-syntax')
  })
})
