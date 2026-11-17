// W185 (F9; BE-027/143): sohbet bildirimi ve çaprazprogram hedef — gerçek router/AppShell/oturum +
// durumlu sahte sunucu. Sohbet okundu → sunucu bildirimi kapatır; program geçişi gezinmeden ÖNCE olur.
import { describe, expect, it } from 'vitest'

import { advance, fakeClock } from './chat-support'
import {
  $,
  addFor,
  bellBadge,
  boot,
  idle,
  MEMBER,
  notifications,
  openPanel,
  panel,
  panelRows,
  PEOPLE,
  sent,
  SECOND,
  toasts,
  until,
  userClick,
  WORK,
} from './notifications-support'
import { chatMsg, installV025Hooks, main, rowText } from './notifications-v025-support'

installV025Hooks({ coordinator: 'koordinator', member: 'uye' })

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
