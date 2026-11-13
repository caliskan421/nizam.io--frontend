import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import { mountWith, unmountAll } from '../__tests__/mount'
import { meetingFixture } from '../__tests__/fixtures'
import {
  browserSave,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
  standing,
  ticketOk,
} from '../__tests__/harness'
import MeetingReportButton from '../components/MeetingReportButton.vue'
import { reportGate } from '../model/gate'
import { meetingReturnKey, takeFocusReturn } from '../model/return-focus'
import MeetingReportPage from './MeetingReportPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

let saved: ReturnType<typeof browserSave>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
  useToast().clear()
})
afterEach(() => {
  unmountAll()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const DETAIL = (body = meetingFixture()) =>
  http.get(`${ORIGIN}/v1/reports/meetings/m1`, () => json(body))
const PATH = '/toplantilar/m1/rapor'

async function open(body = meetingFixture()) {
  server.use(...standing({ admin: true }), DETAIL(body))
  const mounted = await mountWith(MeetingReportPage, { path: PATH })
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="meeting-stage"]').exists()).toBe(true),
  )
  await settleQueries(mounted.queryClient)
  return mounted
}

describe('MeetingReportPage (01g; E-13-46…53)', () => {
  it('başlık, alt satır ve araç çubuğu; bitiş saati aralığı yok; sayfa numarası yok', async () => {
    const { wrapper } = await open()
    expect(wrapper.get('h1').text()).toBe('Toplantı raporu')
    expect(wrapper.get('.report-page__sub').text()).toBe(
      'Haftalık koordinasyon toplantısı · 14.10.2026 · Altyapı ve tesisat · Elektrik ve enerji',
    )
    expect(wrapper.get('.report-toolbar__lead').text()).toBe(
      'Toplantı raporu · Haftalık koordinasyon toplantısı',
    )
    expect(wrapper.text()).not.toMatch(/Sayfa \d|\d{2}:\d{2}–\d{2}:\d{2}/)
    expect(sent('GET', '/v1/reports/meetings/m1')).toHaveLength(1)
  })

  it('künye: tarih, koordinatörlükler (sahip önce, silinmiş etiketli), oluşturan; başlangıç saati kurulum diliminde', async () => {
    const { wrapper } = await open()
    const kunye = wrapper.get('[data-testid="meeting-kunye"]')
    expect(kunye.text()).toContain('14.10.2026')
    expect(kunye.text()).toContain('Altyapı ve tesisat · Elektrik ve enerji (silinmiş)')
    expect(kunye.text()).toContain('Ali Avcı')
    expect(wrapper.get('.report-meeting-band').text()).toContain('14.10.2026 · 14:00')
    expect(wrapper.get('.report-meeting-band').text()).toContain('HAFTALIK KOORDİNASYON TOPLANTISI')
  })

  it('katılımcılar + üyeler dahil rozeti; gündem salt okunur n/m', async () => {
    const { wrapper } = await open()
    expect(wrapper.get('.report-people').text()).toContain(
      'Katılımcılar (2): Bahar Kılıç, Kadir Özbek',
    )
    expect(wrapper.get('.report-pill--violet').text()).toBe('Koordinatörlük üyeleri de dahil')
    expect(wrapper.text()).toContain('1/2 GÖRÜŞÜLDÜ')
    const rows = wrapper.findAll('[data-testid="agenda-row"]')
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.get('input').attributes('disabled') !== undefined)).toBe(true)
    expect((rows[0]!.get('input').element as HTMLInputElement).checked).toBe(true)
    expect((rows[1]!.get('input').element as HTMLInputElement).checked).toBe(false)
  })

  it('notlar zaman akışı; dönüştürülen not rozeti ve → görev başlığı; yazar yok', async () => {
    const { wrapper } = await open()
    const notes = wrapper.findAll('[data-testid="note-row"]')
    expect(notes.map((n) => n.get('h3').text())).toEqual([
      'Not 01 · 14:05',
      'Not 02 · 15:30 · Göreve dönüştürüldü',
    ])
    expect(notes[1]!.text()).toContain('→ Ek beton ekibi')
    expect(wrapper.text()).toContain('Toplam 2 not')
    expect(wrapper.get('[data-testid="meeting-stage"]').text()).not.toContain('Bahar Kılıç beton')
  })

  it('"Göreve dönüştürülenler" tablosu NOT · GÖREV (DURUM yok); dönüştürülen yoksa çizilmez', async () => {
    const { wrapper } = await open()
    const table = wrapper.get('[aria-label="Göreve dönüştürülen notlar"]')
    expect(table.findAll('[role="columnheader"]').map((c) => c.text())).toEqual(['NOT', 'GÖREV'])
    expect(table.text()).toContain('Not 02')
    expect(table.text()).toContain('Ek beton ekibi')
    unmountAll()
    const plain = meetingFixture({
      notes: meetingFixture().notes.map((n) => ({
        ...n,
        converted_to_task_id: null,
        converted_task_title: null,
      })),
    })
    const again = await open(plain)
    expect(again.wrapper.find('[aria-label="Göreve dönüştürülen notlar"]').exists()).toBe(false)
  })

  it('boş gündem ve not metinleri', async () => {
    const { wrapper } = await open(meetingFixture({ agenda: [], notes: [] }))
    expect(wrapper.text()).toContain('Gündem girilmemiş.')
    expect(wrapper.text()).toContain('Not girilmemiş.')
  })

  it('"Kapat" ve "Toplantıya git" toplantı detayına gider; Kapat odak dönüşü ister', async () => {
    const { wrapper, router } = await open()
    expect(wrapper.get('[data-action="go-to"]').attributes('href')).toBe('/toplantilar/m1')
    const close = wrapper.get('[data-action="close"]')
    expect(close.attributes('href')).toBe('/toplantilar/m1')
    await close.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('collaboration.meeting')
    expect(takeFocusReturn(meetingReturnKey('m1'))).toBe(true)
  })

  it('yan kartlar: iki tetikleyici (üçüncü "sekme" yok), üye notu', async () => {
    const { wrapper } = await open()
    const aside = wrapper.get('aside')
    expect(aside.text()).toContain('Tetikleyiciler')
    expect(aside.findAll('.report-trig')).toHaveLength(2)
    expect(aside.text()).not.toMatch(/Raporlar ›|sekmesi|toplanti-raporu-.*\.pdf|MB/)
    expect(aside.text()).toContain('Üye için rapor ucu yok.')
  })

  it('"PDF indir" toplantı PDF biletini üretir', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="toplanti-raporu-7f3a9c2e.pdf"' }),
    )
    const { wrapper, queryClient } = await open()
    await wrapper.get('[data-testid="preview-pdf"] button').trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toEqual(['toplanti-raporu-7f3a9c2e.pdf']))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      path: '/v1/reports/meetings/m1/pdf',
    })
  })

  it('hata: bölge içi metin + yeniden dene; 404 sunucu iletisi göstermez', async () => {
    let calls = 0
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/reports/meetings/m1`, () => {
        calls += 1
        return calls === 1 ? errorEnvelope('reporting.not_found', 404) : json(meetingFixture())
      }),
    )
    const { wrapper } = await mountWith(MeetingReportPage, { path: PATH })
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.text()).not.toContain('sunucu iletisi')
    await wrapper.get('[role="alert"] button').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="meeting-stage"]').exists()).toBe(true),
    )
  })

  it('yükleniyor: iskelet ve "Rapor yükleniyor…"', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/reports/meetings/m1`, async () => {
        await gate
        return json(meetingFixture())
      }),
    )
    const { wrapper } = await mountWith(MeetingReportPage, { path: PATH })
    await vi.waitFor(() => expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true))
    expect(wrapper.text()).toContain('Rapor yükleniyor…')
    release()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="meeting-stage"]').exists()).toBe(true),
    )
  })
})

describe('önizleme dönüşünde odak (E-13-17, KESİN 27)', () => {
  it('toplantı: bayrak varsa "Önizle" bağlantısı odağı alır', async () => {
    const { requestFocusReturn } = await import('../model/return-focus')
    requestFocusReturn(meetingReturnKey('m1'))
    server.use(...standing({ admin: true }))
    const { wrapper, queryClient } = await mountWith(MeetingReportButton, {
      props: { meeting: { meeting_id: 'm1', owner_department_id: 'd1', departments: [] } },
    })
    await settleQueries(queryClient)
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(wrapper.get('[data-action="preview-meeting"]').element),
    )
    expect(takeFocusReturn(meetingReturnKey('m1'))).toBe(false)
  })

  it('dönem: bayrak varsa "Önizle" bağlantısı odağı alır', async () => {
    const { requestFocusReturn, SEASON_RETURN_KEY } = await import('../model/return-focus')
    const { default: SeasonReportActions } = await import('../components/SeasonReportActions.vue')
    requestFocusReturn(SEASON_RETURN_KEY)
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] })),
    )
    const { wrapper, queryClient } = await mountWith(SeasonReportActions)
    await settleQueries(queryClient)
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(wrapper.get('[data-action="preview-season"]').element),
    )
  })
})
