import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'

import {
  errorEnvelope,
  fileRecord,
  http,
  json,
  ORIGIN,
  requests,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import UploadDialog from './UploadDialog.vue'
import {
  body,
  choose,
  mountDialog,
  pdf,
  pick,
  setDefaultStanding,
  type StandingSeed,
  stubBrowserClone,
  TASKS,
  type Mounted,
} from './__tests__/support'

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  resetHarness()
  useToast().clear()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
enableAutoUnmount(afterEach)

const POST = `${ORIGIN}/v1/work-items/w1/files`
const subtasksOk = http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
  json({
    subtasks: [
      { subtask_id: 's1', title: 'Birinci alt görev', done: false, work_item_id: 'w1' },
      { subtask_id: 's2', title: 'İkinci alt görev', done: true, work_item_id: 'w1' },
    ],
  }),
)

const COORDINATOR: StandingSeed = { rows: [{ departmentId: 'd1', role: 'koordinator' }] }

beforeEach(() => {
  setDefaultStanding(COORDINATOR)
  server.use(subtasksOk)
})

async function fill(m: Mounted, over: { task?: string; tag?: string; subtask?: string } = {}) {
  await pick('upload-task', over.task ?? 'w1')
  await settleQueries(m.h.queryClient)
  await pick('upload-tag', over.tag ?? 'sonuc')
  if (over.subtask) await pick('upload-subtask', over.subtask)
  await choose()
}

async function submit(m: Mounted) {
  await body().find('form').trigger('submit')
  await settleQueries(m.h.queryClient)
}

const optionLabels = (testid: string) =>
  body()
    .findAll(`[data-testid="${testid}"] option`)
    .map((o) => o.text())

describe('UploadDialog — görev seçici (E-06-05/35/62)', () => {
  it('yalnız yükleme yetkili görevler listelenir (başka birimin görevi yok)', () => {
    mountDialog()
    expect(optionLabels('upload-task')).toEqual(['Görev seçin', 'Rapor yaz', 'Plan hazırla'])
    expect(body().text()).not.toContain('Başka birim işi')
  })

  it('ŞY ekip satırı olmadan her görevi görür (ADR-0030)', () => {
    mountDialog({}, { standing: { companyAdmin: true } })
    expect(body().text()).toContain('Başka birim işi')
  })

  it('defaultTaskId yetkiliyse ön dolu; yetkisizse boş kalır', () => {
    mountDialog({ defaultTaskId: 'w2' })
    expect((body().find('[data-testid="upload-task"]').element as HTMLSelectElement).value).toBe(
      'w2',
    )
    document.body.innerHTML = ''
    mountDialog({ defaultTaskId: 'w3' })
    expect((body().find('[data-testid="upload-task"]').element as HTMLSelectElement).value).toBe('')
  })

  it('yetkili görev yoksa açıklama gösterilir ve seçici devre dışıdır (BE-121 notu)', () => {
    mountDialog({ tasks: [] })
    expect(body().text()).toContain('Henüz dosyası olmayan görevler bu listede görünmez')
    expect((body().find('[data-testid="upload-task"]').element as HTMLSelectElement).disabled).toBe(
      true,
    )
  })

  it('normal durumda da dosyası olmayan görevlerin listede olmadığı açıklanır', () => {
    mountDialog()
    expect(body().text()).toContain('henüz dosyası olmayan bir görev burada yoktur')
  })
})

describe('UploadDialog — doğrulama', () => {
  it('görev, etiket ve dosya zorunlu: istek yok, alan hataları görünür; etiket varsayılanı yok', async () => {
    const m = mountDialog()
    expect((body().find('[data-testid="upload-tag"]').element as HTMLSelectElement).value).toBe('')
    await submit(m)
    expect(requests).toHaveLength(0)
    const text = body().text()
    expect(text).toContain('Görev seçin.')
    expect(text).toContain('Etiket seçin.')
    expect(text).toContain('Dosya seçin.')
    expect(body().findAll('[aria-invalid="true"]').length).toBeGreaterThanOrEqual(3)
  })

  it('etiket seçenekleri P34 sözlüğüdür (altı, sözleşme sırası)', () => {
    mountDialog()
    expect(optionLabels('upload-tag')).toEqual([
      'Etiket seçin',
      'İster',
      'Plan',
      'Girdi',
      'Analiz',
      'Çıktı',
      'Sonuç',
    ])
  })

  it('alt görev seçici görev seçilmeden devre dışı; seçilince yalnız o görevin alt görevleri okunur', async () => {
    server.use(subtasksOk)
    const m = mountDialog()
    expect(
      (body().find('[data-testid="upload-subtask"]').element as HTMLSelectElement).disabled,
    ).toBe(true)
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(0)
    await pick('upload-task', 'w1')
    await settleQueries(m.h.queryClient)
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(1)
    expect(sent('GET', '/v1/work-items/w2/subtasks')).toHaveLength(0)
    expect(optionLabels('upload-subtask')).toEqual([
      'Alt görev yok',
      'Birinci alt görev',
      'İkinci alt görev',
    ])
    const [req] = sent('GET', '/v1/work-items/w1/subtasks')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
  })

  it('görev değişince seçili alt görev sıfırlanır', async () => {
    server.use(
      subtasksOk,
      http.get(`${ORIGIN}/v1/work-items/w2/subtasks`, () => json({ subtasks: [] })),
    )
    const m = mountDialog()
    await pick('upload-task', 'w1')
    await settleQueries(m.h.queryClient)
    await pick('upload-subtask', 's1')
    await pick('upload-task', 'w2')
    await settleQueries(m.h.queryClient)
    expect((body().find('[data-testid="upload-subtask"]').element as HTMLSelectElement).value).toBe(
      '',
    )
  })

  it('403 work.not_assigned alt görev okumasında nötr: bilgi metni yok, yükleme sürer', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        errorEnvelope('work.not_assigned', 403),
      ),
    )
    const m = mountDialog()
    await pick('upload-task', 'w1')
    await settleQueries(m.h.queryClient)
    expect(body().text()).not.toContain('Alt görevler okunamadı')
    expect(optionLabels('upload-subtask')).toEqual(['Alt görev yok'])
  })
})

describe('UploadDialog — yükleme (attachFile)', () => {
  it('başarı: multipart + tag/subtask_id sorguda + eylem anahtarı + görevin departmanı; uploaded + close; ilişkili sorgular bayat', async () => {
    server.use(
      subtasksOk,
      http.post(POST, () => json({ ...fileRecord, file_id: 'f9' }, 201)),
    )
    const m = mountDialog()
    const scope = m.h.store.snapshot
    const list = queryKeys.archive.list({ ...scope, departmentId: 'd1' }, 'attachments', {})
    const files = queryKeys.workItems.files(scope, 'w1')
    m.h.queryClient.setQueryData(list, { seeded: true })
    m.h.queryClient.setQueryData(files, { seeded: true })
    await fill(m, { subtask: 's1' })
    await submit(m)
    const [req] = sent('POST', '/v1/work-items/w1/files')
    expect(req!.query.get('tag')).toBe('sonuc')
    expect(req!.query.get('subtask_id')).toBe('s1')
    expect(req!.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/)
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(m.events.uploaded).toEqual(['f9'])
    expect(m.events.closed).toBe(1)
    expect(m.h.queryClient.getQueryState(list)?.isInvalidated).toBe(true)
    expect(m.h.queryClient.getQueryState(files)?.isInvalidated).toBe(true)
    expect(body().find('[role="dialog"]').exists()).toBe(false)
  })

  it('alt görev seçilmediyse subtask_id gönderilmez; her yükleme yeni anahtar', async () => {
    server.use(http.post(POST, () => json(fileRecord, 201)))
    const m = mountDialog()
    await fill(m)
    await submit(m)
    expect(sent('POST', '/v1/work-items/w1/files')[0]!.query.has('subtask_id')).toBe(false)
    document.body.innerHTML = ''
    const second = mountDialog()
    await fill(second)
    await submit(second)
    const [a, b] = sent('POST', '/v1/work-items/w1/files')
    expect(a!.headers.get('Idempotency-Key')).not.toBe(b!.headers.get('Idempotency-Key'))
  })

  it('sürükle-bırak dosyayı seçer; birden çok dosyada ilk alınır ve bilgi verilir', async () => {
    const m = mountDialog()
    const zone = body().find('[data-testid="upload-drop"]')
    const dropped = [pdf('birinci.pdf'), pdf('ikinci.pdf')]
    await zone.trigger('dragover')
    expect(zone.classes()).toContain('au-drop--over')
    await zone.trigger('drop', { dataTransfer: { files: dropped } })
    expect(zone.classes()).not.toContain('au-drop--over')
    expect(body().find('[data-testid="upload-file-name"]').text()).toContain('birinci.pdf')
    expect(body().text()).toContain('ilk dosya alındı')
    expect(m.shown()).toBe(true)
  })

  it('bırakılan dosya yüklenir (düğmeyle seçilenle aynı yol)', async () => {
    server.use(http.post(POST, () => json(fileRecord, 201)))
    const m = mountDialog()
    await pick('upload-task', 'w1')
    await settleQueries(m.h.queryClient)
    await pick('upload-tag', 'plan')
    await body()
      .find('[data-testid="upload-drop"]')
      .trigger('drop', { dataTransfer: { files: [pdf('birakilan.pdf')] } })
    await submit(m)
    expect(sent('POST', '/v1/work-items/w1/files')).toHaveLength(1)
    expect(m.events.uploaded).toEqual(['f1'])
  })

  it('devam ederken ilerleme durumu görünür, alanlar ve kapatma kilitli; Esc kapatmaz', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(POST, async () => {
        await gate
        return json(fileRecord, 201)
      }),
    )
    const m = mountDialog()
    await fill(m)
    await body().find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    expect(body().find('[data-testid="upload-progress"]').exists()).toBe(true)
    expect(
      (body().find('[data-testid="upload-submit"]').element as HTMLButtonElement).disabled,
    ).toBe(true)
    await body().find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(m.events.closed).toBe(0)
    release()
    await settleQueries(m.h.queryClient)
    expect(m.events.closed).toBe(1)
  })
})

describe('UploadDialog — sunucu hataları', () => {
  it.each([
    ['records.tag_required', 422, 'Dosya etiketi gerekli.'],
    ['records.tag_invalid', 422, 'Dosya etiketi geçersiz.'],
    ['records.too_large', 422, 'Dosya çok büyük.'],
    ['platform.body_too_large', 413, 'İstek içeriği çok büyük.'],
    ['records.content_rejected', 422, 'Dosya içeriği kabul edilmedi.'],
    ['records.name_invalid', 422, 'Dosya adı geçersiz.'],
    ['records.too_many_files', 422, 'Dosya sayısı sınırına ulaşıldı.'],
  ])('%s alanın altında gösterilir (sunucu iletisi yok)', async (code, status, text) => {
    server.use(http.post(POST, () => errorEnvelope(code, status)))
    const m = mountDialog()
    await fill(m)
    await submit(m)
    expect(body().text()).toContain(text)
    expect(body().text()).not.toContain('sunucu iletisi')
    expect(body().find('[data-testid="upload-error"]').exists()).toBe(false)
    expect(m.events.closed).toBe(0)
    expect(body().find('[aria-invalid="true"]').exists()).toBe(true)
  })

  it('alan hatası, alan değişince temizlenir', async () => {
    server.use(http.post(POST, () => errorEnvelope('records.tag_invalid', 422)))
    const m = mountDialog()
    await fill(m)
    await submit(m)
    expect(body().text()).toContain('Dosya etiketi geçersiz.')
    await pick('upload-tag', 'plan')
    expect(body().text()).not.toContain('Dosya etiketi geçersiz.')
  })

  it('403 records.not_authorized üst bildirimde (alan değil); pencere açık kalır', async () => {
    server.use(http.post(POST, () => errorEnvelope('records.not_authorized', 403)))
    const m = mountDialog()
    await fill(m)
    await submit(m)
    expect(body().find('[data-testid="upload-error"]').exists()).toBe(true)
    expect(body().text()).not.toContain('sunucu iletisi')
    expect(m.events.uploaded).toEqual([])
  })

  it('sonuç bilinmiyor: AYNI anahtarla tek tekrar sunulur; ikincisi de belirsizse düğme kalkar', async () => {
    let calls = 0
    server.use(
      http.post(POST, () => {
        calls += 1
        return calls <= 2 ? errorEnvelope('platform.internal', 503) : json(fileRecord, 201)
      }),
    )
    const m = mountDialog()
    await fill(m)
    await submit(m)
    const resend = () =>
      body()
        .findAll('button')
        .find((b) => b.text().includes('Yeniden gönder'))
    expect(resend()).toBeDefined()
    // Dosya ve etiket korunur.
    expect((body().find('[data-testid="upload-tag"]').element as HTMLSelectElement).value).toBe(
      'sonuc',
    )
    await resend()!.trigger('click')
    await settleQueries(m.h.queryClient)
    const [a, b] = sent('POST', '/v1/work-items/w1/files')
    expect(a!.headers.get('Idempotency-Key')).toBe(b!.headers.get('Idempotency-Key'))
    expect(resend()).toBeUndefined()
    expect(calls).toBe(2)
    expect(m.events.uploaded).toEqual([])
  })

  it('tek tekrar başarılıysa uploaded + close', async () => {
    let calls = 0
    server.use(
      http.post(POST, () => {
        calls += 1
        return calls === 1 ? errorEnvelope('platform.internal', 503) : json(fileRecord, 200)
      }),
    )
    const m = mountDialog()
    await fill(m)
    await submit(m)
    await body()
      .findAll('button')
      .find((b) => b.text().includes('Yeniden gönder'))!
      .trigger('click')
    await settleQueries(m.h.queryClient)
    expect(m.events.uploaded).toEqual(['f1'])
    expect(m.events.closed).toBe(1)
  })
})

describe('UploadDialog — odak dönüşü (KESİN 27)', () => {
  const focused = (m: Mounted) => document.activeElement === m.trigger()

  it('açılışta odak pencereye geçer', async () => {
    const m = mountDialog()
    await settleQueries(m.h.queryClient)
    expect(focused(m)).toBe(false)
    expect(body().find('[role="dialog"]').element.contains(document.activeElement)).toBe(true)
  })

  it('Esc → tetikleyiciye', async () => {
    const m = mountDialog()
    await body().find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(m.events.closed).toBe(1)
    expect(focused(m)).toBe(true)
  })

  it('✕ → tetikleyiciye', async () => {
    const m = mountDialog()
    await body().find('.t-modal__head button').trigger('click')
    expect(m.events.closed).toBe(1)
    expect(focused(m)).toBe(true)
  })

  it('Vazgeç → tetikleyiciye', async () => {
    const m = mountDialog()
    await body().find('[data-testid="upload-cancel"]').trigger('click')
    expect(m.events.closed).toBe(1)
    expect(focused(m)).toBe(true)
  })

  it('başarı sonrası söküm → tetikleyiciye', async () => {
    server.use(http.post(POST, () => json(fileRecord, 201)))
    const m = mountDialog()
    await fill(m)
    await submit(m)
    expect(m.events.closed).toBe(1)
    expect(focused(m)).toBe(true)
  })
})

describe('UploadDialog — sökülmüş sahip', () => {
  it('istek uçuşta sahip sökülürse geç sonuç emit, bildirim ya da akış başlatmaz', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(POST, async () => {
        await gate
        return errorEnvelope('records.not_authorized', 403)
      }),
    )
    const m = mountDialog()
    await fill(m)
    await body().find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    m.wrapper.unmount()
    release()
    await new Promise((r) => setTimeout(r, 0))
    expect(m.events.uploaded).toEqual([])
    expect(m.events.closed).toBe(0)
    expect(useToast().queue.value).toHaveLength(0)
  })

  it('sökülmüş sahip yeni istek başlatmaz', async () => {
    const m = mountDialog()
    await fill(m)
    m.wrapper.unmount()
    expect(sent('POST', '/v1/work-items/w1/files')).toHaveLength(0)
  })
})

describe('sözleşme', () => {
  it('props/emits bildirimleri (iskelet sözleşmesi)', () => {
    const options = UploadDialog as unknown as { props: object; emits: string[] }
    expect(Object.keys(options.props)).toEqual(['tasks', 'defaultTaskId'])
    expect(options.emits).toEqual(['close', 'uploaded'])
    expect(TASKS).toHaveLength(3)
  })
})
