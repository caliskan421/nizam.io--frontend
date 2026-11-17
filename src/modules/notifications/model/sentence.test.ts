import { describe, expect, it } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'

import { KNOWN_NOTIFICATION_TYPES } from './dictionary'
import { describeRow, type SentenceContext } from './sentence'
import type { NotificationItem } from './types'

const ctx: SentenceContext = { now: new Date('2026-11-14T09:00:00Z'), fullTime: (iso) => `@${iso}` }
const head = (over: Partial<NotificationItem['subject']>): NotificationItem['subject'] => ({
  code: null,
  person: null,
  sequence_no: null,
  state: 'unknown',
  title: null,
  ...over,
})
const AYSE = { account_id: 'a1', full_name: 'Ayşe Kaya' }

describe('describeRow — tür × konu durumu (BE-142/155)', () => {
  it.each(KNOWN_NOTIFICATION_TYPES.map((type) => [type]))(
    '%s: available başlık ikinci satırda; forbidden/unknown başlık sızdırmaz; deleted genel cümle',
    (type) => {
      const available = describeRow(
        makeNotification({
          type,
          actor: AYSE,
          subject: head({ state: 'available', title: 'Bütçe taslağı', code: 'ALT-12' }),
        }),
        ctx,
      )
      expect(available.subject).toBe('ALT-12 · Bütçe taslağı')
      expect(available.text).toContain(type.includes('digest') ? 'özet' : 'Ayşe Kaya')
      for (const state of ['forbidden', 'unknown'] as const) {
        const hidden = describeRow(
          // Sunucu bu durumlarda başlık göndermez; gönderse bile istemci çizmez.
          makeNotification({ type, actor: AYSE, subject: head({ state, title: 'SIZMAMALI' }) }),
          ctx,
        )
        expect(hidden.subject).toBeNull()
        expect(JSON.stringify(hidden)).not.toContain('SIZMAMALI')
      }
      expect(
        describeRow(makeNotification({ type, subject: head({ state: 'deleted' }) }), ctx).subject,
      ).toBe('Bu kayıt silindi')
    },
  )

  it('aktör adı yok (null) → genel cümle; ad uydurulmaz', () => {
    const none = describeRow(makeNotification({ type: 'work.item.created', actor: null }), ctx)
    expect(none.text).toBe('Yeni görev oluşturuldu')
    const noName = describeRow(
      makeNotification({
        type: 'work.item.created',
        actor: { account_id: 'a1', full_name: null },
      }),
      ctx,
    )
    expect(noName.text).toBe('Yeni görev oluşturuldu')
  })

  it('bilinmeyen tür genel satır; bilinmeyen detail alanı yok sayılır', () => {
    const row = describeRow(
      makeNotification({ type: 'yeni.tur.x', detail: { yeni_alan: 1 } as never }),
      ctx,
    )
    expect(row).toMatchObject({ label: 'Bildirim', text: 'Yeni bildirim', detail: null })
  })

  it('grup: "Ayşe ve 2 kişi", kayıt sayısı ve ≤5 avatar; tek aktörde "ve" yok', () => {
    const actors = ['Ayşe Kaya', 'Can Er', 'Deniz Su', 'Ela Un', 'Faruk Il', 'Gül Ay'].map(
      (full_name, i) => ({ account_id: `a${i}`, full_name }),
    )
    const grouped = describeRow(
      makeNotification({
        type: 'work.item.transitioned',
        actor: actors[0],
        group: { count: 9, actors: actors.slice(0, 3), first_created_at: '2026-11-14T08:00:00Z' },
      }),
      ctx,
    )
    expect(grouped.text).toBe('Ayşe Kaya ve 2 kişi bir görevin durumunu değiştirdi')
    expect(grouped.groupCount).toBe(9)
    expect(grouped.avatars).toEqual(['Ayşe Kaya', 'Can Er', 'Deniz Su'])
    const five = describeRow(
      makeNotification({
        group: { count: 6, actors, first_created_at: '2026-11-14T08:00:00Z' },
      }),
      ctx,
    )
    expect(five.avatars).toHaveLength(5)
    const single = describeRow(
      makeNotification({
        type: 'work.item.transitioned',
        actor: AYSE,
        group: { count: 3, actors: [AYSE], first_created_at: '2026-11-14T08:00:00Z' },
      }),
      ctx,
    )
    expect(single.text).toBe('Ayşe Kaya bir görevin durumunu değiştirdi')
    expect(describeRow(makeNotification({ group: null }), ctx).avatars).toEqual([])
  })

  it('grup: 5 aktör tavanı ya da adsız aktör varsa kesin sayı iddia edilmez; tek kişi çok olay', () => {
    const at = (n: number) => ({ account_id: `a${n}`, full_name: `Kişi ${n}` as string | null })
    const text = (actors: ReturnType<typeof at>[], count = 12) =>
      describeRow(
        makeNotification({
          type: 'work.item.transitioned',
          group: { count, actors, first_created_at: '2026-11-14T08:00:00Z' },
        }),
        ctx,
      ).text
    const suffix = 'bir görevin durumunu değiştirdi'
    const capped = [1, 2, 3, 4, 5].map(at)
    expect(text(capped)).toBe(`Kişi 1 ve diğerleri ${suffix}`)
    const withNull = [at(1), { ...at(2), full_name: null }, at(3)]
    expect(text(withNull)).toBe(`Kişi 1 ve diğerleri ${suffix}`)
    expect(text([at(1), { ...at(2), full_name: null }])).toBe(`Kişi 1 ve diğerleri ${suffix}`)
    expect(text([at(1)], 40)).toBe(`Kişi 1 ${suffix}`)
    expect(text([1, 2, 3, 4].map(at))).toBe(`Kişi 1 ve 3 kişi ${suffix}`)
  })

  it('üyelik: etkilenen kişi + departman adı; toplantı saati değişikliği; günlük özet sayıları', () => {
    const member = describeRow(
      makeNotification({
        type: 'organization.membership.assigned',
        subject: head({ state: 'available', title: 'Yazılım', person: AYSE }),
      }),
      ctx,
    )
    expect(member.subject).toBe('Ayşe Kaya · Yazılım')
    const moved = describeRow(
      makeNotification({
        type: 'collaboration.meeting.rescheduled',
        detail: {
          meeting_date_from: '2026-11-15T09:00:00Z',
          meeting_date_to: '2026-11-15T10:30:00Z',
        },
      }),
      ctx,
    )
    expect(moved.detail).toBe('@2026-11-15T09:00:00Z → @2026-11-15T10:30:00Z')
    const digest = describeRow(
      makeNotification({
        type: 'work.digest.daily',
        subject_ref: { kind: 'program', id: 'p1' },
        subject: head({ state: 'available', title: 'Roket 2026' }),
        detail: { overdue_count: 3, due_soon_count: 2, day: '2026-11-14' },
      }),
      ctx,
    )
    expect(digest.detail).toBe('3 geciken · 2 yaklaşan görev')
    expect(digest.subject).toBe('Roket 2026')
  })

  it('toplantı hatırlatması: kalan süre meeting_date’ten; geçmişse "başladı"; tarih yoksa lead_minutes', () => {
    const type = 'collaboration.meeting.reminder'
    const soon = describeRow(
      makeNotification({
        type,
        detail: { lead_minutes: 30, meeting_date: '2026-11-14T09:25:00Z' },
      }),
      ctx,
    )
    expect(soon.text).toBe('Toplantıya 25 dk kaldı')
    const started = describeRow(
      makeNotification({
        type,
        detail: { lead_minutes: 30, meeting_date: '2026-11-14T08:50:00Z' },
      }),
      ctx,
    )
    expect(started.text).toBe('Toplantı başladı')
    expect(describeRow(makeNotification({ type, detail: { lead_minutes: 30 } }), ctx).text).toBe(
      'Toplantıdan 30 dk önce hatırlatma',
    )
    expect(describeRow(makeNotification({ type, detail: null }), ctx).text).toBe(
      'Toplantı hatırlatması',
    )
  })

  it('metinlerde "30 gün" saklama iddiası yok (BE-154: adet tavanı, süre iddiası yok)', async () => {
    const { trNotifications } = await import('@/shared/i18n/tr/notifications')
    expect(JSON.stringify(trNotifications)).not.toMatch(/30 gün|süresiz/i)
  })
})
