// W127 · O3 senaryo 9: W121 temizlik kalemleri. Koordinatör/üye 06'ya girince yönlendirilir (P40);
// 06'ya özgü okumalar (yönetici ızgarası için `listProgramDepartments`, yükleme listesi için
// `archiveTasks`) bu roller için ağ isteği atmaz; 07'nin kendi okumaları tek kez gider.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  boot,
  COORD,
  idle,
  MEMBER,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...COORD, path: '/arsiv' })
  await until(() => $('[data-testid="archive-folder-page"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe.each([
  ['koordinatör', COORD, 'd1'],
  ['üye', MEMBER, 'my-tasks'],
] as const)('%s /arsiv girişi', (_name, who, folder) => {
  it('yönlenir; program departman sözlüğü 06 için istenmez, archiveTasks yönlendirme öncesi gitmez', async () => {
    const app = await boot({ ...who, path: '/arsiv' })
    await until(() => app.router.currentRoute.value.path === `/arsiv/${folder}`, 'yönlendirme')
    await until(() => $('[data-file-id]') ?? $('[data-testid="files-needs-task"]'), '07 yerleşti')
    await idle(app.queryClient)
    const first = (path: string) => backend.requests.findIndex((r) => r.path === path)
    // 07'nin kendi görev klasörleri okuması TEK istektir (06 + 07 çifte okuma yok).
    expect(backend.sent('GET', '/v1/records/archive/tasks')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/records/archive/folders')).toHaveLength(1)
    // Yönlendirme kararı (klasör listesi) gelmeden görev okuması başlamaz: 06 görev okumaz.
    const redirected = first('/v1/records/archive/folders')
    expect(first('/v1/records/archive/tasks')).toBeGreaterThan(redirected)
    // K/Ü ızgarası yok: departman sözlüğü yalnız yönetici ızgarası içindir.
    expect(
      backend.requests.filter((r) => r.path === '/v1/program/departments' && r.method === 'GET'),
    ).toHaveLength(0)
  })
})
