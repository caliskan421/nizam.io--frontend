// @vitest-environment node
// Mimari denetim (CX-F1-E-02): yazma başlatan her onay `confirmWrite` ile ve yazma onayın
// yakaladığı bağlamla başlar — tüketici bağlamı atlayamaz. Kaynak taranır (üretim dosyaları).
// Tüketiciler ELLE LİSTELENMEZ: `src/modules/**` içinde `confirmWrite(` / `useConfirm(` /
// `confirmImpact(` geçen her üretim dosyası (test ve `__tests__` hariç) taranır; yeni modül ya da
// işçi (W74, W75, W81…) satır eklemeden aynı kurallara tabidir. Kurallar:
//  1. `confirmWrite(...)` çağrısının başlatıcısı `(context) => …` biçimindedir ve gövdesindeki
//     her `submit(` çağrısı `{ context }` taşır (bağlamsız submit yok);
//  2. boolean dönen eski yol (`useConfirm().confirm`, `{ confirm } = useConfirm()`) yoktur;
//  3. dolaylı zincir (`use-status-transition.ts`: `confirmWrite → resend → send → submit`):
//     başlatıcı bağlamı `resend(context)` ile iletir ve `send`'in `submit` çağrısı `{ context }`
//     taşır (metin düzeyinde, yalnız bu bilinen zincir için);
//  4. `confirmImpact(outcome, …)` (sunucu `confirmation_required` devamı): ilk argüman aynı
//     dosyada `const <ad> = await …submit(<vars>, <seçenek>)` ile alınmış sonuçtur — devam isteği
//     motorun `outcome.confirm()`'üdür ve İLK eylemin bağlamını (kapsam + nesil) taşır; ilk
//     submit çağıranın seçeneğini (`{ context }` dahil) iletir (ikinci argüman var);
//  5. `outcome.confirm()` onay diyaloğu dışında çağrılmaz: modüllerde yalnız sonucu SARAN bir
//     `confirm: () => …` tanımının içinde geçebilir (ör. anahtarsız organizasyon sarmalayıcısı);
//     onaysız doğrudan devam yolu yoktur.
// NE GARANTİ ETMEZ: bu bir veri akışı analizi değildir — metin kalıbıdır. `useConfirm()`'ün
// kurulumda (eşzamanlı) alındığını metin denetlemez (çalışma anında `requireOwner` yakalar). Bağlamın gerçekten
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
const CONSUMER = /\b(confirmWrite|useConfirm|confirmImpact)\(/
const consumers = files.filter((f) => f.rel.startsWith('src/modules/') && CONSUMER.test(f.text))
const writers = consumers.filter((f) => f.text.includes('confirmWrite('))
const impacts = consumers.filter((f) => f.text.includes('confirmImpact('))
const modules = files.filter((f) => f.rel.startsWith('src/modules/'))

describe('onay → yazma bağlamı atlanamaz (CX-F1-E-02)', () => {
  it('tüketiciler taramayla bulunur (elle liste yok; tarama boş değil)', () => {
    // Bilinen tüketiciler alt küme olarak bulunmalı (tarayıcı bozulursa yakalanır); yeni
    // tüketiciler listeye eklenmeden aynı kurallardan geçer.
    expect(consumers.map((f) => f.rel)).toEqual(
      expect.arrayContaining([
        'src/modules/work/components/forms/DeleteTaskAction.vue',
        'src/modules/work/components/forms/use-status-transition.ts',
        'src/modules/organization/api/confirm.ts',
      ]),
    )
    expect(writers.length).toBeGreaterThan(0)
    expect(impacts.length).toBeGreaterThan(0)
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

  it.each(impacts.map((f) => [f.rel, f.text] as const))(
    '%s: confirmImpact devamı ilk eylemin sonucundan, ilk submit seçeneği iletir',
    (rel, text) => {
      for (const args of callArgs(text, 'confirmImpact')) {
        const outcome = /^\s*([A-Za-z_$][\w$]*)\s*,/.exec(args)?.[1]
        expect(outcome, `${rel}: confirmImpact ilk argümanı tanımlayıcı değil`).toBeDefined()
        const origin = new RegExp(`const\\s+${outcome}\\s*=\\s*await\\s+[\\w$.]*submit\\(`)
        expect(text, `${rel}: ${outcome} bir submit sonucundan alınmamış`).toMatch(origin)
        const at = text.search(origin)
        const [submit] = callArgs(text.slice(at), 'submit')
        expect(submit, `${rel}: ilk submit seçeneği iletmiyor`).toMatch(/,\s*\S/)
      }
    },
  )

  it('outcome.confirm() yalnız sonucu saran confirm: () => … tanımında (onaysız devam yok)', () => {
    for (const { rel, text } of modules) {
      for (const line of text.split('\n').filter((l) => /\.confirm\(\)/.test(l))) {
        expect(line, rel).toMatch(/confirm:\s*(async\s*)?\(\)\s*=>/)
      }
    }
  })
})
