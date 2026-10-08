// pnpm gen:tokens — tokens/tokens.json → web çıktıları (commit'lenir; CI diff = 0).
//
//   src/shared/tokens/tokens.gen.ts     çözülmüş veri (PrimeVue preset'i bunu okur)
//   src/shared/tokens/tokens.gen.css    CSS değişkenleri (:root açık, [data-theme='dark'] koyu)
//   src/shared/tokens/tailwind.gen.css  Tailwind v4 @theme eşlemesi (değişkenlere başvurur)
//
// JSON platformdan bağımsızdır: px sayıları burada rem'e çevrilir (16px = 1rem).
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'src/shared/tokens')

type Scale = Record<string, string>
type Tokens = {
  version: number
  palette: Record<string, Scale>
  modes: Record<'light' | 'dark', Record<string, string>>
  typography: {
    fontFamily: Record<string, string[]>
    fontSize: Record<string, number>
    fontWeight: Record<string, number>
    lineHeight: Record<string, number>
  }
  spacing: Record<string, number>
  radius: Record<string, number>
}

const tokens = JSON.parse(readFileSync(resolve(root, 'tokens/tokens.json'), 'utf8')) as Tokens

const HEX = /^#[0-9a-f]{6}$/i
const toneOrder = (a: string, b: string) => Number(a) - Number(b)
const byKey = <T>(obj: Record<string, T>, order?: (a: string, b: string) => number) =>
  Object.entries(obj).sort(([a], [b]) => (order ? order(a, b) : a.localeCompare(b)))

for (const [name, scale] of Object.entries(tokens.palette)) {
  for (const [tone, value] of Object.entries(scale)) {
    if (!HEX.test(value)) throw new Error(`tokens: palette.${name}.${tone} hex değil: ${value}`)
  }
}

function resolveRef(value: string, where: string): { palette: string; tone: string; hex: string } {
  const match = /^\{([a-z]+)\.(\d+)\}$/.exec(value)
  if (!match) throw new Error(`tokens: ${where} '{palet.ton}' biçiminde değil: ${value}`)
  const [, palette, tone] = match as unknown as [string, string, string]
  const hex = tokens.palette[palette]?.[tone]
  if (!hex) throw new Error(`tokens: ${where} çözülemedi: ${value}`)
  return { palette, tone, hex }
}

const rem = (px: number) => (px === 0 ? '0' : `${px / 16}rem`)
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const header =
  '/* BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. Kaynak: tokens/tokens.json; `pnpm gen:tokens`. */\n'

// Mod rolleri iki modda aynı anahtar kümesine sahip olmalı.
const lightKeys = Object.keys(tokens.modes.light).sort().join(',')
const darkKeys = Object.keys(tokens.modes.dark).sort().join(',')
if (lightKeys !== darkKeys) throw new Error('tokens: light/dark rol kümeleri farklı')

const modes = Object.fromEntries(
  (['light', 'dark'] as const).map((mode) => [
    mode,
    Object.fromEntries(
      byKey(tokens.modes[mode]).map(([role, value]) => [
        role,
        resolveRef(value, `modes.${mode}.${role}`),
      ]),
    ),
  ]),
) as Record<'light' | 'dark', Record<string, { palette: string; tone: string; hex: string }>>

// 1) CSS değişkenleri
const css: string[] = [header, ':root {']
for (const [name, scale] of byKey(tokens.palette)) {
  for (const [tone, hex] of byKey(scale, toneOrder)) css.push(`  --nz-${name}-${tone}: ${hex};`)
}
for (const [name, stack] of byKey(tokens.typography.fontFamily)) {
  css.push(`  --nz-font-${name}: ${stack.map((f) => (/\s/.test(f) ? `'${f}'` : f)).join(', ')};`)
}
for (const [name, px] of byKey(tokens.typography.fontSize))
  css.push(`  --nz-text-${name}: ${rem(px)};`)
for (const [name, w] of byKey(tokens.typography.fontWeight))
  css.push(`  --nz-font-weight-${name}: ${w};`)
for (const [name, lh] of byKey(tokens.typography.lineHeight))
  css.push(`  --nz-leading-${name}: ${lh};`)
for (const [name, px] of byKey(tokens.spacing, toneOrder))
  css.push(`  --nz-space-${name}: ${rem(px)};`)
for (const [name, px] of byKey(tokens.radius)) {
  css.push(`  --nz-radius-${name}: ${px >= 9999 ? '9999px' : rem(px)};`)
}
const roleLines = (mode: 'light' | 'dark') =>
  Object.entries(modes[mode]).map(
    ([role, ref]) => `  --nz-color-${kebab(role)}: var(--nz-${ref.palette}-${ref.tone});`,
  )
css.push(`  color-scheme: light;`, ...roleLines('light'), '}', '', ":root[data-theme='dark'] {")
css.push(`  color-scheme: dark;`, ...roleLines('dark'), '}', '')
writeFileSync(resolve(outDir, 'tokens.gen.css'), css.join('\n'))

// 2) Tailwind v4 tema eşlemesi (değerler CSS değişkenine başvurur; mod geçişi otomatik).
// `primary` ve `surface` paletlerinin Tailwind yardımcıları tailwindcss-primeui'den gelir
// (PrimeVue preset'i aynı değerleri taşır); burada çakışmasın diye üretilmez. Roller
// `nz-` önekiyle ayrışır: bg-nz-background, text-nz-text-muted …
const PRIMEUI_PALETTES = new Set(['primary', 'surface'])
const tw: string[] = [header, '@theme inline {']
for (const [name, scale] of byKey(tokens.palette)) {
  if (PRIMEUI_PALETTES.has(name)) continue
  for (const [tone] of byKey(scale, toneOrder))
    tw.push(`  --color-${name}-${tone}: var(--nz-${name}-${tone});`)
}
for (const role of Object.keys(modes.light))
  tw.push(`  --color-nz-${kebab(role)}: var(--nz-color-${kebab(role)});`)
for (const name of Object.keys(tokens.typography.fontFamily).sort())
  tw.push(`  --font-${name}: var(--nz-font-${name});`)
for (const name of Object.keys(tokens.typography.fontSize).sort())
  tw.push(`  --text-${name}: var(--nz-text-${name});`)
for (const name of Object.keys(tokens.radius).sort())
  tw.push(`  --radius-${name}: var(--nz-radius-${name});`)
tw.push(`  --spacing: ${rem(4)};`, '}', '')
writeFileSync(resolve(outDir, 'tailwind.gen.css'), tw.join('\n'))

// 3) Çözülmüş veri (TS)
const data = {
  version: tokens.version,
  palette: Object.fromEntries(
    byKey(tokens.palette).map(([n, s]) => [n, Object.fromEntries(byKey(s, toneOrder))]),
  ),
  modes: Object.fromEntries(
    Object.entries(modes).map(([m, roles]) => [
      m,
      Object.fromEntries(Object.entries(roles).map(([r, ref]) => [r, ref.hex])),
    ]),
  ),
  modeRefs: Object.fromEntries(
    Object.entries(modes).map(([m, roles]) => [
      m,
      Object.fromEntries(
        Object.entries(roles).map(([r, ref]) => [r, `${ref.palette}.${ref.tone}`]),
      ),
    ]),
  ),
}
writeFileSync(
  resolve(outDir, 'tokens.gen.ts'),
  header.replace('/*', '//').replace(' */', '') +
    `\nexport const TOKENS = ${JSON.stringify(data, null, 2)} as const\n`,
)

console.log(
  `gen:tokens: ${Object.keys(tokens.palette).length} palet, ${Object.keys(modes.light).length} rol × 2 mod`,
)
