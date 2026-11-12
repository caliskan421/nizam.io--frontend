// W127 · O3 arşiv entegrasyonu: durumlu sahte arşiv sunucusu. W82a harness'inin (`createBackend`)
// üstüne `server.use` ile eklenir; yetki çağıranın belirtecinden, görünürlük sunucu tarafında
// uygulanır (yönetici program geneli, koordinatör kendi departmanı, üye yalnız atandığı
// görevlerin dosyaları). S3 uçları program + departman başlığı olmadan 400 döner (başlıksız
// istek hata sayılır). Rol dizesi yok: kapsam yalnız üyelik satırlarından okunur.
import { http, HttpResponse } from 'msw'

import { fakeOrg, ORIGIN, envelope, json, type Account, type OrgDb } from './fake-org'

export interface FakeFile {
  file_id: string
  work_item_id: string
  department_id: string
  display_name: string
  content_type: string
  size_bytes: number
  tag: string
  uploaded_by_account_id: string
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
  redeem: 'ok' | 'too-large' | 'too-many' | 'rate-limited'
  tickets: Map<string, { path: string; department: string }>
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

const item = (f: FakeFile) => ({
  file_id: f.file_id,
  work_item_id: f.work_item_id,
  display_name: f.display_name,
  content_type: f.content_type,
  size_bytes: f.size_bytes,
  tag: f.tag,
  uploaded_by_account_id: f.uploaded_by_account_id,
  ...(f.subtask_id ? { subtask_id: f.subtask_id } : {}),
})

function limited(status: number, code: string, retryAfter: string) {
  return HttpResponse.json(
    { code, message: 'x', request_id: 'r', fields: [] },
    { status, headers: { 'Retry-After': retryAfter } },
  )
}

function listHandlers(f: Fake) {
  const { db, state } = f
  return [
    http.get(`${ORIGIN}/v1/records/archive/folders`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      const { account, program, department } = g
      if (account.admin) {
        return json({
          folders: db.links
            .filter((l) => l.program_id === program)
            .map((l) => ({
              folder_id: l.department_id,
              name: l.display_name,
              file_count: state.files.filter((x) => x.department_id === l.department_id).length,
              is_virtual: false,
            })),
        })
      }
      const count = f.visible(g).length
      if (f.memberOnly(account, program, department)) {
        return json({
          folders: [
            { folder_id: 'my-tasks', name: 'Görevlerim', file_count: count, is_virtual: true },
          ],
        })
      }
      const link = db.links.find((l) => l.program_id === program && l.department_id === department)
      const name = link?.display_name ?? department
      return json({
        folders: [{ folder_id: department, name, file_count: count, is_virtual: false }],
      })
    }),
    http.get(`${ORIGIN}/v1/records/archive/tasks`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      const files = f.visible(g)
      const ids = [...new Set(files.map((x) => x.work_item_id))]
      return json({
        tasks: ids.map((id) => ({
          work_item_id: id,
          title: db.items.find((i) => i.work_item_id === id)?.title ?? id,
          file_count: files.filter((x) => x.work_item_id === id).length,
        })),
      })
    }),
    http.get(`${ORIGIN}/v1/records/archive/uploaders`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      return json({ uploaders: [...new Set(f.visible(g).map((x) => x.uploaded_by_account_id))] })
    }),
  ]
}

function fileReadHandlers(f: Fake) {
  const { db, state } = f
  return [
    http.get(`${ORIGIN}/v1/records/archive/attachments`, ({ request }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      return json(attachmentPage(f.visible(g), new URL(request.url).searchParams))
    }),
    http.get(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) => {
      if (!f.me(request)) return envelope('platform.unauthenticated', 401)
      const name = (id: string) => db.accounts.find((a) => a.account_id === id)?.full_name ?? null
      return json({
        files: state.files
          .filter((x) => x.work_item_id === params.id)
          .map((x) => ({ ...item(x), uploaded_by_full_name: name(x.uploaded_by_account_id) })),
      })
    }),
  ]
}

function attachmentPage(visible: FakeFile[], q: URLSearchParams) {
  const search = (q.get('search') ?? '').toLowerCase()
  const category = q.get('mime_category')
  const mimeOf = (x: FakeFile) => (x.content_type.startsWith('image/') ? 'gorsel' : 'belge')
  const matches = (x: FakeFile) =>
    (!q.get('work_item_id') || x.work_item_id === q.get('work_item_id')) &&
    (!q.get('tag') || x.tag === q.get('tag')) &&
    (!category || mimeOf(x) === category) &&
    (!search || x.display_name.toLowerCase().includes(search))
  let list = visible.filter(matches)
  if (q.get('sort') === 'name') {
    list = [...list].sort((a, b) => a.display_name.localeCompare(b.display_name))
  }
  const limit = Number(q.get('limit') ?? 50)
  const start = Number(q.get('cursor') ?? 0)
  const next = start + limit < list.length ? String(start + limit) : undefined
  return {
    files: list.slice(start, start + limit).map(item),
    ...(next ? { next_cursor: next } : {}),
  }
}

async function createFile(f: Fake, request: Request, workId: string, g: Gate) {
  const { state, db } = f
  const key = request.headers.get('Idempotency-Key')
  if (!key) return envelope('platform.idempotency_key_required', 400)
  const known = state.keys.get(key)
  if (known) return json(item(known), 201)
  const work = db.items.find((i) => i.work_item_id === workId)
  if (!work) return envelope('work.not_found', 404)
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
    await uploadFields(request, tag),
  )
  state.files.push(created)
  state.keys.set(key, created)
  if (state.uploadMode !== 'ok') {
    if (state.uploadMode === 'lose-once') state.uploadMode = 'ok'
    return HttpResponse.error()
  }
  return json(item(created), 201)
}

async function uploadFields(request: Request, tag: string): Promise<Partial<FakeFile>> {
  const upload = (await request.formData()).get('file') as File | null
  return {
    display_name: upload?.name ?? 'dosya',
    content_type: upload?.type || 'application/octet-stream',
    size_bytes: upload?.size ?? 0,
    tag,
  }
}

const TAGS = ['ister', 'plan', 'girdi', 'analiz', 'cikti', 'sonuc']

function writeHandlers(f: Fake) {
  const { state } = f
  return [
    http.post(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) => {
      const g = f.gate(request)
      return g instanceof Response ? g : createFile(f, request, String(params.id), g)
    }),
    http.patch(`${ORIGIN}/v1/files/:id/name`, async ({ request, params }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      const target = state.files.find((x) => x.file_id === params.id)
      if (!target) return envelope('records.file_not_found', 404)
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
      return json(item(target))
    }),
    http.delete(`${ORIGIN}/v1/files/:id`, ({ request, params }) => {
      const g = f.gate(request)
      if (g instanceof Response) return g
      const target = state.files.find((x) => x.file_id === params.id)
      if (!target) return envelope('records.file_not_found', 404)
      if (target.uploaded_by_account_id !== g.account.account_id) {
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
      const g = f.gate(request)
      if (g instanceof Response) return g
      const target = state.files.find((x) => x.file_id === params.id)
      if (!target) return envelope('records.file_not_found', 404)
      return new HttpResponse(PNG, { headers: { 'Content-Type': target.content_type } })
    }),
    http.post(`${ORIGIN}/v1/download-tickets`, async ({ request }) => {
      if (!f.me(request)) return envelope('platform.unauthenticated', 401)
      if (state.ticket === 'rate-limited') return limited(429, 'platform.rate_limited', '17')
      if (state.ticket === 'target-invalid')
        return envelope('identity.download_target_invalid', 422)
      const body = (await request.json()) as { path: string }
      const ticket = `tk-${state.tickets.size + 1}`
      const department = request.headers.get('X-Nizamio-Department') ?? ''
      state.tickets.set(ticket, { path: body.path, department })
      return json({ ticket, url: `/v1/downloads/${ticket}`, expires_at: '2026-11-12T10:01:00Z' })
    }),
    http.get(`${ORIGIN}/v1/downloads/:ticket`, ({ params }) => {
      const key = String(params.ticket)
      if (!state.tickets.has(key)) return envelope('identity.download_ticket_invalid', 404)
      state.tickets.delete(key)
      if (state.redeem === 'too-large') return envelope('records.too_large', 422)
      if (state.redeem === 'too-many') return envelope('records.too_many_files', 422)
      if (state.redeem === 'rate-limited') return limited(429, 'records.busy', '9')
      const disposition = 'attachment; filename="paket.zip"'
      return new HttpResponse(PNG, {
        headers: { 'Content-Type': 'application/zip', 'Content-Disposition': disposition },
      })
    }),
  ]
}

export function archiveHandlers(db: OrgDb, state: ArchiveState) {
  const f = new Fake(db, state)
  return [...listHandlers(f), ...fileReadHandlers(f), ...writeHandlers(f), ...downloadHandlers(f)]
}
