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
  it('interface yakalanır', async () => {
    const ids = await ruleIds(
      'src/modules/identity/api/__lint_fixture__.ts',
      'export interface MeDto { account_id: string }\n',
    )
    expect(ids).toContain('no-restricted-syntax')
  })

  it('tip literali yakalanır', async () => {
    const ids = await ruleIds(
      'src/modules/identity/api/__lint_fixture__.ts',
      'export type MeDto = { account_id: string }\n',
    )
    expect(ids).toContain('no-restricted-syntax')
  })

  it('api/ dışında aynı kural uygulanmaz', async () => {
    const ids = await ruleIds(
      'src/modules/identity/store/__lint_fixture__.ts',
      'export interface LocalState { open: boolean }\n',
    )
    expect(ids).not.toContain('no-restricted-syntax')
  })
})
