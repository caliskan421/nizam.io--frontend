// @vitest-environment node
// Mimari denetim (CX-F1-E-02): yazma başlatan her onay `confirmWrite` ile ve yazma onayın
// yakaladığı bağlamla başlar — tüketici bağlamı atlayamaz. Kaynak taranır (üretim dosyaları):
//  1. `confirmWrite(...)` çağrısının başlatıcısı `(context) => …` biçimindedir ve gövdesindeki
//     her `submit(` çağrısı `{ context }` taşır (bağlamsız submit yok);
//  2. boolean dönen eski yol (`useConfirm().confirm`, `{ confirm } = useConfirm()`) yoktur;
//  3. dolaylı zincir (`use-status-transition.ts`: `confirmWrite → resend → send → submit`):
//     başlatıcı bağlamı `resend(context)` ile iletir ve `send`'in `submit` çağrısı `{ context }`
//     taşır (metin düzeyinde, yalnız bu bilinen zincir için).
// NE GARANTİ ETMEZ: bu bir veri akışı analizi değildir — metin kalıbıdır. Bağlamın gerçekten
// İLK eylemin bağlamı olduğu ve bayatsa yazma çıkmadığı davranış testleriyle sabitlenir:
// tüketici testlerinde sarılmış gerçek hook'un `submit` ikinci argümanı denetlenir
// (DeleteTaskAction / use-file-actions / use-note-actions / use-subtask-edit (c);
// use-status-transition (e): ikinci submit'in bağlamı = ilk geçişin `failed.context`).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const SRC = join(ROOT, 'src')
const SELF = join(SRC, 'shared/ui/confirm')

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

  it('dolaylı zincir: use-status-transition bağlamı resend → send → submit boyunca iletir', () => {
    const rel = 'src/modules/work/components/forms/use-status-transition.ts'
    const text = files.find((f) => f.rel === rel)!.text
    expect(text).toMatch(/\(context\)\s*=>\s*resend\(context\)/)
    const send = text.slice(text.indexOf('async function send('))
    expect(send).toMatch(/^async function send\([^)]*context\?: ActionContext\)/)
    const [submit] = callArgs(send, 'submit')
    expect(submit, `${rel}: send içindeki submit bağlamsız`).toMatch(/\{\s*context\s*\}/)
  })

  it('boolean dönen onay yolu yok: üretimde `confirm` alınmaz', () => {
    for (const { rel, text } of files) {
      expect(text, rel).not.toMatch(/\{\s*confirm\s*[,}][^}]*\}?\s*=\s*useConfirm\(\)/)
      expect(text, rel).not.toMatch(/useConfirm\(\)\.confirm\(/)
    }
  })
})
