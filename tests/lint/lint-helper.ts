// Lint negatif testleri için ortak yardımcı: kaynak metin sanal dosya yoluyla ESLint'e verilir.
// Sanal dosyalar tsconfig projesinde olmadığından tip bilgili kurallar kapatılır; sınanan
// kurallar sözdizimseldir.
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'

const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfig: tseslint.configs.disableTypeChecked,
})

export interface LintMessage {
  ruleId: string
  severity: number
}

export async function lintMessages(filePath: string, code: string): Promise<LintMessage[]> {
  const [result] = await eslint.lintText(code, { filePath })
  if (!result) throw new Error('ESLint sonucu yok')
  const fatal = result.messages.filter((m) => m.fatal)
  if (fatal.length > 0) throw new Error(fatal.map((m) => m.message).join('\n'))
  return result.messages.map((m) => ({ ruleId: m.ruleId ?? '', severity: m.severity }))
}

export async function ruleIds(filePath: string, code: string): Promise<string[]> {
  return (await lintMessages(filePath, code)).map((m) => m.ruleId)
}
