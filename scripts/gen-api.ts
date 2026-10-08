// pnpm gen:api — backend API sözleşmesinden istemci çıktıları üretir.
//
// Kaynak: backend deposunun `api-pin.json` içindeki ETİKETİ (`git show <tag>:<yol>`).
// Çalışma ağacı veya etiketsiz `main` okunmaz (CLAUDE.md: "etiketsiz main'den tip üretilmez").
// Backend dizini: NIZAMIO_BACKEND_DIR, yoksa ../nizam.io--backend.
//
// Çıktılar (commit'lenir; CI yeniden üretip `git diff --exit-code` uygular):
//   src/shared/api/schema.d.ts          openapi-typescript tipleri
//   src/shared/api/error-codes.gen.ts   hata kataloğu (kod → durum, fields, message_key)
//   src/shared/api/operations.gen.ts    "METOT /yol" → operationId, kapsam sınıfı, CSRF, kimlik
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import openapiTS, { astToString } from 'openapi-typescript'
import { parse } from 'yaml'

const root = resolve(import.meta.dirname, '..')
const pin = JSON.parse(readFileSync(resolve(root, 'api-pin.json'), 'utf8')) as {
  backendTag: string
  specPath: string
  errorCatalogPath: string
}
const backendDir = resolve(root, process.env.NIZAMIO_BACKEND_DIR ?? '../nizam.io--backend')

function git(...args: string[]): string {
  return execFileSync('git', ['-C', backendDir, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

let commit: string
try {
  commit = git('rev-parse', '--verify', `refs/tags/${pin.backendTag}^{commit}`).trim()
} catch {
  console.error(
    `gen:api: ${backendDir} içinde '${pin.backendTag}' etiketi yok. ` +
      'Backend deposunu getirin (git fetch --tags) veya NIZAMIO_BACKEND_DIR verin.',
  )
  process.exit(1)
}
const specText = git('show', `refs/tags/${pin.backendTag}:${pin.specPath}`)
const catalogText = git('show', `refs/tags/${pin.backendTag}:${pin.errorCatalogPath}`)

const header = (what: string): string =>
  `// BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. \`pnpm gen:api\` ile yeniden üretilir.\n` +
  `// Kaynak: nizam.io--backend etiket ${pin.backendTag} (${commit}) — ${what}\n`

// 1) openapi-typescript
type Spec = {
  info: { version: string }
  paths: Record<string, Record<string, Operation>>
}
type Operation = {
  operationId: string
  'x-nizamio-scope-class': 'S0' | 'S1' | 'S2' | 'S3'
  security?: unknown[]
  parameters?: Array<{ $ref?: string; name?: string }>
}
const spec = parse(specText) as Spec
const ast = await openapiTS(spec as never, { alphabetize: true })
writeFileSync(
  resolve(root, 'src/shared/api/schema.d.ts'),
  header(pin.specPath) + '\n' + astToString(ast),
)

// 2) hata kataloğu
type Catalog = {
  catalog_version: number
  codes: Record<string, { status: number | number[]; fields: string[]; message_key: string }>
}
const catalog = JSON.parse(catalogText) as Catalog
const codes = Object.keys(catalog.codes).sort()
const catalogLines = codes.map((code) => {
  const entry = catalog.codes[code]!
  const status = Array.isArray(entry.status) ? entry.status : [entry.status]
  return `  ${JSON.stringify(code)}: { status: ${JSON.stringify(status)}, fields: ${JSON.stringify(
    [...entry.fields].sort(),
  )}, messageKey: ${JSON.stringify(entry.message_key)} },`
})
writeFileSync(
  resolve(root, 'src/shared/api/error-codes.gen.ts'),
  header(pin.errorCatalogPath) +
    `\nexport const ERROR_CATALOG_VERSION = ${catalog.catalog_version} as const\n\n` +
    `export const ERROR_CODES = {\n${catalogLines.join('\n')}\n} as const\n\n` +
    `/** Backend kataloğundaki kararlı hata kodu. */\n` +
    `export type ServerErrorCode = keyof typeof ERROR_CODES\n`,
)

// 3) operasyon → kapsam sınıfı haritası
const ref = (name: string) => `#/components/parameters/${name}`
const methods = ['get', 'post', 'put', 'patch', 'delete'] as const
const ops: string[] = []
for (const path of Object.keys(spec.paths).sort()) {
  const item = spec.paths[path]!
  for (const method of methods) {
    const op = item[method]
    if (!op) continue
    const params = (op.parameters ?? []).map((p) => p.$ref ?? p.name)
    const entry = {
      operationId: op.operationId,
      scope: op['x-nizamio-scope-class'],
      csrf: params.includes(ref('CsrfHeader')),
      programHeader: params.includes(ref('ProgramScope')),
      departmentHeader: params.includes(ref('DepartmentScope')),
      auth: !(Array.isArray(op.security) && op.security.length === 0),
    }
    ops.push(`  ${JSON.stringify(`${method.toUpperCase()} ${path}`)}: ${JSON.stringify(entry)},`)
  }
}
writeFileSync(
  resolve(root, 'src/shared/api/operations.gen.ts'),
  header(`${pin.specPath} (x-nizamio-scope-class, parametreler, security)`) +
    `\nexport const API_VERSION = ${JSON.stringify(spec.info.version)} as const\n\n` +
    `export const OPERATIONS = {\n${ops.join('\n')}\n} as const\n\n` +
    `export type OperationKey = keyof typeof OPERATIONS\n` +
    `export type OperationMeta = (typeof OPERATIONS)[OperationKey]\n`,
)

console.log(
  `gen:api: ${pin.backendTag} (${commit.slice(0, 12)}) → schema.d.ts, ` +
    `${codes.length} hata kodu, ${ops.length} operasyon`,
)
