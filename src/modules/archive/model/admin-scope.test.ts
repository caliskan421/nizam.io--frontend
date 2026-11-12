import { describe, expect, it } from 'vitest'

import {
  MEMBER_FOLDER_ID,
  accessTarget,
  decideEntry,
  folderKnown,
  isFolderId,
  keyScope,
  resolveArchiveAccess,
} from './admin-scope'

const adminScope = { programId: 'p1', departmentId: null, lens: 'admin' as const }
const coordScope = { programId: 'p1', departmentId: 'd1', lens: 'coordinator' as const }

describe('P33 — S3 başlığı kararı', () => {
  it('yönetici: başlık yalnız rotadaki klasörden; kapsam deposuna yazılmaz', () => {
    const access = resolveArchiveAccess({ scope: adminScope, admin: true, routeFolderId: 'd7' })
    expect(access).toEqual({
      mode: 'admin-folder',
      target: { programId: 'p1', departmentId: 'd7' },
      folderId: 'd7',
    })
    expect(accessTarget(access)).toEqual({ programId: 'p1', departmentId: 'd7' })
    expect(adminScope.departmentId).toBeNull()
  })

  it('yönetici /arsiv: S3 hedefi YOK (sessiz ilk departman seçimi yok)', () => {
    const access = resolveArchiveAccess({ scope: adminScope, admin: true, routeFolderId: null })
    expect(access).toEqual({ mode: 'admin-overview' })
    expect(accessTarget(access)).toBeNull()
  })

  it('yönetici olgusu mercekten bağımsız: koordinatör merceğindeki yönetici de rotadan alır', () => {
    const access = resolveArchiveAccess({ scope: coordScope, admin: true, routeFolderId: 'd7' })
    expect(access).toMatchObject({ mode: 'admin-folder', target: { departmentId: 'd7' } })
  })

  it('koordinatör/üye: başlık seçili kapsamdan; rotadaki kimlik başlığı değiştirmez', () => {
    const access = resolveArchiveAccess({ scope: coordScope, admin: false, routeFolderId: 'd9' })
    expect(access).toEqual({ mode: 'scoped', target: { programId: 'p1', departmentId: 'd1' } })
    const own = resolveArchiveAccess({ scope: coordScope, admin: false, routeFolderId: null })
    expect(accessTarget(own)).toEqual({ programId: 'p1', departmentId: 'd1' })
  })

  it('bekleme: program yok, yetki olgusu yok, K/Ü departmansız', () => {
    const none = { programId: null, departmentId: null }
    expect(resolveArchiveAccess({ scope: none, admin: true, routeFolderId: 'd1' }).mode).toBe(
      'waiting',
    )
    expect(resolveArchiveAccess({ scope: coordScope, admin: null, routeFolderId: 'd1' }).mode).toBe(
      'waiting',
    )
    expect(
      resolveArchiveAccess({
        scope: { programId: 'p1', departmentId: null },
        admin: false,
        routeFolderId: null,
      }).mode,
    ).toBe('waiting')
  })

  it('yönetici için biçimi bozuk ya da sanal klasör kimliği başlığa yazılmaz', () => {
    for (const bad of ['a/b', '<x>', MEMBER_FOLDER_ID, 'x'.repeat(200)]) {
      expect(
        resolveArchiveAccess({ scope: adminScope, admin: true, routeFolderId: bad }).mode,
      ).toBe('invalid')
    }
    expect(isFolderId('d-1_A')).toBe(true)
    expect(isFolderId('')).toBe(false)
    expect(isFolderId(3)).toBe(false)
  })

  it('klasör kimliği archiveFolders yanıtıyla doğrulanır', () => {
    const folders = [{ folder_id: 'd1', name: 'A', file_count: 0, is_virtual: false }]
    expect(folderKnown(folders, 'd1')).toBe(true)
    expect(folderKnown(folders, 'd2')).toBe(false)
    expect(folderKnown(folders, null)).toBe(false)
    expect(folderKnown(undefined, 'd1')).toBe(false)
  })

  it('sorgu anahtarı kapsamı: yöneticide departman alanı klasörle dolar, depoya yazılmaz', () => {
    const key = keyScope(adminScope, { programId: 'p1', departmentId: 'd7' })
    expect(key).toEqual({ programId: 'p1', departmentId: 'd7', lens: 'admin' })
    expect(adminScope.departmentId).toBeNull()
  })
})

describe('P40 — /arsiv girişi', () => {
  const folders = [
    { folder_id: 'd1', name: 'A', file_count: 1, is_virtual: false },
    { folder_id: 'd2', name: 'B', file_count: 1, is_virtual: false },
  ]
  it('yönetici ızgarayı görür (klasör listesi beklenmez)', () => {
    expect(decideEntry({ admin: true, departmentId: null, folders: undefined })).toEqual({
      kind: 'grid',
    })
  })
  it('koordinatör kendi departmanının klasörüne yönlenir', () => {
    expect(decideEntry({ admin: false, departmentId: 'd2', folders })).toEqual({
      kind: 'redirect',
      folderId: 'd2',
    })
  })
  it('üye sanal my-tasks klasörüne yönlenir', () => {
    expect(
      decideEntry({
        admin: false,
        departmentId: 'd1',
        folders: [
          { folder_id: MEMBER_FOLDER_ID, name: 'Görevlerim', file_count: 0, is_virtual: true },
        ],
      }),
    ).toEqual({ kind: 'redirect', folderId: 'my-tasks' })
  })
  it('liste gelmeden bekler; boşsa yönlendirilecek klasör yok', () => {
    expect(decideEntry({ admin: false, departmentId: 'd1', folders: undefined })).toEqual({
      kind: 'wait',
    })
    expect(decideEntry({ admin: false, departmentId: 'd1', folders: [] })).toEqual({
      kind: 'empty',
    })
  })
})
