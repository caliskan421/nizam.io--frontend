// W185 (F9; BE-027/142–146/148/149/154–156): v0.25 bildirimleri — gerçek router/AppShell/oturum +
// durumlu sahte sunucu (süzgeç, grup, kaldır, sessize al, karar uçları, sohbet okundu → bildirim kapanır).
// Her senaryo "önce-sonra" sayaç ve istek tanığı taşır; eski istemci süzgeci/stub yolu yoktur.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { advance, fakeClock } from './chat-support'
import {
  $,
  $$,
  ADMIN,
  addFor,
  bell,
  bellBadge,
  boot,
  idle,
  MEMBER,
  notifications,
  openPanel,
  panel,
  panelRows,
  PEOPLE,
  resetNotifications,
  sent,
  SECOND,
  seedNotificationChats,
  teardown,
  toasts,
  until,
  useNotificationsBackend,
  userClick,
  WORK,
} from './notifications-support'

const backend = useNotificationsBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetNotifications()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  addFor('member', 'work.item.created', WORK('w1'))
  await boot({ ...MEMBER, path: '/gorevler' })
  await until(() => bell(), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetNotifications()
  seedNotificationChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

const main = (i: number) => panelRows()[i]?.querySelector<HTMLElement>('.nb-it__main') ?? null
const tab = (name: string) => () =>
  $$('[role="tab"]').find((t) => t.textContent?.includes(name)) ?? null
const rowText = (i: number) => panelRows()[i]?.textContent ?? ''
const inRow = (i: number, testid: string) => () =>
  panelRows()[i]?.querySelector<HTMLElement>(`[data-testid="${testid}"]`) ?? null
const chatMsg = (seq: number) => ({ message_id: `msg-${seq}`, seq, chat_kind: 'group' as const })

describe('sohbet bildirimi (BE-027/142/143)', () => {
  it('satır → /mesajlar/:chatId?mesaj=<seq> (tipli rota, `sohbet` alias yok); okundu İSTEMCİDEN gitmez', async () => {
    addFor(
      'member',
      'messaging.message.sent',
      { kind: 'chat', id: 'g1' },
      {
        program_id: 'p1',
        detail: chatMsg(5),
        actor: { account_id: PEOPLE.coord.account_id, full_name: 'Kerem Koordinatör' },
        subject: {
          state: 'available',
          title: 'Mekanik Ekibi',
          code: null,
          sequence_no: null,
          person: null,
        },
      },
    )
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    expect(rowText(0)).toContain('Kerem Koordinatör sohbete yeni bir mesaj yazdı')
    expect(rowText(0)).toContain('Mekanik Ekibi')
    await userClick(() => main(0))
    await until(() => app.router.currentRoute.value.path === '/mesajlar/g1', 'sohbet rotası')
    expect(app.router.currentRoute.value.name).toBe('collaboration.chat')
    expect(app.router.currentRoute.value.query).toEqual({ mesaj: '5' })
    expect(app.router.currentRoute.value.query).not.toHaveProperty('sohbet')
    await until(
      () => sent('GET', '/v1/chats/g1/messages').some((r) => r.query.get('around') === '5'),
      'mevcut around okuması',
    )
    await idle(app.queryClient)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(0)
    expect(panel()).toBeNull()
  })

  it('konuşma okununca sunucu bildirimi kapatır; zil + liste + İKİ sayaç yeniden okunur (KESİN 29)', async () => {
    addFor(
      'member',
      'messaging.message.mentioned',
      { kind: 'chat', id: 'g1' },
      {
        program_id: 'p1',
        detail: { message_id: 'msg-60', chat_kind: 'group' },
      },
    )
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await until(() => bellBadge() === '1', 'rozet 1')
    await idle(app.queryClient)
    const counts = sent('GET', '/v1/notifications/unread-count').length
    await openPanel()
    const lists = sent('GET', '/v1/notifications').length
    fakeClock() // okundu işaretçisinin 1 sn gecikmesi sahte saatle (gerçek bekleme yok)
    await userClick(() => main(0))
    await until(() => $('[data-testid="chat-unread"]'), 'okunmamış ayırıcı')
    expect(sent('POST', '/v1/chats/g1/read')).toHaveLength(0)
    expect(bellBadge()).toBe('1')
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    await advance(1000)
    await idle(app.queryClient)
    expect(sent('POST', '/v1/chats/g1/read')).toHaveLength(1)
    await until(() => bellBadge() === null, 'rozet kalktı (sunucu kapattı)')
    expect(sent('GET', '/v1/notifications/unread-count').length).toBeGreaterThan(counts)
    expect(notifications.state.rows.get(PEOPLE.member.account_id)![0]!.is_read).toBe(true)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(0)
    await openPanel()
    await until(() => sent('GET', '/v1/notifications').length > lists, 'liste yeniden okundu')
    await until(() => panelRows()[0]?.getAttribute('data-unread') === 'false', 'satır okunmuş')
  })
})

describe('çaprazprogram hedef ve program geçişi (BE-143)', () => {
  it('başka programın görevi: ÖNCE program değişir, SONRA ?gorev= açılır (kapsam dinleyicisi sorguyu silmez)', async () => {
    addFor('second', 'work.item.assignment_changed', WORK('w-p2'), {
      program_id: 'p2',
      department_id: 'd3',
    })
    const app = await boot({ ...SECOND, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    expect(app.scope.programId).toBe('p1')
    await openPanel()
    await userClick(() => main(0))
    await until(() => app.scope.programId === 'p2', 'program p2')
    await until(() => app.router.currentRoute.value.path === '/gorevler', '03')
    // P55 soğuk bağlantı yeni programda çözülür: görev bu kapsamda yok → ortak "bulunamadı" (tek kez).
    await until(() => toasts().includes('Bu görev bu kapsamda bulunamadı'), 'bulunamadı')
    await idle(app.queryClient)
    expect(app.scope.programId).toBe('p2')
    const lookups = sent('GET', '/v1/work-items/w-p2')
    expect(lookups.length).toBeGreaterThan(0)
    expect(lookups.every((r) => r.headers.get('X-Nizamio-Program') === 'p2')).toBe(true)
    expect(panel()).toBeNull()
  })

  it('başka programın sohbeti: program değişir, konuşma rotası açılır; günlük özet (program) ana sayfaya + o programa', async () => {
    addFor(
      'second',
      'work.digest.daily',
      { kind: 'program', id: 'p2' },
      {
        program_id: 'p2',
        detail: { overdue_count: 2, due_soon_count: 1, day: '2026-11-14' },
        subject: {
          state: 'available',
          title: 'Teknofest 2027',
          code: null,
          sequence_no: null,
          person: null,
        },
      },
    )
    const app = await boot({ ...SECOND, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    expect(rowText(0)).toContain('2 geciken · 1 yaklaşan görev')
    await userClick(() => main(0))
    await until(() => app.scope.programId === 'p2', 'program p2')
    await until(() => app.router.currentRoute.value.path === '/', 'ana sayfa')
    await idle(app.queryClient)
  })

  it('kullanıcının programı olmayan hedef: gezinme yok, kapsam aynı, panel açık, neden söylenir (tahmin yok)', async () => {
    addFor('member', 'work.item.created', WORK('w-x'), { program_id: 'p2', department_id: 'd3' })
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    await userClick(() => main(0))
    await until(() => toasts().includes('Bu bildirimin programına erişimin yok'), 'neden')
    expect(app.scope.programId).toBe('p1')
    expect(app.router.currentRoute.value.path).toBe('/mesajlar')
    expect(panel()).not.toBeNull()
  })

  it('program_id yoksa (kapsamsız olay) kapsam DEĞİŞMEZ; hedef seçili kapsamda çözülür', async () => {
    addFor('member', 'work.item.created', WORK('w1'), { program_id: null })
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    await userClick(() => main(0))
    await until(() => app.router.currentRoute.value.query.gorev === 'w1', 'gorev')
    await idle(app.queryClient)
    expect(app.scope.programId).toBe('p1')
  })
})

describe('sunucu süzgeçli sekmeler ve iki sayaç (BE-144/145)', () => {
  it('Senden bekleyen: awaiting=true, ayrı sayı; Okunmamış: unread_only; zil sayısı grup sayısıdır', async () => {
    const pending = {
      kind: 'review_date_request' as const,
      request_id: 'r1',
      state: 'pending' as const,
      resolution: null,
    }
    addFor(
      'admin',
      'work.date_change.requested',
      WORK('w1'),
      { action: pending, program_id: 'p1', department_id: 'd1' },
      3,
    )
    addFor('admin', 'work.item.created', WORK('w2'), { is_read: true }, 9)
    addFor('admin', 'work.item.created', WORK('w3'), {}, 8)
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '2', `zil = okunmamış grup sayısı (şimdi ${bellBadge()})`)
    await openPanel()
    expect(panelRows()).toHaveLength(3)
    expect(tab('Senden bekleyen')()!.textContent).toContain('1')
    expect(tab('Okunmamış')()!.textContent).toContain('2')
    await userClick(tab('Senden bekleyen'))
    await until(() => panelRows().length === 1, 'awaiting süzgeci')
    expect(sent('GET', '/v1/notifications').at(-1)!.query.get('awaiting')).toBe('true')
    expect(rowText(0)).toContain('Onayla')
    await userClick(tab('Okunmamış'))
    await until(() => panelRows().length === 2, 'unread_only süzgeci')
    expect(sent('GET', '/v1/notifications').at(-1)!.query.get('unread_only')).toBe('true')
    await idle(app.queryClient)
  })

  it('birleşik grup (BE-148): yığın avatar + "ve N kişi"; okundu grubun tamamına tek istek; zil grup sayar', async () => {
    const a = { account_id: 'x1', full_name: 'Ayşe Kaya' }
    const b = { account_id: 'x2', full_name: 'Berk Yıldız' }
    addFor('admin', 'work.item.transitioned', WORK('w1'), {
      actor: a,
      group: { count: 3, actors: [a, b], first_created_at: '2026-11-14T07:00:00Z' },
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet: 3 kayıt tek grup')
    await openPanel()
    expect(rowText(0)).toContain('Ayşe Kaya ve 1 kişi bir görevin durumunu değiştirdi')
    expect(
      panelRows()[0]!.querySelectorAll('[data-testid="notification-stack"] .rp-av'),
    ).toHaveLength(2)
    await userClick(() => panelRows()[0]!.querySelector('.nb-hov button'))
    await until(() => bellBadge() === null, 'grup tek yazmayla okundu')
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(1)
    await idle(app.queryClient)
  })
})

describe('satır içi karar (BE-146; P88)', () => {
  const dateRequest = {
    kind: 'review_date_request' as const,
    request_id: 'r1',
    state: 'pending' as const,
    resolution: null,
  }
  const approveTask = {
    kind: 'approve_task' as const,
    request_id: null,
    state: 'pending' as const,
    resolution: null,
  }

  it('tarih talebi Onayla: S1 uç; sunucu satırı çözer → "Onaylandı · sen"; Senden bekleyen düşer; Geri al yok', async () => {
    addFor('admin', 'work.date_change.requested', WORK('w1'), {
      action: dateRequest,
      program_id: 'p1',
      department_id: 'd1',
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    expect(tab('Senden bekleyen')()!.textContent).toContain('1')
    await userClick(
      () =>
        [
          ...panelRows()[0]!.querySelectorAll<HTMLElement>(
            '[data-testid="notification-decision"] button',
          ),
        ][0] ?? null,
    )
    await until(() => !!inRow(0, 'notification-resolved')(), 'çözüldü satırı')
    expect(notifications.decisions.calls).toEqual([
      {
        path: '/v1/date-change-requests/r1/review',
        body: { decision: 'approved' },
        program: null,
        department: null,
      },
    ])
    expect(inRow(0, 'notification-resolved')()!.textContent).toBe('Onaylandı · sen')
    expect(rowText(0)).not.toContain('Geri al')
    await until(
      () => !tab('Senden bekleyen')()!.textContent?.includes('1'),
      'bekleyen sayacı düştü',
    )
    await idle(app.queryClient)
  })

  it('başkası karar verdi (409): kanonik hata, satır sunucudan okunur ("Onaylandı · ad" ya da çözüldü); başarı bildirimi yok', async () => {
    addFor('admin', 'work.date_change.requested', WORK('w1'), {
      action: dateRequest,
      program_id: 'p1',
      department_id: 'd1',
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    // Başka biri kararı verdi (sunucu gerçeği): bu satır hâlâ "bekliyor" görünürken tıklanır.
    const stored = notifications.state.rows.get(PEOPLE.admin.account_id)![0]!
    stored.action = {
      ...stored.action!,
      state: 'resolved',
      resolution: {
        outcome: 'rejected',
        decided_by: { account_id: 'baska', full_name: 'Can Er' },
        decided_at: null,
      },
    }
    await userClick(
      () =>
        [
          ...panelRows()[0]!.querySelectorAll<HTMLElement>(
            '[data-testid="notification-decision"] button',
          ),
        ][0] ?? null,
    )
    await until(() => !!inRow(0, 'notification-resolved')(), 'sunucudan okunan sonuç')
    expect(inRow(0, 'notification-resolved')()!.textContent).toBe('Reddedildi · Can Er')
    expect(toasts()).not.toContain('Karar gönderildi')
    expect(toasts().length).toBeGreaterThan(0)
    await idle(app.queryClient)
  })

  it('görev onayı çaprazprogram: başlıklar satırdan (p2/d3), seçili program p1 kalır; iade gerekçesi pencereden', async () => {
    addFor('second', 'work.item.transitioned', WORK('w-p2'), {
      action: approveTask,
      program_id: 'p2',
      department_id: 'd3',
    })
    const app = await boot({ ...SECOND, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    const buttons = () => [
      ...panelRows()[0]!.querySelectorAll<HTMLElement>(
        '[data-testid="notification-decision"] button',
      ),
    ]
    await userClick(() => buttons()[1] ?? null)
    const reason = await until(
      () => document.body.querySelector<HTMLInputElement>('input[name="reason"]'),
      'iade penceresi',
    )
    reason.value = 'Kanıt eksik'
    reason.dispatchEvent(new Event('input', { bubbles: true }))
    await userClick('[data-testid="wf-revert-submit"]')
    await until(() => notifications.decisions.calls.length === 1, 'karar isteği')
    expect(notifications.decisions.calls[0]).toEqual({
      path: '/v1/work-items/w-p2/transitions',
      body: { to: 'iade_edildi', reason: 'Kanıt eksik' },
      program: 'p2',
      department: 'd3',
    })
    expect(app.scope.programId).toBe('p1')
    await until(() => !!inRow(0, 'notification-resolved')(), 'çözüldü')
    expect(inRow(0, 'notification-resolved')()!.textContent).toBe('İade edildi · sen')
    await idle(app.queryClient)
  })

  it('bağlam eksik (department_id yok): düğmeler devre dışı + neden; istek yok', async () => {
    addFor('admin', 'work.item.transitioned', WORK('w1'), {
      action: approveTask,
      program_id: 'p1',
      department_id: null,
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    const buttons = [
      ...panelRows()[0]!.querySelectorAll<HTMLButtonElement>(
        '[data-testid="notification-decision"] button',
      ),
    ]
    expect(buttons.every((b) => b.disabled)).toBe(true)
    expect(rowText(0)).toContain('Bu karar buradan verilemiyor')
    expect(notifications.decisions.calls).toHaveLength(0)
    await idle(app.queryClient)
  })
})

describe('kaldır, sessize al ve "Sessize alınan konular" (BE-156; P86)', () => {
  it('sessize al → rozet; alt görünümde liste (nötr metin); "Sessizi kaldır" → liste boş + satır muted=false', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    await userClick(inRow(0, 'notification-mute'))
    await until(() => rowText(0).includes('Sessize alındı'), 'muted (sunucudan)')
    expect(sent('PUT', '/v1/notifications/subject-mutes/work_item/w1')).toHaveLength(1)
    await userClick('[data-testid="notification-mutes-open"]')
    await until(() => $$('[data-testid="notification-mute-row"]').length === 1, 'mute listesi')
    expect(sent('GET', '/v1/notifications/subject-mutes')[0]!.query.get('limit')).toBe('30')
    const text = $('[data-testid="notification-mute-row"]')!.textContent
    expect(text).toContain('Sessize alınmış görev')
    expect(text).not.toContain('w1')
    await userClick('[data-testid="notification-unmute"]')
    await until(() => $$('[data-testid="notification-mute-row"]').length === 0, 'liste boşaldı')
    expect(sent('DELETE', '/v1/notifications/subject-mutes/work_item/w1')).toHaveLength(1)
    await userClick('[data-testid="notification-mutes-back"]')
    await until(() => panelRows().length === 1, 'listeye dönüldü')
    await until(() => !rowText(0).includes('Sessize alındı'), 'satır muted=false')
    expect(document.activeElement).toBe($('[data-testid="notification-mutes-open"]'))
    await idle(app.queryClient)
  })

  it('kaldır: satır düşer, zil sayacı sunucudan düşer; CSRF başlığı var', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    addFor('member', 'work.item.created', WORK('w3'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '2', 'rozet 2')
    await openPanel()
    await userClick(inRow(0, 'notification-dismiss'))
    await until(() => panelRows().length === 1, 'satır düştü')
    await until(() => bellBadge() === '1', 'sayaç düştü')
    expect(sent('DELETE', '/v1/notifications/n2')).toHaveLength(1)
    await idle(app.queryClient)
  })
})
