// W176 O3 senaryo 1/2: istemcinin kurduğu HER bilet hedefi backend'in kapalı listesine (IDENTITY-K52,
// on dört desen) uyar: tek dosya, iki sohbet, beş ZIP, dört PDF, iki CSV. Yöntem + yol deseni
// pinli sözleşmeden (`operations.gen.ts`) çözülür; başlıklar hedef ucun kapsam sınıfıyla (S1/S2/S3)
// birebir; POST ⇔ gövde; yol temiz, göreli, ≤ 2048, kodlanmış ayraçsız, kontrol karaktersiz.
// Backend eşleşmesi (`matchDownloadTarget`) burada aynen yeniden kurulur: yönlendirici gibi
// joker segmentleri tek yol parçası sayar.
import { describe, expect, it } from 'vitest'

import { chatDownloadPath } from '@/modules/chat/api/attachments'
import { downloadPath } from '@/modules/archive/api/downloads'
import { periodZipTarget } from '@/modules/archive/api/period-zip'
import { exportTarget } from '@/modules/deleted-records/model/export'
import { usersExportTarget } from '@/modules/organization/api/users-export'
import { reportTarget } from '@/modules/reports/model/targets'
import { scopeHeaders, programHeaders } from '@/modules/work/public'
import { OPERATIONS } from '@/shared/api/operations.gen'
import type { DownloadTarget } from '@/shared/download'

const TARGET_OPERATIONS = [
  'downloadFile',
  'downloadChatSharedFile',
  'downloadChatAttachment',
  'archiveFolderZip',
  'archiveSelectionZip',
  'archiveFullZip',
  'programArchiveZip',
  'programArchiveSelectionZip',
  'reportTaskPdf',
  'reportMeetingPdf',
  'reportSeasonPdf',
  'reportWorkloadPdf',
  'exportDeletedRecords',
  'exportUsersCsv',
] as const

type Meta = { operationId: string; scope: 'S1' | 'S2' | 'S3' }
const bySpec = new Map<string, { key: string; meta: Meta }>()
for (const [key, meta] of Object.entries(OPERATIONS)) {
  bySpec.set((meta as Meta).operationId, { key, meta: meta as Meta })
}

/** Deseni (`GET /v1/files/{id}/download`) hedef yoluna karşı eşler; jokerler tek segmenttir. */
function matches(pattern: string, method: string, path: string): boolean {
  const [m, p] = pattern.split(' ')
  if (m !== method) return false
  const a = p!.split('/')
  const b = path.split('/')
  return a.length === b.length && a.every((seg, i) => /^\{.+\}$/.test(seg) || seg === b[i])
}

/** Backend `validateDownloadRequest` + `matchDownloadTarget` kuralları. */
function acceptedBy(target: DownloadTarget): string | null {
  const full = target.path
  if (full === '' || full.length > 2048) return 'uzunluk'
  if (!full.startsWith('/') || full.startsWith('//')) return 'göreli değil'
  if (/[#\\]/.test(full) || /[\u0000-\u001f\u007f]/.test(full)) return 'yasak karakter'
  if (full.toLowerCase().includes('%2f')) return 'kodlanmış ayraç'
  const url = new URL(full, 'http://x')
  if (url.pathname !== new URL(url.pathname, 'http://x').pathname) return 'yol'
  if (/\/\.\.?(\/|$)|\/\//.test(url.pathname)) return 'temiz değil'
  const hasBody = target.body !== undefined
  if ((target.method === 'POST') !== hasBody) return 'gövde/yöntem'
  if (hasBody) {
    const json = JSON.stringify(target.body)
    if (json.length > 64 * 1024 || !json.startsWith('{')) return 'gövde'
    if (json === '{}') return 'boş gövde'
  }
  const hit = TARGET_OPERATIONS.map((op) => bySpec.get(op)!).find(({ key }) =>
    matches(key, target.method, url.pathname),
  )
  if (!hit) return `kapalı listede yok: ${target.method} ${url.pathname}`
  const scope = hit.meta.scope
  const headers = Object.keys(target.headers).sort()
  const expected =
    scope === 'S3'
      ? ['X-Nizamio-Department', 'X-Nizamio-Program']
      : scope === 'S2'
        ? ['X-Nizamio-Program']
        : []
  return JSON.stringify(headers) === JSON.stringify(expected)
    ? null
    : `${hit.meta.operationId} (${scope}) başlıkları ${headers.join(',')}`
}

const T = { programId: 'p1', departmentId: 'd1' }
const archive = (kind: 'file' | 'folder', id: string): DownloadTarget => ({
  method: 'GET',
  path: downloadPath({ target: T, kind, id, fallbackName: 'x' }),
  headers: scopeHeaders(T),
  fallbackName: 'x',
})
const chat = (kind: 'attachment' | 'shared-file', id: string): DownloadTarget => ({
  method: 'GET',
  path: chatDownloadPath({ ...T, kind, id, fallbackName: 'x' }),
  headers: programHeaders(T),
  fallbackName: 'x',
})
const q = { q: '', deleted_from: '', deleted_by: '', department_id: '' }

describe('bilet hedef listesi (kapalı küme, 14 desen)', () => {
  it('on dört işlem pinli sözleşmede var ve S1/S2/S3', () => {
    expect(TARGET_OPERATIONS).toHaveLength(14)
    for (const op of TARGET_OPERATIONS) expect(bySpec.has(op), op).toBe(true)
  })

  const built: Array<[string, DownloadTarget]> = [
    ['tek dosya', archive('file', 'f1')],
    ['tek dosya, özel karakterli kimlik', archive('file', 'a b ç?')],
    ['klasör ZIP', archive('folder', 'd1')],
    ['sohbet eki', chat('attachment', 'a1')],
    ['sohbette paylaşılan dosya', chat('shared-file', 'r1')],
    [
      'dönem ZIP, raporlu',
      periodZipTarget({ programId: 'p1', includeReports: true, fallbackName: 'x' }),
    ],
    [
      'dönem ZIP, raporsuz',
      periodZipTarget({ programId: 'p1', includeReports: false, fallbackName: 'x' }),
    ],
    ['görev PDF', reportTarget({ kind: 'task', programId: 'p1', targetId: 't 1 ç' })],
    ['toplantı PDF', reportTarget({ kind: 'meeting', programId: 'p1', targetId: 'm1' })],
    ['dönem PDF, tümü', reportTarget({ kind: 'season', programId: 'p1' })],
    [
      'dönem PDF, bölüm + birim seçimi',
      reportTarget({
        kind: 'season',
        programId: 'p1',
        sections: ['summary'] as never,
        departmentIds: ['d1', 'd 2'],
      }),
    ],
    ['iş yükü PDF (POST gövdeli, seçimsiz)', reportTarget({ kind: 'workload', programId: 'p1' })],
    [
      'iş yükü PDF (seçimli)',
      reportTarget({ kind: 'workload', programId: 'p1', memberIds: ['a', 'b', 'a'] }),
    ],
    ...(['gorev', 'toplanti', 'koordinatorluk', 'kullanici'] as const).map(
      (kind): [string, DownloadTarget] => [
        `silinenler CSV (${kind})`,
        exportTarget({
          programId: 'p1',
          kind,
          query: { ...q, q: 'ç ö&=#', deleted_by: 'u1' },
        }),
      ],
    ),
    [
      'kullanıcı CSV',
      usersExportTarget({ search: 'ali veli&x=1', sortOrder: 'asc', role: null, programId: 'p1' }),
    ],
  ]

  it.each(built)('%s hedefi kapalı listeye uyar', (_name, target) => {
    expect(acceptedBy(target)).toBeNull()
  })

  it('kırmızı örnekler yakalanır (denetim gerçekten çalışıyor)', () => {
    const ok = archive('file', 'f1')
    expect(acceptedBy({ ...ok, path: '/v1/files/f1/preview' })).toMatch(/kapalı listede yok/)
    expect(acceptedBy({ ...ok, path: '/v1/files/a%2Fb/download' })).toMatch(/kodlanmış ayraç/)
    expect(acceptedBy({ ...ok, headers: programHeaders(T) })).toMatch(/başlıkları/)
    expect(acceptedBy({ ...ok, body: { a: 1 } })).toMatch(/gövde/)
    expect(acceptedBy({ ...ok, method: 'POST' })).toMatch(/gövde/)
    expect(acceptedBy({ ...ok, path: '//evil/x' })).toMatch(/göreli/)
    expect(
      acceptedBy(
        reportTarget({ kind: 'season', programId: 'p1' }) && { ...ok, path: '/v1/files/../x' },
      ),
    ).not.toBeNull()
  })

  it('"/" içeren kimlik %2F olur ve sunucuda reddedilir (kimlikler sunucu UUID\'idir; istemci hata yoluna düşer)', () => {
    expect(acceptedBy(archive('file', 'a/b'))).toBe('kodlanmış ayraç')
  })

  it('iş yükü PDF bileti hiçbir zaman boş gövdeyle gitmez', () => {
    const target = reportTarget({ kind: 'workload', programId: 'p1' })
    expect(target.method).toBe('POST')
    expect(target.body).toEqual({ member_ids: [] })
  })
})
