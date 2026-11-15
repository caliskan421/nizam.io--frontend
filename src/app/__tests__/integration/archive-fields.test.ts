// W171 · F8 canlıya alma (M-A03/M-A04/M-A05): liste satırı alanları gerçek uç biçimiyle —
// BE-070 yükleme zamanı (`created_at`), BE-071 yükleyen adı (`uploaded_by_full_name`) ve BE-073
// süzgeçli kesin toplam (`ArchiveFileList.total`). Stub'lar kalktı: "eski yol yok" (yükleyen için
// `listWorkItemFiles` okunmaz, "n+" gösterimi yok). Durumlu sahte arşiv sunucusu (W127 `archive-fake`).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  archive,
  boot,
  COORD,
  PEOPLE,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
} from './archive-support'
import { file } from './archive-fake'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...COORD, path: '/arsiv/d1?dosya=f1' })
  await until(() => $('[data-testid="file-preview"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const text = (selector: string) => $(selector)?.textContent?.replace(/\s+/g, ' ').trim()

describe('önizleme: tarih ve yükleyen liste satırından', () => {
  it('BE-070/071: tarih kurulum saat diliminde, yükleyen adı satırdan; listWorkItemFiles okunmaz', async () => {
    archive.state.files[0]!.created_at = '2026-11-12T09:05:00Z'
    const app = await boot({ ...COORD, path: '/arsiv/d1?dosya=f1' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect(text('[data-testid="preview-date"]')).toBe('12.11.2026 · 12:05')
    expect(text('[data-testid="preview-uploader"]')).toBe(PEOPLE.member.full_name)
    expect($('[data-design-stub="BE-070"]')).toBeNull()
    expect($('[data-design-stub="BE-071"]')).toBeNull()
    await until(() => backend.sent('GET', '/v1/records/archive/attachments').length > 0, 'liste')
    expect(backend.sent('GET', '/v1/work-items/w1/files')).toHaveLength(0)
    expect(app.router.currentRoute.value.query.dosya).toBe('f1')
  })

  it('yükleyen adı null (satırı olmayan hesap) → nötr "—"; kimlikten ad uydurulmaz', async () => {
    archive.state.files[0]!.uploaded_by_account_id = 'acc-silinmis'
    await boot({ ...COORD, path: '/arsiv/d1?dosya=f1' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect(text('[data-testid="preview-uploader"]')).toBe('—')
  })
})

describe('süzgeçli kesin toplam (BE-073)', () => {
  it('sayaç ve önizleme konumu sunucunun süzgeç toplamıdır; "n+" yok', async () => {
    // d1'de 60 "plan" dosyası: ilk sayfa 50 yükler, sunucu toplamı 60 (+ f2 plan = 61).
    for (let i = 0; i < 60; i += 1) {
      archive.state.files.push(
        file(`bulk-${i}`, 'w1', 'd1', PEOPLE.coord.account_id, {
          tag: 'plan',
          created_at: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T09:00:00Z`,
        }),
      )
    }
    await boot({ ...COORD, path: '/arsiv/d1?etiket=plan&dosya=f2' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect(text('[data-testid="file-filter-bar"] .rp-count')).toBe('61')
    expect(text('[data-testid="preview-position"]')).toMatch(/^\d+ \/ 61$/)
    expect(text('[data-testid="file-filter-bar"]')).not.toContain('+')
  })
})
