// W194 · O3: başka göreve taşı (`moveFile`, RECORDS-K46) gerçek router + AppShell + oturum +
// durumlu sunucu ile. Yönetici başka departmandaki göreve taşır; başlıklar KAYNAK dosyanındır;
// sunucu yanıtı gelmeden iyimser kaldırma yok; önizleme sonuç teslimine dek açık; sonuç bilinmiyorsa
// kör tekrar yok; kapsam değişince geç sonuç sessiz. Başka programın önbelleğine dokunmama birim
// düzeyinde kanıtlıdır (`writes.move.test.ts`, `query-keys.file-move.test.ts`): uygulama kapsam
// değişiminde yabancı program anahtarlarını zaten düşürür (K2).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  ADMIN,
  archive,
  boot,
  click,
  COORD,
  hold,
  idle,
  MEMBER,
  resetArchive,
  switchScope,
  teardown,
  toasts,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'
import { file } from './archive-fake'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1&dosya=f1' })
  await until(() => $('[data-testid="file-preview"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const OPEN = '/arsiv/d1?gorev=w1&dosya=f1'
const PATCH = '/v1/files/f1/work-item'

async function choose(selector: string, value: string): Promise<void> {
  const select = (await until(() => $(selector), selector)) as HTMLSelectElement
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

/** Taşıma penceresini açar ve hedef görevi seçer (gönderim ayrı). */
async function openMove(target: string): Promise<void> {
  await until(() => $('[data-testid="file-preview"]'), 'önizleme')
  await userClick(() => $('[data-testid="file-move"]'))
  await until(() => $('[data-testid="move-task"] option[value="' + target + '"]'), 'hedef aday')
  await choose('[data-testid="move-task"]', target)
}
const submit = () => click(() => $('[data-testid="move-submit"]'))

describe('yönetici: başka departmandaki göreve taşıma', () => {
  it('başlık KAYNAK departman (d1), gövde hedef görev (d2), anahtarsız; liste/önizleme/hedef klasör yenilenir', async () => {
    const app = await boot({ ...ADMIN, path: OPEN })
    await openMove('w3')
    await submit()
    await until(() => !$('[data-testid="file-preview"]'), 'önizleme kapandı')
    await idle(app.queryClient)
    const [req] = backend.sent('PATCH', PATCH)
    expect(backend.sent('PATCH', PATCH)).toHaveLength(1)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.body).toEqual({ work_item_id: 'w3' })
    expect(toasts()).toContain('Yazılım planı')
    expect($('[data-file-id="f1"]')).toBeNull()
    // Küresel kapsam hedef departman seçmekle değişmedi.
    expect(app.scope.programId).toBe('p1')
    await app.router.push('/arsiv/d2?gorev=w3')
    await until(() => $('[data-file-id="f1"]'), 'hedef klasörde dosya')
  })

  it('sunucu yanıtı gelene dek dosya listede kalır ve önizleme açık tutulur; sonra kapanır', async () => {
    const app = await boot({ ...ADMIN, path: OPEN })
    const gate = hold('PATCH', PATCH)
    await openMove('w3')
    await submit()
    await gate.arrived
    expect($('[data-file-id="f1"]')).not.toBeNull()
    expect($('[data-testid="file-preview"]')).not.toBeNull()
    expect(toasts()).toBe('')
    gate.release()
    await until(() => !$('[data-testid="file-preview"]'), 'önizleme kapandı')
    await idle(app.queryClient)
    expect(toasts()).toContain('taşındı')
  })

  it('aynı hedef: doğal 200, kayıt değişmez, çoğaltma yok; hedefte aynı ad numaralanır', async () => {
    const app = await boot({ ...ADMIN, path: OPEN })
    await openMove('w1')
    await submit()
    await until(() => !$('[data-testid="file-preview"]'), 'önizleme kapandı')
    await idle(app.queryClient)
    expect(
      archive.state.files.filter((x) => x.work_item_id === 'w1' && x.file_id === 'f1'),
    ).toHaveLength(1)
    expect(archive.state.files).toHaveLength(4)
    expect(toasts()).not.toContain('adıyla')
  })

  it('hedefte aynı adlı dosya varsa dönen GERÇEK ad bildirilir', async () => {
    archive.state.files.push(file('f9', 'w3', 'd2', 'acc-member', { display_name: 'rapor.pdf' }))
    const app = await boot({ ...ADMIN, path: OPEN })
    await openMove('w3')
    await submit()
    await until(() => !$('[data-testid="file-preview"]'), 'önizleme kapandı')
    await idle(app.queryClient)
    expect(toasts()).toContain('rapor (2).pdf')
  })
})

describe('taşıma hataları ve bilinmeyen sonuç', () => {
  it('409 source_completed: pencere/önizleme açık, bildirim yok, tek istek', async () => {
    archive.state.moveMode = 'source-completed'
    const app = await boot({ ...ADMIN, path: OPEN })
    await openMove('w3')
    await submit()
    await until(() => $('[data-testid="move-error"]'), 'hata')
    await idle(app.queryClient)
    expect(backend.sent('PATCH', PATCH)).toHaveLength(1)
    expect($('[data-testid="file-preview"]')).not.toBeNull()
    expect(toasts()).toBe('')
  })

  it('422 tavan (sunucu): hedef alanında genel hata, sayı uydurulmaz', async () => {
    archive.state.capacity = 0
    const app = await boot({ ...ADMIN, path: OPEN })
    await openMove('w3')
    await submit()
    await idle(app.queryClient)
    const dialog = $('[role="dialog"]')!.textContent ?? ''
    expect(dialog).toContain('Dosya sayısı sınırına ulaşıldı.')
    expect(dialog).not.toMatch(/\b100\b/)
  })

  it('sonuç bilinmiyor: kör tekrar yok, başarı bildirimi yok', async () => {
    archive.state.moveMode = 'lose'
    const app = await boot({ ...ADMIN, path: OPEN })
    await openMove('w3')
    await submit()
    await idle(app.queryClient)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(backend.sent('PATCH', PATCH)).toHaveLength(1)
    expect(toasts()).not.toContain('taşındı')
  })
})

describe('kapsam değişimi ve yetki', () => {
  it('program değişince uçuştaki taşıma: pencere düşer, geç sonuç bildirim üretmez', async () => {
    const app = await boot({ ...ADMIN, path: OPEN })
    const gate = hold('PATCH', PATCH)
    await openMove('w3')
    await submit()
    await gate.arrived
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    gate.release()
    await idle(app.queryClient)
    expect($('[data-testid="move-task"]')).toBeNull()
    expect(toasts()).toBe('')
  })

  it('koordinatör kendi departmanındaki başka göreve taşır (S3 aday listesi, S2 yok)', async () => {
    const app = await boot({ ...COORD, path: OPEN })
    await openMove('w2')
    expect($('[data-testid="move-task"] option[value="w3"]')).toBeNull()
    await submit()
    await until(() => !$('[data-testid="file-preview"]'), 'önizleme kapandı')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/program/archive/tasks')).toHaveLength(0)
    expect(backend.sent('PATCH', PATCH)[0]!.body).toEqual({ work_item_id: 'w2' })
  })

  it('üye başkasının dosyasında taşıma görmez (kaynakta yeniden adlandırma yetkisi yok)', async () => {
    await boot({ ...MEMBER, path: '/arsiv/my-tasks?gorev=w1&dosya=f2' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect($('[data-testid="file-move"]')).toBeNull()
    expect(backend.sent('PATCH', '/v1/files/f2/work-item')).toHaveLength(0)
  })
})
