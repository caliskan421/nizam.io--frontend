import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { NizamPreset } from './preset'
import { DEFAULT_THEME, TOKEN_THEMES, TOKENS, type TokenName } from './tokens.gen'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const kaynak = 'docs/tasarim/kaynak'
const designTokensCss = read(`${kaynak}/tema-sistemi/tokens.css`)
const designThemeCss = read(`${kaynak}/theme.css`)
const designBundleCss = read(`${kaynak}/tema-sistemi/bundle.css`)
const generatedCss = read('src/shared/tokens/tokens.gen.css')
const tailwindCss = read('src/shared/tokens/tailwind.gen.css')

type Theme = (typeof TOKEN_THEMES)[number]
type VarMap = Map<string, string>

/** Bildirilen özel özellikler (`--ad:`); seçicideki `.x--y:hover` gibi BEM adları sayılmaz. */
function declaredNames(text: string): Set<string> {
  return new Set([...text.matchAll(/(?:^|[{;\s])(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1] as string))
}

/** `seçici { gövde }` bloklarından, seçicisi tam eşleşenin bildirimleri. */
function blockVars(text: string, selector: string): VarMap {
  const map: VarMap = new Map()
  for (const chunk of text.split('}')) {
    const open = chunk.lastIndexOf('{')
    if (open < 0) continue
    const sel = chunk.slice(0, open).replace(/\/\*[\s\S]*?\*\//g, '')
    if (sel.trim().replace(/\s+/g, ' ') !== selector) continue
    for (const m of chunk.slice(open + 1).matchAll(/(--[a-z0-9-]+)\s*:([^;]+)/gi)) {
      map.set(m[1] as string, (m[2] as string).trim())
    }
  }
  return map
}

const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')
function resolveVars(value: string, vars: VarMap, depth = 0): string {
  if (depth > 10) throw new Error(`döngü: ${value}`)
  const out = value.replace(/var\((--[a-z0-9-]+)\)/g, (_, name: string) => {
    const v = vars.get(name)
    if (v === undefined) throw new Error(`tanımsız ${name}`)
    return v
  })
  return out === value ? norm(out) : resolveVars(out, vars, depth + 1)
}

/** Tasarım kopyasındaki tema başına değerler (theme.css `tokens.css`'i tamamlar). */
function designVars(theme: Theme): VarMap {
  return new Map([
    ...blockVars(designTokensCss, ':root'),
    ...blockVars(designThemeCss, ':root'),
    ...blockVars(designThemeCss, ':root, [data-theme="dark"]'),
    ...(theme === 'light' ? blockVars(designThemeCss, '[data-theme="light"]') : []),
  ])
}

/** `.16` ile `0.16` aynı değerdir (theme.css v85 gölgeleri baştaki sıfırı yazmaz). */
function zeroLead(value: string): string {
  return value.replace(/(?<![\d.])\.(\d)/g, '0.$1')
}

function generatedVars(theme: Theme): VarMap {
  return new Map(
    Object.entries(TOKENS).map(([name, t]) => [`--${name}`, t[theme]] as [string, string]),
  )
}

describe('tasarım kopyası ↔ üretilmiş token CSS', () => {
  const designNames = new Set([...declaredNames(designTokensCss), ...declaredNames(designThemeCss)])

  it('tokens.css + theme.css değişken adları ⊆ üretilmiş CSS', () => {
    const generated = declaredNames(generatedCss)
    expect(designNames.size).toBeGreaterThan(60)
    expect([...designNames].filter((name) => !generated.has(name))).toEqual([])
  })

  it.each(TOKEN_THEMES)('%s temada her tasarım değişkeninin değeri birebir aynı', (theme) => {
    const design = designVars(theme)
    const generated = generatedVars(theme)
    const mismatches = [...design.keys()]
      .map((name) => [
        name,
        resolveVars(design.get(name)!, design),
        resolveVars(`var(${name})`, generated),
      ])
      .filter(([, want, got]) => zeroLead(want!) !== zeroLead(got!))
    expect(mismatches).toEqual([])
  })

  it('theme.css ve bundle.css içindeki her var(--…) başvurusu üretilmiş CSS’te tanımlı', () => {
    const generated = declaredNames(generatedCss)
    const used = new Set(
      [...`${designThemeCss}\n${designBundleCss}`.matchAll(/var\((--[a-z0-9-]+)/gi)].map(
        (m) => m[1] as string,
      ),
    )
    expect([...used].filter((name) => !generated.has(name))).toEqual([])
  })

  it('koyu varsayılan: :root koyu bloğu taşır, açık tema yalnız [data-theme=light] ile', () => {
    expect(DEFAULT_THEME).toBe('dark')
    expect(generatedCss).toMatch(/:root,\n\[data-theme='dark'\] \{\n {2}color-scheme: dark;/)
    expect(generatedCss).toMatch(/\[data-theme='light'\] \{\n {2}color-scheme: light;/)
    expect(generatedCss.indexOf("[data-theme='light']")).toBeGreaterThan(
      generatedCss.indexOf("[data-theme='dark']"),
    )
  })

  it('rol renkleri ve Gantt renkleri token (sabit hex değil)', () => {
    const names: TokenName[] = ['role-admin', 'role-koord', 'role-uye', 'gp-todo', 'gp-late-line']
    for (const name of names) expect(TOKENS[name].group).toBe('color')
  })
})

describe('Tailwind ve PrimeVue eşlemesi', () => {
  it('her renk token’ı Tailwind --color-* olarak değişkene başvurur; varsayılan palet kapalı', () => {
    expect(tailwindCss).toContain('--color-*: initial;')
    for (const [name, t] of Object.entries(TOKENS)) {
      if (t.group === 'color') expect(tailwindCss).toContain(`--color-${name}: var(--${name});`)
    }
  })

  it('PrimeVue preset’i ham renk taşımaz; değerler token değişkenidir', () => {
    const text = JSON.stringify(NizamPreset.semantic)
    expect(text).toContain('var(--accent)')
    expect(text).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
    for (const m of text.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
      expect(Object.keys(TOKENS)).toContain(m[1])
    }
  })
})
