// pnpm gen:tokens — tasarım token'ları → web çıktıları (commit'lenir; CI diff = 0). Yol haritası K9.
//
// Girdiler:
//   tokens/design-system.tokens.json   tasarım sistemi kaynağının BİREBİR kopyası (mobil deposu);
//                                      pin: api-pin.json → designTokens {repo, commit, path, blob}
//   design/web-tokens.json             yalnız web'e özgü değerler (tema-sistemi/tokens.css,
//                                      theme.css'te olup kaynakta olmayanlar)
// Çıktılar (src/shared/tokens/):
//   tokens.gen.css     CSS değişkenleri: koyu varsayılan (:root, [data-theme='dark']) + [data-theme='light']
//   tailwind.gen.css   Tailwind v4 @theme eşlemesi (değerler CSS değişkenine başvurur)
//   tokens.gen.ts      ad → değer verisi (PrimeVue preset'i ve TS tarafı okur)
//
// Kopyanın git blob kimliği pinle uyuşmazsa üretim DURUR (CI mobil deposuna erişmez; kopya elle
// değiştirilmiş ya da pin güncellenmemiş demektir). Güncelleme: yeni kopya + yeni pin + bu komut + PR.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SOURCE_COPY = 'tokens/design-system.tokens.json'
export const WEB_TOKENS = 'design/web-tokens.json'
export const OUT_DIR = 'src/shared/tokens'

type Themed = { dark: string; light: string }
type RawToken = { name: string; value: string | Themed; usage?: string }
type TokenGroup = { tokens: RawToken[] }
type TypeStyle = {
  name: string
  fontSize: string
  lineHeight: string
  fontWeight: number
  letterSpacing?: string
}
export type SourceFile = {
  color: TokenGroup
  type: { families: Record<string, string>; groups: Array<{ family: string; styles: TypeStyle[] }> }
  spacing: TokenGroup
  radius: TokenGroup
  shadow: TokenGroup
  size: TokenGroup
  blur: TokenGroup
}
export type WebFile = { version: number; groups: Record<string, TokenGroup> }

export type DesignTokenPin = { repo: string; commit: string; path: string; blob: string }
export type Token = {
  name: string
  group: string
  origin: 'source' | 'web'
  themed: boolean
  dark: string
  light: string
}

const NAME = /^[a-z][a-z0-9-]*$/
const REF = /\{([a-z][a-z0-9-]*)\}/g
const SHA1 = /^[0-9a-f]{40}$/
// CSS bildirimini kıracak ya da başka kural açacak karakter yok (başvuru {ad} hariç).
const SAFE_VALUE = /^[^;{}<>\\\n\r]+$/

/** `git hash-object` ile aynı: sha1("blob <bayt>\0" + içerik). */
export function gitBlobId(bytes: Uint8Array): string {
  return createHash('sha1').update(`blob ${bytes.byteLength}\0`).update(bytes).digest('hex')
}

/** api-pin.json `designTokens` alanını doğrular ve kopyanın blob'unu pinle karşılaştırır. */
export function verifyPin(pin: unknown, copy: Uint8Array): DesignTokenPin {
  const p = pin as Partial<DesignTokenPin> | undefined
  if (
    !p ||
    typeof p.repo !== 'string' ||
    typeof p.path !== 'string' ||
    typeof p.commit !== 'string' ||
    !SHA1.test(p.commit) ||
    typeof p.blob !== 'string' ||
    !SHA1.test(p.blob)
  ) {
    throw new Error(
      'gen:tokens: api-pin.json designTokens {repo, commit, path, blob} eksik ya da biçimsiz',
    )
  }
  const actual = gitBlobId(copy)
  if (actual !== p.blob) {
    throw new Error(
      `gen:tokens: ${SOURCE_COPY} blob ${actual} ≠ pin ${p.blob} (${p.repo}@${p.commit.slice(0, 12)}:${p.path}). ` +
        "Kopya kaynakla aynı değil: kopyayı pinli commit'ten yenileyin ya da pini güncelleyin.",
    )
  }
  return { repo: p.repo, commit: p.commit, path: p.path, blob: p.blob }
}

function themed(value: string | Themed, where: string): Themed | string {
  if (typeof value === 'string') return value
  if (typeof value.dark !== 'string' || typeof value.light !== 'string') {
    throw new Error(`gen:tokens: ${where} {dark, light} çifti eksik`)
  }
  return value
}

/** Kaynak + web dosyalarını tek düz token listesine çevirir; ad, değer ve başvuruları doğrular. */
export function collectTokens(source: SourceFile, web: WebFile): Token[] {
  const tokens: Token[] = []
  const add = (origin: Token['origin'], group: string, name: string, raw: string | Themed) => {
    const where = `${origin}:${group}.${name}`
    if (!NAME.test(name)) throw new Error(`gen:tokens: ${where} geçersiz ad`)
    const value = themed(raw, where)
    const pair = typeof value === 'string' ? { dark: value, light: value } : value
    for (const v of [pair.dark, pair.light]) {
      if (!SAFE_VALUE.test(v.replace(REF, 'x'))) {
        throw new Error(`gen:tokens: ${where} güvensiz değer: ${v}`)
      }
    }
    tokens.push({ name, group, origin, themed: typeof value !== 'string', ...pair })
  }

  const groupTokens = (group: string, g: TokenGroup | undefined, origin: Token['origin']) => {
    if (!g || !Array.isArray(g.tokens)) throw new Error(`gen:tokens: ${origin}:${group} grubu yok`)
    for (const t of g.tokens) add(origin, group, t.name, t.value)
  }

  groupTokens('color', source.color, 'source')
  for (const [family, stack] of Object.entries(source.type.families)) {
    add('source', 'font', `font-${family}`, stack)
  }
  for (const group of source.type.groups) {
    for (const s of group.styles) {
      add(
        'source',
        'type',
        s.name,
        `${s.fontWeight} ${s.fontSize}/${s.lineHeight} {font-${group.family}}`,
      )
      if (s.letterSpacing) add('source', 'type', `${s.name}-tracking`, s.letterSpacing)
    }
  }
  for (const group of ['spacing', 'radius', 'shadow', 'size', 'blur'] as const) {
    groupTokens(group, source[group], 'source')
  }
  for (const [group, g] of Object.entries(web.groups)) groupTokens(group, g, 'web')

  const byName = new Map<string, Token>()
  for (const t of tokens) {
    const prev = byName.get(t.name)
    if (prev) {
      throw new Error(
        `gen:tokens: '${t.name}' iki kez tanımlı (${prev.origin}:${prev.group}, ${t.origin}:${t.group}); ` +
          'kaynakta olan ad web dosyasında tekrar edilmez',
      )
    }
    byName.set(t.name, t)
  }

  // Başvurular: hedef var; temasız token yalnız temasız token'a başvurur (yoksa :root'ta donar);
  // döngü yok.
  const refsOf = (t: Token) => [...`${t.dark} ${t.light}`.matchAll(REF)].map((m) => m[1] as string)
  for (const t of tokens) {
    for (const ref of refsOf(t)) {
      const target = byName.get(ref)
      if (!target) throw new Error(`gen:tokens: ${t.name} çözülemeyen başvuru {${ref}}`)
      if (!t.themed && target.themed) {
        throw new Error(`gen:tokens: temasız ${t.name} temalı {${ref}} token'ına başvuramaz`)
      }
    }
  }
  const visit = (t: Token, path: string[]) => {
    if (path.includes(t.name)) {
      throw new Error(`gen:tokens: döngüsel başvuru ${[...path, t.name].join(' → ')}`)
    }
    for (const ref of refsOf(t)) visit(byName.get(ref) as Token, [...path, t.name])
  }
  for (const t of tokens) visit(t, [])
  return tokens
}

const css = (value: string) => value.replace(REF, 'var(--$1)')
const header = (comment: (s: string) => string) =>
  comment(
    `BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. Kaynak: ${SOURCE_COPY} + ${WEB_TOKENS}; \`pnpm gen:tokens\`.`,
  ) + '\n'

function pinLine(pin: DesignTokenPin): string {
  return `Kaynak pini: ${pin.repo}@${pin.commit} — ${pin.path} (blob ${pin.blob}).`
}

export function renderCss(tokens: Token[], pin: DesignTokenPin): string {
  const lines = [header((s) => `/* ${s} */`) + `/* ${pinLine(pin)} */`, '']
  const block = (selector: string, extra: string[], body: string[]) => {
    lines.push(`${selector} {`, ...extra.map((l) => `  ${l}`), ...body, '}', '')
  }
  const decl = (list: Token[], theme: 'dark' | 'light') => {
    const out: string[] = []
    let group = ''
    for (const t of list) {
      if (t.group !== group) {
        group = t.group
        out.push(`  /* ${t.origin === 'source' ? 'kaynak' : 'web'} · ${group} */`)
      }
      out.push(`  --${t.name}: ${css(t[theme])};`)
    }
    return out
  }
  block(
    ':root',
    [],
    decl(
      tokens.filter((t) => !t.themed),
      'dark',
    ),
  )
  const themedTokens = tokens.filter((t) => t.themed)
  // Koyu varsayılan; açık tema yalnız [data-theme='light'] ile. Aynı özgüllük: açık blok sonra gelir.
  // İç içe [data-theme='dark'] (ör. her iki temada koyu kalan görüşme penceresi) koyu değerleri geri alır.
  block(":root,\n[data-theme='dark']", ['color-scheme: dark;'], decl(themedTokens, 'dark'))
  block("[data-theme='light']", ['color-scheme: light;'], decl(themedTokens, 'light'))
  return lines.join('\n')
}

/** Adı zaten Tailwind ad alanında olan token'lar (font-*, radius-*, shadow-*); mobil m-* ölçüleri girmez. */
const TW_PASSTHROUGH: Array<{ group: string; prefix: string }> = [
  { group: 'font', prefix: 'font-' },
  { group: 'radius', prefix: 'radius-' },
  { group: 'shadow', prefix: 'shadow-' },
]

export function renderTailwind(tokens: Token[]): string {
  const lines = [
    header((s) => `/* ${s} */`),
    '/* Tailwind varsayılan renk/yazı/köşe/gölge ölçekleri kapatılır: görünüm yalnız token’dan. */',
    '@theme {',
    '  --color-*: initial;',
    '  --font-*: initial;',
    '  --text-*: initial;',
    '  --radius-*: initial;',
    '  --shadow-*: initial;',
    '  --inset-shadow-*: initial;',
    '  --drop-shadow-*: initial;',
    '}',
    '',
    '/* Yardımcılar CSS değişkenine başvurur; tema geçişi (data-theme) otomatik. `reference`: Tailwind',
    '   bu değişkenleri yeniden yazmaz (font-*, radius-*, shadow-* adları tokens.gen.css ile aynıdır). */',
    '@theme inline reference {',
    '  --spacing: var(--space-1);',
  ]
  for (const t of tokens.filter((t) => t.group === 'color')) {
    lines.push(`  --color-${t.name}: var(--${t.name});`)
  }
  for (const { group, prefix } of TW_PASSTHROUGH) {
    for (const t of tokens.filter((t) => t.group === group && t.name.startsWith(prefix))) {
      lines.push(`  --${t.name}: var(--${t.name});`)
    }
  }
  lines.push('}', '')
  return lines.join('\n')
}

export function renderTs(tokens: Token[], pin: DesignTokenPin): string {
  const data = Object.fromEntries(
    tokens.map((t) => [
      t.name,
      { group: t.group, origin: t.origin, dark: css(t.dark), light: css(t.light) },
    ]),
  )
  return [
    header((s) => `// ${s}`).trimEnd(),
    '',
    `/** ${pinLine(pin)} */`,
    `export const DESIGN_TOKEN_PIN = ${JSON.stringify(pin, null, 2)} as const`,
    '',
    '/** Temalar; ilki varsayılan (K9 "koyu varsayılan"). */',
    "export const TOKEN_THEMES = ['dark', 'light'] as const",
    "export const DEFAULT_THEME = 'dark' as const",
    '',
    '/** Ad → { grup, köken, koyu, açık }. Değerler CSS’e hazırdır (başvurular var(--ad)). */',
    `export const TOKENS = ${JSON.stringify(data, null, 2)} as const`,
    '',
    'export type TokenName = keyof typeof TOKENS',
    '',
  ].join('\n')
}

/** Dosyaları okur, pini doğrular, üç çıktıyı döndürür (yazmaz). */
export function generate(root: string): Record<string, string> {
  const copy = readFileSync(resolve(root, SOURCE_COPY))
  const pinFile = JSON.parse(readFileSync(resolve(root, 'api-pin.json'), 'utf8')) as {
    designTokens?: unknown
  }
  const pin = verifyPin(pinFile.designTokens, copy)
  const source = JSON.parse(copy.toString('utf8')) as SourceFile
  const web = JSON.parse(readFileSync(resolve(root, WEB_TOKENS), 'utf8')) as WebFile
  const tokens = collectTokens(source, web)
  return {
    [`${OUT_DIR}/tokens.gen.css`]: renderCss(tokens, pin),
    [`${OUT_DIR}/tailwind.gen.css`]: renderTailwind(tokens),
    [`${OUT_DIR}/tokens.gen.ts`]: renderTs(tokens, pin),
  }
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url))
  let outputs: Record<string, string>
  try {
    outputs = generate(root)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
  for (const [file, content] of Object.entries(outputs)) writeFileSync(resolve(root, file), content)
  console.log(`gen:tokens: ${Object.keys(outputs).length} dosya üretildi`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
