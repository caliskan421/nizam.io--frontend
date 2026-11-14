import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConfirm } from '@/shared/ui/confirm'

import {
  $,
  $$,
  called,
  click,
  clickText,
  errorEnvelope,
  json,
  mountDialog,
  msg,
  on,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
} from './harness'
import TaskFromMessageDialog from '../TaskFromMessageDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const DEPARTMENTS = {
  departments: [
    { department_id: 'd1', display_name: 'Yazılım', code: 'YZL' },
    { department_id: 'd2', display_name: 'Elektronik', code: 'ELK' },
  ],
}
const ROSTER = {
  members: [
    {
      account_id: 'a1',
      full_name: 'Deniz Kaya',
      membership_id: 'm1',
      role: 'member',
      status: 'active',
    },
    {
      account_id: 'a2',
      full_name: 'Eski Üye',
      membership_id: 'm2',
      role: 'member',
      status: 'deleted',
    },
  ],
}
const FUTURE = '2031-03-10'
const FUTURE_END = '2031-03-12'

function serve(created = { work_item_id: 'w9', message: msg(5, { task_ids: ['w9'] }) }) {
  on('get', '/v1/program/departments', () => json(DEPARTMENTS))
  on('get', '/v1/departments/d1/members', () => json(ROSTER))
  on('post', '/v1/chats/c1/messages/m5/tasks', () => json(created, 201))
}
const source = (over = {}) => ({ window: { items: [msg(5, over)] } })
const props = { chatId: 'c1', messageId: 'm5', seq: 5 }

async function pickDepartment() {
  await vi.waitFor(() => expect($$('[data-testid="dlg-task-departments"] button')).toHaveLength(2))
  $$('[data-testid="dlg-task-departments"] button')[0]!.click()
}

describe('TaskFromMessageDialog (E-10-86…92)', () => {
  it('kaynak mesaj alıntısı; şirket yöneticisine tüm birimler; ipucu metinleri', async () => {
    serve()
    mountDialog(TaskFromMessageDialog, props, { ...source({ body: 'Rapor yazılmalı' }) })
    await pickDepartment()
    expect($('[data-testid="dlg-task-quote"]')!.textContent).toContain('Rapor yazılmalı')
    expect($('[data-testid="dlg-task-quote"]')!.textContent).toContain('Başka Kişi')
    expect(document.body.textContent).toContain(
      'Boş bırakırsan mesajın ilk 100 karakteri kullanılır.',
    )
    expect(
      $$('[data-testid="dlg-task-departments"] button').map((b) => b.textContent?.trim()),
    ).toEqual(['Yazılım', 'Elektronik'])
  })

  it('görev oluştur: Idempotency-Key, tarih alanları, atanan; sonuçta "Görevi aç" bağlantısı', async () => {
    serve()
    const { router, wrapper } = mountDialog(TaskFromMessageDialog, props, source())
    await pickDepartment()
    // yalnız aktif üyeler listelenir
    await vi.waitFor(() => expect($$('.chat-dlg__check')).toHaveLength(1))
    $('.chat-dlg__check input')!.click()
    setValue('input[name="title"]', ' Rapor ')
    setValue('input[name="startOn"]', FUTURE)
    setValue('input[name="endOn"]', FUTURE_END)
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages/m5/tasks')).toHaveLength(1))
    const [call] = called('POST', '/v1/chats/c1/messages/m5/tasks')
    expect(call!.body).toEqual({
      department_id: 'd1',
      start_date: FUTURE,
      end_date: FUTURE_END,
      title: 'Rapor',
      assignee_account_ids: ['a1'],
    })
    expect(call!.headers.get('Idempotency-Key')).toBeTruthy()
    await vi.waitFor(() => expect($('[data-testid="dlg-task-done"]')).not.toBeNull())
    click('[data-testid="dlg-open-task"]')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/gorevler?gorev=w9'))
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('doğrulama: birim ve tarih zorunlu; geçmiş başlangıç ve ters aralık alan altında', async () => {
    serve()
    mountDialog(TaskFromMessageDialog, props, source())
    await pickDepartment()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Geçerli bir tarih girin'))
    setValue('input[name="startOn"]', '2020-01-01')
    setValue('input[name="endOn"]', '2019-01-01')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Başlangıç bugünden önce olamaz'),
    )
    expect(document.body.textContent).toContain('Bitiş başlangıçtan önce olamaz')
    expect(called('POST', '/v1/chats/c1/messages/m5/tasks')).toHaveLength(0)
  })

  it('koordinatör yalnız kendi birimini görür ve tek birim seçili gelir; üyede gönderim kapalı', async () => {
    serve()
    mountDialog(TaskFromMessageDialog, props, {
      ...source(),
      who: { rows: [{ departmentId: 'd2', role: 'koordinator' }] },
    })
    await vi.waitFor(() =>
      expect($$('[data-testid="dlg-task-departments"] button')).toHaveLength(1),
    )
    const only = $('[data-testid="dlg-task-departments"] button')!
    expect(only.textContent?.trim()).toBe('Elektronik')
    expect(only.getAttribute('aria-pressed')).toBe('true')
  })

  it('görev yetkisi yoksa (Üye) uyarı + Görevi oluştur devre dışı (gizleme güvenlik değildir)', async () => {
    serve()
    mountDialog(TaskFromMessageDialog, props, {
      ...source(),
      who: { rows: [{ departmentId: 'd1', role: 'uye' }] },
    })
    await vi.waitFor(() => expect($('[data-testid="dlg-task-denied"]')).not.toBeNull())
    expect(($('[data-testid="dlg-submit"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('mesajdan zaten görev varsa göndermeden onay; vazgeçte istek yok, onayda gider', async () => {
    serve()
    mountDialog(TaskFromMessageDialog, props, source({ task_ids: ['w1'] }))
    await pickDepartment()
    setValue('input[name="startOn"]', FUTURE)
    setValue('input[name="endOn"]', FUTURE_END)
    const dialog = useConfirm()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    expect(dialog.current.value!.options.body?.[0]).toBe(
      'Bu mesajdan zaten görev oluşturuldu; yine de oluşturulsun mu?',
    )
    dialog.cancel(dialog.current.value!.id)
    await vi.waitFor(() => expect(dialog.current.value).toBeNull())
    expect(called('POST', '/v1/chats/c1/messages/m5/tasks')).toHaveLength(0)
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    void dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages/m5/tasks')).toHaveLength(1))
  })

  it('403 not_authorized ve 409 task_deleted pencere içinde, sunucu iletisi olmadan', async () => {
    on('get', '/v1/program/departments', () => json(DEPARTMENTS))
    on('get', '/v1/departments/d1/members', () => json(ROSTER))
    on('post', '/v1/chats/c1/messages/m5/tasks', () =>
      errorEnvelope('messaging.not_authorized', 403),
    )
    const { wrapper } = mountDialog(TaskFromMessageDialog, props, source())
    await pickDepartment()
    setValue('input[name="startOn"]', FUTURE)
    setValue('input[name="endOn"]', FUTURE_END)
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-error"]')?.textContent).toContain('yetkiniz yok'),
    )
    expect(document.body.textContent).not.toContain('sunucu iletisi')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('Esc ve Vazgeç kapatır', async () => {
    serve()
    const { wrapper } = mountDialog(TaskFromMessageDialog, props, source())
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Vazgeç')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})
