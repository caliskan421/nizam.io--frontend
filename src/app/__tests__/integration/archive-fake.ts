// W127 · O3 arşiv entegrasyonu: durumlu sahte arşiv sunucusu. W82a harness'inin (`createBackend`)
// üstüne `server.use` ile eklenir; yetki çağıranın belirtecinden, görünürlük sunucu tarafında
// uygulanır (yönetici program geneli, koordinatör kendi departmanı, üye yalnız atandığı
// görevlerin dosyaları). S3 uçları program + departman başlığı olmadan 400 döner (başlıksız
// istek hata sayılır); S2 program arşivi uçları (`/v1/program/archive/*`, v0.23) yalnız şirket
// yöneticisine açıktır (K/Ü 403 `records.not_authorized`), departman başlığı kabul etmez;
// dosya işlemi başlığı dosyanın departmanı değilse 404 `records.file_not_found`. Rol dizesi yok:
// kapsam yalnız üyelik satırlarından okunur.
import { http, HttpResponse } from 'msw'

import { fakeOrg, ORIGIN, envelope, json, type Account, type Item, type OrgDb } from './fake-org'

export interface FakeFile {
  file_id: string
  work_item_id: string
  department_id: string
  display_name: string
  content_type: string
  size_bytes: number
  tag: string
  uploaded_by_account_id: string
  /** Yükleme zamanı (UTC); sıra ve `last_uploaded_at` buradan. */
  created_at: string
  subtask_id?: string
}

export interface ArchiveState {
  files: FakeFile[]
  seq: number
  /** Anahtar → oluşan dosya (aynı anahtarla tekrar aynı sonucu döndürür). */
  keys: Map<string, FakeFile>
  /** Sonraki `attachFile` isteği için: 'drop' = yanıt kaybolur (ağ hatası), dosya yine oluşur. */
  uploadMode: 'ok' | 'lose-response' | 'lose-once'
  /** `downloadTicket` / tüketim davranışı. */
  ticket: 'ok' | 'rate-limited' | 'target-invalid'
  redeem: 'ok' | 'too-large' | 'too-many' | 'rate-limited' | 'export-busy' | 'truncated'
  tickets: Map<string, { path: string; program: string; department: string }>
  /** Tüketilen biletlerin hedefi (yol + sorgu, başlıklar). */
  redeemed: Array<{ path: string; program: string; department: string }>
  /** `retagFile` çağrıları (başarılı olanlar). */
  retags: Array<{ file_id: string; tag: string }>
  /** `moveFile` kayıtları (W194): hedef, başlık departmanı, anahtar var mı. */
  moves: Array<{ file_id: string; body: unknown; department: string; keyed: boolean }>
  /** Sonraki `moveFile` yanıtı: 'lose' = dosya taşınır ama yanıt kaybolur; diğerleri sunucu hataları. */
  moveMode: 'ok' | 'source-completed' | 'lose'
  /** Görev başına dosya tavanı (sunucu; istemci bilmez). */
  capacity: number
  /** Yanıtı bekletilen istekler (arşiv uçları harness `hold`unun önüne geçtiği için burada). */
  holds: Array<{ method: string; path: string; gate: Promise<void>; arrived: () => void }>
}

export function createArchiveState(): ArchiveState {
  return {
    files: [],
    seq: 0,
    keys: new Map(),
    uploadMode: 'ok',
    ticket: 'ok',
    redeem: 'ok',
    tickets: new Map(),
    redeemed: [],
    retags: [],
    moves: [],
    moveMode: 'ok',
    capacity: 100,
    holds: [],
  }
}

export function file(
  id: string,
  work: string,
  dept: string,
  uploader: string,
  patch: Partial<FakeFile> = {},
): FakeFile {
  return {
    file_id: id,
    work_item_id: work,
    department_id: dept,
    display_name: `${id}.pdf`,
    content_type: 'application/pdf',
    size_bytes: 2048,
    tag: 'sonuc',
    uploaded_by_account_id: uploader,
    created_at: '2026-11-10T09:00:00Z',
    ...patch,
  }
}

const PNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])

interface Gate {
  account: Account
  program: string
  department: string
}

class Fake {
  constructor(
    readonly db: OrgDb,
    readonly state: ArchiveState,
  ) {}

  me(request: Request): Account | null {
    return fakeOrg.actorOf(this.db, request)
  }
  teamRow(account: Account, program: string, department: string) {
    return this.db.memberships.find(
      (m) =>
        m.account_id === account.account_id &&
        m.program_id === program &&
        m.department_id === department,
    )
  }
  assigned(account: Account, work: string): boolean {
    const found = this.db.items.find((i) => i.work_item_id === work)
    return found?.assignee_account_ids.includes(account.account_id) ?? false
  }
  memberOnly(account: Account, program: string, department: string): boolean {
    return !account.admin && this.teamRow(account, program, department)?.team === 'member'
  }
  /** S3 kapısı: kimlik, başlıklar, kapsam. */
  gate(request: Request): Gate | Response {
    const account = this.me(request)
    if (!account) return envelope('platform.unauthenticated', 401)
    const program = request.headers.get('X-Nizamio-Program')
    const department = request.headers.get('X-Nizamio-Department')
    if (!program || !department) return envelope('platform.scope_required', 400)
    if (!account.admin && !this.teamRow(account, program, department)) {
      return envelope('records.not_authorized', 403)
    }
    return { account, program, department }
  }
  /** S2 kapısı: kimlik + program başlığı; yalnız şirket yöneticisi (RECORDS-K39). */
  gateProgram(request: Request): { account: Account; program: string } | Response {
    const account = this.me(request)
    if (!account) return envelope('platform.unauthenticated', 401)
    const program = request.headers.get('X-Nizamio-Program')
    if (!program) return envelope('platform.scope_required', 400)
    if (!account.admin) return envelope('records.not_authorized', 403)
    return { account, program }
  }
  /** Programdaki (isteğe bağlı tek departmandaki) bütün dosyalar (yönetici). */
  programFiles(program: string, department: string | null): FakeFile[] {
    return this.state.files.filter(
      (f) =>
        this.db.items.some((i) => i.work_item_id === f.work_item_id && i.program_id === program) &&
        (department === null || f.department_id === department),
    )
  }
  nameOf(accountId: string): string | null {
    return this.db.accounts.find((a) => a.account_id === accountId)?.full_name ?? null
  }
  /** Liste satırı (`FileListItem`): departman, yükleme zamanı, yükleyen adı dahil. */
  row(f: FakeFile) {
    return {
      ...record(f),
      department_id: f.department_id,
      uploaded_by_account_id: f.uploaded_by_account_id,
      uploaded_by_full_name: this.nameOf(f.uploaded_by_account_id),
    }
  }
  /** Dosya işlemi: başlık dosyanın departmanıyla eşleşmezse 404 (yanlış başlık = bulunamadı). */
  fileOf(request: Request, id: string): { file: FakeFile; gate: Gate } | Response {
    const gate = this.gate(request)
    if (gate instanceof Response) return gate
    const file = this.state.files.find((x) => x.file_id === id)
    if (!file || file.department_id !== gate.department) {
      return envelope('records.file_not_found', 404)
    }
    return { file, gate }
  }
  /** Çağıranın o departmanda görebildiği dosyalar. */
  visible({ account, program, department }: Gate): FakeFile[] {
    return this.state.files.filter((f) => {
      if (!this.db.items.some((i) => i.work_item_id === f.work_item_id && i.program_id === program))
        return false
      if (account.admin) return true
      if (f.department_id !== department) return false
      return (
        !this.memberOnly(account, program, department) || this.assigned(account, f.work_item_id)
      )
    })
  }
}

/** `FileRecord` (yazma yanıtları): liste satırından `department_id`/yükleyen adı olmadan. */
const record = (f: FakeFile) => ({
  file_id: f.file_id,
  work_item_id: f.work_item_id,
  display_name: f.display_name,
  content_type: f.content_type,
  size_bytes: f.size_bytes,
  tag: f.tag,
  created_at: f.created_at,
  ...(f.subtask_id ? { subtask_id: f.subtask_id } : {}),
})

function limited(status: number, code: string, retryAfter: string) {
  return HttpResponse.json(
    { code, message: 'x', request_id: 'r', fields: [] },
    { status, headers: { 'Retry-After': retryAfter } },
  )
}

/** Klasör kartı (`ArchiveFolder`): dosya/görev sayısı, bayt, son yükleme (RECORDS-K41). */
function folderCard(
  files: FakeFile[],
  card: { folder_id: string; name: string; is_virtual: boolean },
) {
  const times = files.map((x) => x.created_at).sort()
  return {
    ...card,
    file_count: files.length,
    task_count: new Set(files.map((x) => x.work_item_id)).size,
    total_bytes: files.reduce((sum, x) => sum + x.size_bytes, 0),
    last_uploaded_at: times.at(-1) ?? null,
  }
}

function withTotals<T extends ReturnType<typeof folderCard>>(folders: T[]) {
  const times = folders.map((x) => x.last_uploaded_at).filter((x): x is string => x !== null)
  return {
    folders,
    totals: {
      file_count: folders.reduce((sum, x) => sum + x.file_count, 0),
      task_count: folders.reduce((sum, x) => sum + x.task_count, 0),
      total_bytes: folders.reduce((sum, x) => sum + x.total_bytes, 0),
      last_uploaded_at: times.sort().at(-1) ?? null,
    },
  }
}

/** `archiveTasks` / `programArchiveTasks`: dosyalı görevler; `include_empty=true` dosyasızları da. */
function taskList(f: Fake, files: FakeFile[], live: Item[], request: Request) {
  const q = new URL(request.url).searchParams
  const empty = q.get('include_empty')
  if (empty !== null && empty !== 'true' && empty !== 'false') {
    return envelope('records.input_invalid', 422, [
      { field: 'include_empty', code: 'records.input_invalid' },
    ])
  }
  const withFiles = [...new Set(files.map((x) => x.work_item_id))]
  const ids = empty === 'true' ? [...withFiles, ...live.map((i) => i.work_item_id)] : withFiles
  const unique = [...new Set(ids)]
  const rows = unique
    .map((id) => f.db.items.find((i) => i.work_item_id === id))
    .filter((i): i is Item => i !== undefined)
    .map((i) => ({
      work_item_id: i.work_item_id,
      title: i.title,
      department_id: i.department_id,
      file_count: files.filter((x) => x.work_item_id === i.work_item_id).length,
    }))
    // Dosyalılar önce (RECORDS-K42).
    .sort((a, b) => b.file_count - a.file_count)
  return json({ tasks: rows })
}

function uploaderList(f: Fake, files: FakeFile[]) {
  const ids = [...new Set(files.map((x) => x.uploaded_by_account_id))]
  return json({
    uploaders: ids,
    uploader_details: ids.map((id) => ({ account_id: id, full_name: f.nameOf(id) })),
  })
}

function listHandlers(f: Fake) {
  const { db, state } = f
  return [
    http.get(`${ORIGIN}/v1/records/archive/folders`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      const { account, program, department } = g
      if (account.admin) {
        return json(
          withTotals(
            db.links
              .filter((l) => l.program_id === program)
              .map((l) =>
                folderCard(
                  state.files.filter((x) => x.department_id === l.department_id),
                  { folder_id: l.department_id, name: l.display_name, is_virtual: false },
                ),
              ),
          ),
        )
      }
      const visible = f.visible(g)
      if (f.memberOnly(account, program, department)) {
        return json(
          withTotals([
            folderCard(visible, { folder_id: 'my-tasks', name: 'Görevlerim', is_virtual: true }),
          ]),
        )
      }
      const link = db.links.find((l) => l.program_id === program && l.department_id === department)
      const name = link?.display_name ?? department
      return json(
        withTotals([folderCard(visible, { folder_id: department, name, is_virtual: false })]),
      )
    }),
    http.get(`${ORIGIN}/v1/records/archive/tasks`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      const live = db.items.filter(
        (i) =>
          i.program_id === g.program &&
          i.department_id === g.department &&
          (!f.memberOnly(g.account, g.program, g.department) ||
            f.assigned(g.account, i.work_item_id)),
      )
      return taskList(f, f.visible(g), live, request)
    }),
    http.get(`${ORIGIN}/v1/records/archive/uploaders`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      return uploaderList(f, f.visible(g))
    }),
  ]
}

function programListHandlers(f: Fake) {
  const { db } = f
  return [
    // S2 (v0.23, RECORDS-K39): yönetici program geneli; `department_id` süzgeci isteğe bağlı.
    http.get(`${ORIGIN}/v1/program/archive/folders`, ({ request }) => {
      const g = f.gateProgram(request)
      if (g instanceof Response) return g
      return json(
        withTotals(
          db.links
            .filter((l) => l.program_id === g.program)
            .map((l) =>
              folderCard(f.programFiles(g.program, l.department_id), {
                folder_id: l.department_id,
                name: l.display_name,
                is_virtual: false,
              }),
            ),
        ),
      )
    }),
    http.get(`${ORIGIN}/v1/program/archive/tasks`, ({ request }) => {
      const g = f.gateProgram(request)
      if (g instanceof Response) return g
      const department = new URL(request.url).searchParams.get('department_id')
      const live = db.items.filter(
        (i) =>
          i.program_id === g.program && (department === null || i.department_id === department),
      )
      return taskList(f, f.programFiles(g.program, department), live, request)
    }),
    http.get(`${ORIGIN}/v1/program/archive/uploaders`, ({ request }) => {
      const g = f.gateProgram(request)
      if (g instanceof Response) return g
      const department = new URL(request.url).searchParams.get('department_id')
      return uploaderList(f, f.programFiles(g.program, department))
    }),
  ]
}

function fileReadHandlers(f: Fake) {
  const { state } = f
  return [
    http.get(`${ORIGIN}/v1/records/archive/attachments`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      return json(attachmentPage(f, f.visible(g), new URL(request.url).searchParams))
    }),
    http.get(`${ORIGIN}/v1/program/archive/attachments`, ({ request }) => {
      const g = f.gateProgram(request)
      if (g instanceof Response) return g
      const q = new URL(request.url).searchParams
      return json(attachmentPage(f, f.programFiles(g.program, q.get('department_id')), q))
    }),
    http.get(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) => {
      if (!f.me(request)) return envelope('platform.unauthenticated', 401)
      return json({
        files: state.files.filter((x) => x.work_item_id === params.id).map((x) => f.row(x)),
      })
    }),
  ]
}

/** `search_scope=all` (RECORDS-K47): iki karakterden itibaren görev başlığı ve yükleyen adı da aranır. */
function scopedSearch(f: Fake, x: FakeFile, search: string, q: URLSearchParams): boolean {
  if (x.display_name.toLowerCase().includes(search)) return true
  if (q.get('search_scope') !== 'all' || [...search].length < 2) return false
  const title = f.db.items.find((i) => i.work_item_id === x.work_item_id)?.title ?? ''
  const uploader = f.nameOf(x.uploaded_by_account_id) ?? ''
  return [title, uploader].some((t) => t.toLocaleLowerCase('tr').includes(search))
}

function attachmentPage(f: Fake, visible: FakeFile[], q: URLSearchParams) {
  const search = (q.get('search') ?? '').toLocaleLowerCase('tr')
  const category = q.get('mime_category')
  const mimeOf = (x: FakeFile) => (x.content_type.startsWith('image/') ? 'gorsel' : 'belge')
  const matches = (x: FakeFile) =>
    (!q.get('work_item_id') || x.work_item_id === q.get('work_item_id')) &&
    (!q.get('tag') || x.tag === q.get('tag')) &&
    (!category || mimeOf(x) === category) &&
    (!q.get('uploader_id') || x.uploaded_by_account_id === q.get('uploader_id')) &&
    (!search || scopedSearch(f, x, search, q))
  let list = visible.filter(matches)
  if (q.get('sort') === 'name') {
    list = [...list].sort((a, b) => a.display_name.localeCompare(b.display_name))
  } else if (q.get('sort') === 'size') {
    list = [...list].sort((a, b) => b.size_bytes - a.size_bytes)
  } else {
    // Varsayılan sıra: yükleme zamanı azalan (son eklenen önce).
    list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const limit = Number(q.get('limit') ?? 50)
  const start = Number(q.get('cursor') ?? 0)
  const next = start + limit < list.length ? String(start + limit) : undefined
  return {
    files: list.slice(start, start + limit).map((x) => f.row(x)),
    // Süzgece uyan kümenin boyu: imleçten bağımsız (RECORDS-K41).
    total: list.length,
    ...(next ? { next_cursor: next } : {}),
  }
}

function createFile(f: Fake, request: Request, workId: string, g: Gate) {
  const { state, db } = f
  const key = request.headers.get('Idempotency-Key')
  if (!key) return envelope('platform.idempotency_key_required', 400)
  const known = state.keys.get(key)
  if (known) return json(record(known), 201)
  const work = db.items.find((i) => i.work_item_id === workId)
  // Başlık görevin departmanı olmalı (yönetici için seçeneğin `department_id`si).
  if (!work || work.department_id !== g.department) return envelope('work.not_found', 404)
  const tag = new URL(request.url).searchParams.get('tag') ?? ''
  if (!TAGS.includes(tag)) {
    return envelope('records.input_invalid', 422, [{ field: 'tag', code: 'records.tag_invalid' }])
  }
  state.seq += 1
  const created = file(
    `fu-${state.seq}`,
    workId,
    work.department_id,
    g.account.account_id,
    uploadFields(request, tag),
  )
  created.created_at = new Date(Date.UTC(2026, 10, 11, 9, 0, state.seq)).toISOString()
  state.files.push(created)
  state.keys.set(key, created)
  if (state.uploadMode !== 'ok') {
    if (state.uploadMode === 'lose-once') state.uploadMode = 'ok'
    return HttpResponse.error()
  }
  return json(record(created), 201)
}

/**
 * Yüklenen dosya alanları. Gövde OKUNMAZ: jsdom `FormData` gövdesi undici akışında `text()` /
 * `formData()` ile askıda kalır (tarayıcıda olmayan jsdom sınırı); `Content-Type` çok parçalı
 * olduğu doğrulanır, ad sabittir.
 */
function uploadFields(request: Request, tag: string): Partial<FakeFile> {
  const multipart = (request.headers.get('Content-Type') ?? '').startsWith('multipart/form-data')
  return {
    display_name: multipart ? 'yuklenen.pdf' : 'bozuk-govde',
    content_type: 'application/pdf',
    size_bytes: 3,
    tag,
  }
}

const TAGS = ['ister', 'plan', 'girdi', 'analiz', 'cikti', 'sonuc']

/** Taşıma kaynağında ad yetkisi (yönetici, koordinatör, ekip satırı olan yükleyen). */
function mayRename(f: Fake, source: FakeFile, gate: Gate): boolean {
  const row = f.teamRow(gate.account, gate.program, gate.department)
  return (
    gate.account.admin ||
    row?.team === 'coordinator' ||
    (source.uploaded_by_account_id === gate.account.account_id && row !== undefined)
  )
}

/** Hedef görev + tavan denetimi; sorun varsa hata yanıtı, yoksa hedef görev. */
function moveTarget(f: Fake, source: FakeFile, gate: Gate, workId: string): Item | Response {
  const target = f.db.items.find((i) => i.work_item_id === workId && i.program_id === gate.program)
  if (!target) {
    return envelope('records.input_invalid', 422, [
      { field: 'work_item_id', code: 'records.input_invalid' },
    ])
  }
  const inTarget = f.state.files.filter((x) => x.work_item_id === workId).length
  if (source.work_item_id !== workId && inTarget >= f.state.capacity) {
    return envelope('records.too_many_files', 422)
  }
  return target
}

/** Hedefte aynı ad varsa "ad (2).uzantı" numaralanır (409 değil); kaydı hedefe bağlar. */
function relocate(f: Fake, source: FakeFile, target: Item, subtaskId?: string): void {
  if (source.work_item_id !== target.work_item_id) {
    const taken = (n: string) =>
      f.state.files.some((x) => x.work_item_id === target.work_item_id && x.display_name === n)
    const [stem, ext = ''] = source.display_name.split(/\.(?=[^.]+$)/)
    for (let n = 2; taken(source.display_name); n += 1) {
      source.display_name = `${stem} (${n})${ext ? `.${ext}` : ''}`
    }
    source.work_item_id = target.work_item_id
    source.department_id = target.department_id
  }
  if (subtaskId) source.subtask_id = subtaskId
  else delete source.subtask_id
}

/** `moveFile` (v0.26, RECORDS-K46): kaynakta ad yetkisi, aynı programda hedef görev, tavan. */
function moveHandler(f: Fake) {
  return http.patch(`${ORIGIN}/v1/files/:id/work-item`, async ({ request, params }) => {
    const hit = f.fileOf(request, String(params.id))
    if (hit instanceof Response) return hit
    const { file: source, gate } = hit
    const body = (await request.json()) as { work_item_id: string; subtask_id?: string }
    f.state.moves.push({
      file_id: source.file_id,
      body,
      department: gate.department,
      keyed: request.headers.has('Idempotency-Key'),
    })
    if (!mayRename(f, source, gate)) return envelope('records.not_authorized', 403)
    if (f.state.moveMode === 'source-completed') return envelope('records.source_completed', 409)
    const target = moveTarget(f, source, gate, body.work_item_id)
    if (target instanceof Response) return target
    relocate(f, source, target, body.subtask_id)
    return f.state.moveMode === 'lose' ? HttpResponse.error() : json(record(source))
  })
}

function writeHandlers(f: Fake) {
  const { state } = f
  return [
    http.post(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) => {
      const g = f.gate(request)
      return g instanceof Response ? g : createFile(f, request, String(params.id), g)
    }),
    http.patch(`${ORIGIN}/v1/files/:id/name`, async ({ request, params }) => {
      const hit = f.fileOf(request, String(params.id))
      if (hit instanceof Response) return hit
      const { file: target } = hit
      const name = ((await request.json()) as { display_name: string }).display_name
      const field = [{ field: 'display_name', code: 'records.name_invalid' }]
      if (!name.trim() || name.includes('/')) return envelope('records.name_invalid', 422, field)
      const taken = state.files.some(
        (x) =>
          x.work_item_id === target.work_item_id &&
          x.file_id !== target.file_id &&
          x.display_name === name,
      )
      if (taken)
        return envelope('records.name_taken', 409, [
          { field: 'display_name', code: 'records.name_taken' },
        ])
      target.display_name = name
      return json(record(target))
    }),
    // `retagFile` (v0.19, RECORDS-K): yetki yeniden adlandırmayla aynı; aynı etiket 200.
    http.patch(`${ORIGIN}/v1/files/:id/tag`, async ({ request, params }) => {
      const hit = f.fileOf(request, String(params.id))
      if (hit instanceof Response) return hit
      const { file: target, gate } = hit
      const row = f.teamRow(gate.account, gate.program, gate.department)
      const allowed =
        gate.account.admin ||
        row?.team === 'coordinator' ||
        (target.uploaded_by_account_id === gate.account.account_id && row !== undefined)
      if (!allowed) return envelope('records.not_authorized', 403)
      const tag = ((await request.json()) as { tag: string }).tag
      if (!TAGS.includes(tag)) {
        return envelope('records.input_invalid', 422, [
          { field: 'tag', code: 'records.tag_invalid' },
        ])
      }
      state.retags.push({ file_id: target.file_id, tag })
      target.tag = tag
      return json(record(target))
    }),
    moveHandler(f),
    http.delete(`${ORIGIN}/v1/files/:id`, ({ request, params }) => {
      const hit = f.fileOf(request, String(params.id))
      if (hit instanceof Response) return hit
      const { file: target, gate } = hit
      if (target.uploaded_by_account_id !== gate.account.account_id) {
        return envelope('records.not_authorized', 403)
      }
      state.files = state.files.filter((x) => x.file_id !== target.file_id)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

function downloadHandlers(f: Fake) {
  const { state } = f
  return [
    http.get(`${ORIGIN}/v1/files/:id/download`, ({ request, params }) => {
      const hit = f.fileOf(request, String(params.id))
      if (hit instanceof Response) return hit
      return new HttpResponse(PNG, { headers: { 'Content-Type': hit.file.content_type } })
    }),
    http.post(`${ORIGIN}/v1/download-tickets`, async ({ request }) => {
      if (!f.me(request)) return envelope('platform.unauthenticated', 401)
      if (state.ticket === 'rate-limited') return limited(429, 'platform.rate_limited', '17')
      if (state.ticket === 'target-invalid')
        return envelope('identity.download_target_invalid', 422)
      const body = (await request.json()) as { path: string }
      const ticket = `tk-${state.tickets.size + 1}`
      const program = request.headers.get('X-Nizamio-Program') ?? ''
      const department = request.headers.get('X-Nizamio-Department') ?? ''
      state.tickets.set(ticket, { path: body.path, program, department })
      return json({ ticket, url: `/v1/downloads/${ticket}`, expires_at: '2026-11-12T10:01:00Z' })
    }),
    http.get(`${ORIGIN}/v1/downloads/:ticket`, ({ params }) => {
      const key = String(params.ticket)
      const issued = state.tickets.get(key)
      if (!issued) return envelope('identity.download_ticket_invalid', 404)
      state.tickets.delete(key)
      state.redeemed.push({ ...issued })
      if (state.redeem === 'too-large') return envelope('records.too_large', 422)
      if (state.redeem === 'too-many') return envelope('records.too_many_files', 422)
      if (state.redeem === 'rate-limited') return limited(429, 'records.busy', '9')
      const reports = issued.path.includes('include_reports=true')
      if (state.redeem === 'export-busy' && reports) {
        return limited(429, 'reporting.export_in_progress', '12')
      }
      const disposition = 'attachment; filename="paket.zip"'
      return new HttpResponse(PNG, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': disposition,
          ...(state.redeem === 'truncated' && reports ? { 'X-Result-Truncated': 'true' } : {}),
        },
      })
    }),
  ]
}

export function archiveHandlers(db: OrgDb, state: ArchiveState) {
  const f = new Fake(db, state)
  const holdHandler = http.all(`${ORIGIN}/v1/*`, async ({ request }) => {
    const path = new URL(request.url).pathname
    const at = state.holds.findIndex((h) => h.method === request.method && h.path === path)
    if (at < 0) return undefined
    const [hold] = state.holds.splice(at, 1)
    hold!.arrived()
    await hold!.gate
    return undefined
  })
  return [
    holdHandler,
    ...listHandlers(f),
    ...programListHandlers(f),
    ...fileReadHandlers(f),
    ...writeHandlers(f),
    ...downloadHandlers(f),
  ]
}

/** `method path` isteğini sunucuya ulaştığı anda bekletir; `release()` yanıtı bırakır. */
export function holdRequest(state: ArchiveState, method: string, path: string) {
  let release!: () => void
  let arrived!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  state.holds.push({ method, path, gate, arrived })
  return { release, arrived: reached }
}
