// designStub ↔ docs/backend-eksikleri/kayit.md tutarlılık denetimi (yol haritası K13,
// ortak-kurallar §3). Saf fonksiyonlar: kayıt metni + kaynak dosyalar → sorun listesi.
// tests/lint/design-stub.test.ts hem gerçek depoya hem kırmızı/yeşil örneklere uygular.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export interface RegistryRow {
  id: string
  phase: string
  size: string
  current: string
  status: string
}

export interface SourceFile {
  path: string
  text: string
}

export interface StubUse {
  id: string
  file: string
  line: number
}

const COLUMN_COUNT = 9
const ID = /^BE-\d{3}$/
export const KNOWN_STATUSES = ['açık', "backend'de", 'bağlandı', 'vazgeçildi'] as const

/** Kayıt tablosunu satırlara ayırır; biçim bozuksa hata fırlatır (sessiz geçiş yok). */
export function parseRegistry(markdown: string): Map<string, RegistryRow> {
  const rows = new Map<string, RegistryRow>()
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('| BE-')) continue
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
    const [id, phase, , , , current, , size, status] = cells.map((c) => c.trim())
    if (cells.length !== COLUMN_COUNT || !id || !ID.test(id)) {
      throw new Error(`kayit.md satırı ${COLUMN_COUNT} sütun değil ya da kimlik bozuk: ${line}`)
    }
    if (rows.has(id)) throw new Error(`kayit.md: ${id} iki kez`)
    rows.set(id, {
      id,
      phase: phase ?? '',
      size: size ?? '',
      current: current ?? '',
      status: status ?? '',
    })
  }
  return rows
}

/** Durum sütununun ilk sözcüğü (`vazgeçildi (gerekçe)` → `vazgeçildi`). */
export function statusOf(row: RegistryRow): string {
  return KNOWN_STATUSES.find((s) => row.status.startsWith(s)) ?? row.status
}

/**
 * Satıra stub bağlanabilir mi? null = evet; aksi hâlde neden (ortak-kurallar §3):
 * yalnız `açık`/`backend'de` ve **işlev** eksiği; belge kalemi ve v1 dışı modül (faz `sonra`) değil.
 */
export function stubRejection(row: RegistryRow | undefined): string | null {
  if (!row) return 'kayıtta yok'
  const status = statusOf(row)
  if (status === 'bağlandı') return "durumu 'bağlandı': backend bağlandı, stub kaldırılmalı"
  if (status === 'vazgeçildi') return "durumu 'vazgeçildi': backend eksiği değil, stub kullanılmaz"
  if (status !== 'açık' && status !== "backend'de") return `bilinmeyen durum '${row.status}'`
  if (/\(belge\)/.test(row.size) || /stub yok/i.test(row.current)) {
    return 'belge kalemi: davranış var, sözleşme anlatımı eksik — stub yok'
  }
  if (row.phase === 'sonra') return "v1 dışı modül (faz 'sonra'): menüde gizli, stub yok"
  return null
}

const CALL = /\bdesignStub\s*(?:<[^>()]*>\s*)?\(/g
const CALL_WITH_ID = /^designStub\s*(?:<[^>()]*>\s*)?\(\s*(['"])(BE-\d{3})\1\s*,/
const TAG = /<(DesignStub|design-stub)\b([^>]*)>/g
const STATIC_ID = /(?:^|\s)id\s*=\s*"([^"]*)"/
// `:id="'BE-NNN'"` statik dize bağlamasıdır (W12 DesignStub); başka her bağlama dinamiktir.
const BOUND_LITERAL_ID = /(?:^|\s)(?::id|v-bind:id)\s*=\s*"\s*'([^']*)'\s*"/
const DYNAMIC_ID = /(?:^|\s)(?::id|v-bind:id|v-bind)\s*=/
const ALIAS_IMPORT = /\bdesignStub\s+as\s+\w+/

/** Yorumları (satır, blok ve HTML yorumu) satır sayısını koruyarak boşaltır: belge örneği kullanım sayılmaz. */
export function stripComments(text: string): string {
  const blank = (m: string): string => m.replace(/[^\n]/g, ' ')
  return text
    .replace(/<!-{2}[\s\S]*?-{2}>/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, lead: string) => lead + blank(m.slice(lead.length)))
}

function lineAt(text: string, index: number): number {
  return text.slice(0, index).split('\n').length
}

/** Kaynak dosyadaki stub kullanımları + statik okunamayan kullanımlar (sorun). */
export function scanSource(file: SourceFile): { uses: StubUse[]; problems: string[] } {
  const text = stripComments(file.text)
  const uses: StubUse[] = []
  const problems: string[] = []
  const where = (index: number): string => `${file.path}:${lineAt(text, index)}`
  for (const match of text.matchAll(CALL)) {
    const found = CALL_WITH_ID.exec(text.slice(match.index))
    if (found?.[2]) uses.push({ id: found[2], file: file.path, line: lineAt(text, match.index) })
    else problems.push(`${where(match.index)}: designStub kimliği dize literali BE-NNN değil`)
  }
  for (const match of text.matchAll(TAG)) {
    const attrs = match[2] ?? ''
    const bound = BOUND_LITERAL_ID.exec(attrs)?.[1]
    const staticId = bound ?? STATIC_ID.exec(attrs)?.[1]
    if (bound === undefined && DYNAMIC_ID.test(attrs)) {
      problems.push(`${where(match.index)}: DesignStub id bağlaması dinamik`)
    } else if (staticId && ID.test(staticId)) {
      uses.push({ id: staticId, file: file.path, line: lineAt(text, match.index) })
    } else problems.push(`${where(match.index)}: DesignStub statik id="BE-NNN" taşımıyor`)
  }
  const alias = ALIAS_IMPORT.exec(text)
  if (alias) problems.push(`${where(alias.index)}: designStub takma adla içe aktarılmış`)
  return { uses, problems }
}

/** Bütün kullanımları kayda karşı denetler; boş dizi = yeşil. */
export function checkDesignStubs(registryMarkdown: string, files: SourceFile[]): string[] {
  const registry = parseRegistry(registryMarkdown)
  const problems: string[] = []
  for (const file of files) {
    const scanned = scanSource(file)
    problems.push(...scanned.problems)
    for (const use of scanned.uses) {
      const reason = stubRejection(registry.get(use.id))
      if (reason) problems.push(`${use.file}:${use.line}: ${use.id} — ${reason}`)
    }
  }
  return problems
}

/** `src/` altındaki .ts/.vue dosyaları; designStub'ın kendi tanım klasörü hariç. */
export function collectSources(root: string, srcDir = 'src'): SourceFile[] {
  const own = join(srcDir, 'shared', 'design-stub')
  const out: SourceFile[] = []
  const walk = (dir: string): void => {
    for (const name of readdirSync(join(root, dir))) {
      const rel = join(dir, name)
      if (rel === own) continue
      if (statSync(join(root, rel)).isDirectory()) walk(rel)
      else if (/\.(ts|vue)$/.test(name) && !name.endsWith('.d.ts')) {
        out.push({
          path: relative('.', rel).split(sep).join('/'),
          text: readFileSync(join(root, rel), 'utf8'),
        })
      }
    }
  }
  walk(srcDir)
  return out
}
