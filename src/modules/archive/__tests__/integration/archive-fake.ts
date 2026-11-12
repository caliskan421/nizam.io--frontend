// W127 · O3 arşiv entegrasyonu: durumlu sahte arşiv sunucusu. W82a harness'inin (`createBackend`)
// üstüne `server.use` ile eklenir; yetki çağıranın belirtecinden, görünürlük sunucu tarafında
// uygulanır (yönetici program geneli, koordinatör kendi departmanı, üye yalnız atandığı
// görevlerin dosyaları). S3 uçları program + departman başlığı olmadan 400 döner (başlıksız
// istek hata sayılır). Rol dizesi yok: kapsam yalnız üyelik satırlarından okunur.
import { http, HttpResponse } from 'msw'

import {
  fakeOrg,
  ORIGIN,
  envelope,
  json,
  type Account,
  type OrgDb,
} from '@/app/__tests__/integration/fake-org'

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

export function archiveHandlers(db: OrgDb, state: ArchiveState) {
  const me = (request: Request): Account | null => fakeOrg.actorOf(db, request)
  const headers = (request: Request) => ({
    program: request.headers.get('X-Nizamio-Program'),
    department: request.headers.get('X-Nizamio-Department'),
  })
  const teamRow = (account: Account, program: string, department: string) =>
    db.memberships.find(
      (m) =>
        m.account_id === account.account_id &&
        m.program_id === program &&
        m.department_id === department,
    )
  const assigned = (account: Account, work: string) =>
    db.items
      .find((i) => i.work_item_id === work)
      ?.assignee_account_ids.includes(account.account_id) ?? false
  const isMemberOnly = (account: Account, program: string, department: string) =>
    !account.admin && teamRow(account, program, department)?.team === 'member'

  /** S3 kapısı: kimlik, başlıklar, kapsam. */
  function gate(
    request: Request,
  ): { account: Account; program: string; department: string } | Response {
    const account = me(request)
    if (!account) return envelope('platform.unauthenticated', 401)
    const { program, department } = headers(request)
    if (!program || !department) return envelope('platform.scope_required', 400)
    if (!account.admin && !teamRow(account, program, department))
      return envelope('records.not_authorized', 403)
    return { account, program, department }
  }
  /** Çağıranın o departmanda görebildiği dosyalar. */
  function visible(account: Account, program: string, department: string): FakeFile[] {
    return state.files.filter((f) => {
      if (!db.items.some((i) => i.work_item_id === f.work_item_id && i.program_id === program))
        return false
      if (account.admin) return true
      if (f.department_id !== department) return false
      return !isMemberOnly(account, program, department) || assigned(account, f.work_item_id)
    })
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
  const record = (f: FakeFile) => item(f)

  return [
    http.get(`${ORIGIN}/v1/records/archive/folders`, ({ request }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const { account, program, department } = g
      if (account.admin) {
        const deps = db.links.filter((l) => l.program_id === program)
        return json({
          folders: deps.map((l) => ({
            folder_id: l.department_id,
            name: l.display_name,
            file_count: state.files.filter((f) => f.department_id === l.department_id).length,
            is_virtual: false,
          })),
        })
      }
      const files = visible(account, program, department)
      if (isMemberOnly(account, program, department)) {
        return json({
          folders: [
            {
              folder_id: 'my-tasks',
              name: 'Görevlerim',
              file_count: files.length,
              is_virtual: true,
            },
          ],
        })
      }
      const link = db.links.find((l) => l.program_id === program && l.department_id === department)
      return json({
        folders: [
          {
            folder_id: department,
            name: link?.display_name ?? department,
            file_count: files.length,
            is_virtual: false,
          },
        ],
      })
    }),
    http.get(`${ORIGIN}/v1/records/archive/tasks`, ({ request }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const files = visible(g.account, g.program, g.department)
      const ids = [...new Set(files.map((f) => f.work_item_id))]
      return json({
        tasks: ids.map((id) => ({
          work_item_id: id,
          title: db.items.find((i) => i.work_item_id === id)?.title ?? id,
          file_count: files.filter((f) => f.work_item_id === id).length,
        })),
      })
    }),
    http.get(`${ORIGIN}/v1/records/archive/uploaders`, ({ request }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      return json({
        uploaders: [
          ...new Set(
            visible(g.account, g.program, g.department).map((f) => f.uploaded_by_account_id),
          ),
        ],
      })
    }),
    http.get(`${ORIGIN}/v1/records/archive/attachments`, ({ request }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const q = new URL(request.url).searchParams
      const search = (q.get('search') ?? '').toLowerCase()
      const category = q.get('mime_category')
      const mimeOf = (f: FakeFile) => (f.content_type.startsWith('image/') ? 'gorsel' : 'belge')
      let list = visible(g.account, g.program, g.department).filter(
        (f) =>
          (!q.get('work_item_id') || f.work_item_id === q.get('work_item_id')) &&
          (!q.get('tag') || f.tag === q.get('tag')) &&
          (!category || mimeOf(f) === category) &&
          (!search || f.display_name.toLowerCase().includes(search)),
      )
      if (q.get('sort') === 'name')
        list = [...list].sort((a, b) => a.display_name.localeCompare(b.display_name))
      const limit = Number(q.get('limit') ?? 50)
      const start = Number(q.get('cursor') ?? 0)
      const page = list.slice(start, start + limit)
      const nextCursor = start + limit < list.length ? String(start + limit) : undefined
      return json({ files: page.map(item), ...(nextCursor ? { next_cursor: nextCursor } : {}) })
    }),
    // Görev dosyaları (önizleme yükleyen adı + 03 görev ayrıntısı); fake-org-work'unkini gölgeler.
    http.get(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) => {
      const account = me(request)
      if (!account) return envelope('platform.unauthenticated', 401)
      return json({
        files: state.files
          .filter((f) => f.work_item_id === params.id)
          .map((f) => ({
            ...item(f),
            uploaded_by_full_name:
              db.accounts.find((a) => a.account_id === f.uploaded_by_account_id)?.full_name ?? null,
          })),
      })
    }),
    http.post(`${ORIGIN}/v1/work-items/:id/files`, async ({ request, params }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const key = request.headers.get('Idempotency-Key')
      if (!key) return envelope('platform.idempotency_key_required', 400)
      const known = state.keys.get(key)
      if (known) return json(record(known), 201)
      const work = db.items.find((i) => i.work_item_id === params.id)
      if (!work) return envelope('work.not_found', 404)
      const tag = new URL(request.url).searchParams.get('tag') ?? ''
      if (!['ister', 'plan', 'girdi', 'analiz', 'cikti', 'sonuc'].includes(tag)) {
        return envelope('records.input_invalid', 422, [
          { field: 'tag', code: 'records.tag_invalid' },
        ])
      }
      const form = await request.formData()
      const upload = form.get('file') as File | null
      state.seq += 1
      const created = file(
        `fu-${state.seq}`,
        String(params.id),
        work.department_id,
        g.account.account_id,
        {
          display_name: upload?.name ?? 'dosya',
          content_type: upload?.type || 'application/octet-stream',
          size_bytes: upload?.size ?? 0,
          tag,
        },
      )
      state.files.push(created)
      state.keys.set(key, created)
      if (state.uploadMode === 'lose-response' || state.uploadMode === 'lose-once') {
        if (state.uploadMode === 'lose-once') state.uploadMode = 'ok'
        return HttpResponse.error()
      }
      return json(record(created), 201)
    }),
    http.patch(`${ORIGIN}/v1/files/:id/name`, async ({ request, params }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const target = state.files.find((f) => f.file_id === params.id)
      if (!target) return envelope('records.file_not_found', 404)
      const name = ((await request.json()) as { display_name: string }).display_name
      if (!name.trim() || name.includes('/'))
        return envelope('records.name_invalid', 422, [
          { field: 'display_name', code: 'records.name_invalid' },
        ])
      if (
        state.files.some(
          (f) =>
            f.work_item_id === target.work_item_id &&
            f.file_id !== target.file_id &&
            f.display_name === name,
        )
      ) {
        return envelope('records.name_taken', 409, [
          { field: 'display_name', code: 'records.name_taken' },
        ])
      }
      target.display_name = name
      return json(record(target))
    }),
    http.delete(`${ORIGIN}/v1/files/:id`, ({ request, params }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const target = state.files.find((f) => f.file_id === params.id)
      if (!target) return envelope('records.file_not_found', 404)
      if (target.uploaded_by_account_id !== g.account.account_id)
        return envelope('records.not_authorized', 403)
      state.files = state.files.filter((f) => f.file_id !== target.file_id)
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${ORIGIN}/v1/files/:id/download`, ({ request, params }) => {
      const g = gate(request)
      if (g instanceof Response) return g
      const target = state.files.find((f) => f.file_id === params.id)
      if (!target) return envelope('records.file_not_found', 404)
      return new HttpResponse(PNG, { headers: { 'Content-Type': target.content_type } })
    }),
    http.post(`${ORIGIN}/v1/download-tickets`, async ({ request }) => {
      const account = me(request)
      if (!account) return envelope('platform.unauthenticated', 401)
      if (state.ticket === 'rate-limited') {
        return HttpResponse.json(
          { code: 'platform.rate_limited', message: 'x', request_id: 'r', fields: [] },
          { status: 429, headers: { 'Retry-After': '17' } },
        )
      }
      if (state.ticket === 'target-invalid')
        return envelope('identity.download_target_invalid', 422)
      const body = (await request.json()) as { path: string }
      const ticket = `tk-${state.tickets.size + 1}`
      state.tickets.set(ticket, {
        path: body.path,
        department: request.headers.get('X-Nizamio-Department') ?? '',
      })
      return json({ ticket, url: `/v1/downloads/${ticket}`, expires_at: '2026-11-12T10:01:00Z' })
    }),
    http.get(`${ORIGIN}/v1/downloads/:ticket`, ({ params }) => {
      const found = state.tickets.get(String(params.ticket))
      if (!found) return envelope('identity.download_ticket_invalid', 404)
      state.tickets.delete(String(params.ticket))
      if (state.redeem === 'too-large') return envelope('records.too_large', 422)
      if (state.redeem === 'too-many') return envelope('records.too_many_files', 422)
      if (state.redeem === 'rate-limited') {
        return HttpResponse.json(
          { code: 'records.busy', message: 'x', request_id: 'r', fields: [] },
          { status: 429, headers: { 'Retry-After': '9' } },
        )
      }
      return new HttpResponse(PNG, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="paket.zip"',
        },
      })
    }),
  ]
}
