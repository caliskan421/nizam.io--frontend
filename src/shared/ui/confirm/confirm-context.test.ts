// @vitest-environment node
// Mimari denetim (CX-F1-E-02): yazma başlatan her onay `confirmWrite` ile ve yazma onayın
// yakaladığı bağlamla başlar — tüketici bağlamı atlayamaz. Kaynak taranır (üretim dosyaları):
//  1. `confirmWrite(...)` çağrısının başlatıcısı `(context) => …` biçimindedir ve gövdesindeki
//     her `submit(` çağrısı `{ context }` taşır (bağlamsız submit yok);
//  2. boolean dönen eski yol (`useConfirm().confirm`, `{ confirm } = useConfirm()`) yoktur.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const SRC = join(ROOT, 'src')
const SELF = join(SRC, 'shared/ui/confirm')

/**
 * Bağlam parametresini henüz geçiremeyen tüketici: `useDeleteWorkItem().submit` (api/items.ts)
 * tek argümanlı; yazma kabulle aynı anda başlar, eylem bağlamı kabulde doğrulanan bağlamla aynı
 * anda yakalanır. `api/items.ts` geçişi eklenince bu liste BOŞALTILMALI (test aşağıda zorlar).
 */
const PENDING_PASSTHROUGH = new Set(['src/modules/work/components/forms/DeleteTaskAction.vue'])

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path)
    const prod = /\.(ts|vue)$/.test(name) && !/\.test\.ts$|\.d\.ts$/.test(name)
    return prod && !path.startsWith(SELF) ? [path] : []
  })
}

/** `name(` çağrılarının argüman metinleri (parantez dengesiyle). */
function callArgs(text: string, name: string): string[] {
  const out: string[] = []
  for (let at = text.indexOf(`${name}(`); at !== -1; at = text.indexOf(`${name}(`, at + 1)) {
    const open = at + name.length
    let depth = 0
    for (let i = open; i < text.length; i += 1) {
      if (text[i] === '(') depth += 1
      else if (text[i] === ')' && --depth === 0) {
        out.push(text.slice(open + 1, i))
        break
      }
    }
  }
  return out
}

const files = sources(SRC).map((path) => ({
  rel: relative(ROOT, path),
  text: readFileSync(path, 'utf8'),
}))
const writers = files.filter((f) => f.text.includes('confirmWrite('))

describe('onay → yazma bağlamı atlanamaz (CX-F1-E-02)', () => {
  it('yazma başlatan onay tüketicileri bulundu (tarama boş değil)', () => {
    expect(writers.map((f) => f.rel).sort()).toEqual(
      [
        'src/modules/work/components/files/use-file-actions.ts',
        'src/modules/work/components/forms/DeleteTaskAction.vue',
        'src/modules/work/components/forms/use-status-transition.ts',
        'src/modules/work/components/notes/use-note-actions.ts',
        'src/modules/work/components/subtasks/use-subtask-edit.ts',
      ].sort(),
    )
  })

  it.each(writers.map((f) => [f.rel, f.text] as const))(
    '%s: başlatıcı (context) => …, gövdedeki her submit bağlamlı',
    (rel, text) => {
      if (PENDING_PASSTHROUGH.has(rel)) return
      for (const args of callArgs(text, 'confirmWrite')) {
        expect(args, rel).toMatch(/\(\s*context\s*\)\s*=>/)
        const body = args.slice(args.search(/\(\s*context\s*\)\s*=>/))
        expect(body.replace(/\(\s*context\s*\)\s*=>/, ''), rel).toMatch(/\bcontext\b/)
        for (const submit of callArgs(body, 'submit')) {
          expect(submit, `${rel}: bağlamsız submit`).toMatch(/\{\s*context\s*\}/)
        }
      }
    },
  )

  it('bekleyen geçiş istisnası yalnız tek argümanlı silme sarmalayıcısı sürdükçe geçerli', () => {
    const items = readFileSync(join(SRC, 'modules/work/api/items.ts'), 'utf8')
    const wrapper = /async function submit\(([^)]*)\)/.exec(items)?.[1] ?? ''
    // Sarmalayıcı bağlam alırsa istisna kaldırılmalı: bu test o an kırmızıya döner.
    expect(wrapper.includes(','), 'api/items.ts bağlam geçiriyor: PENDING_PASSTHROUGH boşalt').toBe(
      false,
    )
    for (const rel of PENDING_PASSTHROUGH) {
      const text = files.find((f) => f.rel === rel)!.text
      // Yazma kabulle aynı anda başlar: başlatıcının gövdesi doğrudan submit çağrısıdır.
      for (const args of callArgs(text, 'confirmWrite')) {
        expect(args, rel).toMatch(/\(\s*\)\s*=>\s*\n?\s*remove\.submit\(/)
      }
    }
  })

  it('boolean dönen onay yolu yok: üretimde `confirm` alınmaz', () => {
    for (const { rel, text } of files) {
      expect(text, rel).not.toMatch(/\{\s*confirm\s*[,}][^}]*\}?\s*=\s*useConfirm\(\)/)
      expect(text, rel).not.toMatch(/useConfirm\(\)\.confirm\(/)
    }
  })
})
