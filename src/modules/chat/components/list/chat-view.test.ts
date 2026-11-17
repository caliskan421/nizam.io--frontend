import { describe, expect, it } from 'vitest'

import { makeChatLastMessage, makeChatSummary } from '@/shared/api/__tests__/defaults'

import type { ChatSummary } from '../../model/types'
import {
  avatarOf,
  badgeCount,
  chatTime,
  chatTitle,
  isCoordinatorsGroup,
  isMuted,
  isSystemGroup,
  listTick,
  parseFilter,
  previewOf,
  serverFilter,
} from './chat-view'
import * as chatViewModule from './chat-view'

function chat(over: Partial<ChatSummary> = {}): ChatSummary {
  return makeChatSummary({ created_at: '2026-11-01T08:00:00Z', ...over })
}

const last = (over: Partial<NonNullable<ChatSummary['last_message']>> = {}) =>
  makeChatLastMessage({ created_at: '2026-11-14T08:00:00Z', sender_name: 'Ali Veli', ...over })

describe('süzgeç (E-10-06)', () => {
  it('sekme → sunucu süzgeci (BE-081); "Tümü" süzgeçsizdir, istemci süzgeci yoktur', () => {
    expect(serverFilter('all')).toEqual({})
    expect(serverFilter('unread')).toEqual({ unread: true })
    expect(serverFilter('groups')).toEqual({ kind: 'group' })
    expect(serverFilter('people')).toEqual({ kind: 'direct' })
    expect('applyFilter' in chatViewModule).toBe(false)
  })

  it('URL değeri: bilinenler eşlenir, bilinmeyen/çoklu/boş "Tümü"dür (sessiz)', () => {
    expect(parseFilter('okunmamis')).toBe('unread')
    expect(parseFilter('gruplar')).toBe('groups')
    expect(parseFilter('kisiler')).toBe('people')
    expect(parseFilter(['gruplar', 'kisiler'])).toBe('groups')
    expect(parseFilter('baska')).toBe('all')
    expect(parseFilter(undefined)).toBe('all')
    expect(parseFilter(null)).toBe('all')
  })
})

describe('K-1 pin v0.25: coordinators / bilinmeyen kaynak geri düşüşü (ADR-0051)', () => {
  it('coordinators (BE-160): sistem avatarı "K" (bölüm/genel kodu çıkmaz); bilinmeyen değer serbest grup', () => {
    const coordinators = chat({
      auto_kind: 'coordinators',
      source: 'coordinators',
      name: 'Koordinatörler',
    })
    expect(avatarOf(coordinators, 'sis')).toEqual({ kind: 'sys', text: 'K' })
    expect(avatarOf(chat({ source: 'coordinators', name: 'Koordinatörler' }))).toEqual({
      kind: 'sys',
      text: 'K',
    })
    // Bilinmeyen gelecekteki değer de aynı geri düşüşü alır.
    const unknown = chat({
      auto_kind: 'yeni_tur' as ChatSummary['auto_kind'],
      source: 'yeni_kaynak' as ChatSummary['source'],
      name: 'Fuar kurulum',
    })
    expect(avatarOf(unknown)).toEqual({ kind: 'grp', text: 'FK' })
  })

  it('kendiliğinden kurulan (auto_kind dolu) grup sistem grubu sayılır; null değil', () => {
    expect(isSystemGroup(chat({ auto_kind: 'coordinators' }))).toBe(true)
    expect(isSystemGroup(chat({ auto_kind: null }))).toBe(false)
    expect(isSystemGroup(chat({ auto_kind: 'yeni_tur' as ChatSummary['auto_kind'] }))).toBe(false)
    expect(isCoordinatorsGroup(chat({ source: 'coordinators' }))).toBe(true)
    expect(isCoordinatorsGroup(chat({ auto_kind: 'general' }))).toBe(false)
  })

  it('liste tiki (BE-082 peer_read_seq): yalnız birebirde son mesajım; imleç ≥ seq → read', () => {
    const mineLast = last({ sender_account_id: 'u1', seq: 7 })
    const dm = (over: Partial<ChatSummary>) =>
      chat({ kind: 'direct', name: null, last_message: mineLast, ...over })
    expect(listTick(dm({ peer_read_seq: 7 }), 'u1')).toBe('read')
    expect(listTick(dm({ peer_read_seq: 6 }), 'u1')).toBe('sent')
    expect(listTick(dm({ peer_read_seq: null }), 'u1')).toBeNull()
    expect(listTick(dm({ kind: 'group', peer_read_seq: 9 }), 'u1')).toBeNull()
    expect(listTick(dm({ peer_read_seq: 9, last_message: last({ seq: 7 }) }), 'u1')).toBeNull()
    expect(listTick(dm({ peer_read_seq: 9 }), null)).toBeNull()
  })

  it('sessiz rozeti yalnız notify_level none (BE-027 liste yüzü); yoksa all', () => {
    expect(isMuted(chat({ notify_level: 'none' }))).toBe(true)
    expect(isMuted(chat({ notify_level: 'mentions' }))).toBe(false)
    expect(isMuted(chat({ notify_level: undefined }))).toBe(false)
  })
})

describe('ad ve avatar (E-10-09, E-10-10)', () => {
  it('grupta ad, birebirde karşı taraf; ad yoksa nötr "Bilinmeyen kişi"', () => {
    expect(chatTitle(chat())).toBe('Fuar kurulum')
    expect(chatTitle(chat({ kind: 'direct', name: null, counterpart_name: 'Ayşe Yılmaz' }))).toBe(
      'Ayşe Yılmaz',
    )
    expect(chatTitle(chat({ name: null, counterpart_name: null }))).toBe('Bilinmeyen kişi')
    expect(chatTitle(chat({ name: '  ', counterpart_name: null }))).toBe('Bilinmeyen kişi')
  })

  it('Genel "G"; koordinatörlük kodun 3 harfi (kod yoksa ad baş harfleri); grup 2; kişi 2', () => {
    expect(avatarOf(chat({ auto_kind: 'general', name: 'Genel' }))).toEqual({
      kind: 'sys',
      text: 'G',
    })
    const dept = chat({
      auto_kind: 'department',
      source: 'department',
      name: 'Sistem koordinatörlüğü',
    })
    expect(avatarOf(dept, 'sis')).toEqual({ kind: 'code', text: 'SİS' })
    expect(avatarOf(dept, 'ABCDE')).toEqual({ kind: 'code', text: 'ABC' })
    expect(avatarOf(dept)).toEqual({ kind: 'code', text: 'SK' })
    expect(avatarOf(chat({ source: 'department' }), '')).toEqual({ kind: 'code', text: 'FK' })
    expect(avatarOf(chat())).toEqual({ kind: 'grp', text: 'FK' })
    expect(
      avatarOf(chat({ kind: 'direct', name: null, counterpart_name: 'ibrahim çelik' })),
    ).toEqual({ kind: 'person', text: 'İÇ' })
  })

  it('"Koordinatörler" sistem grubu ("K") çizilmez: yalnız general/department sistem grubudur', () => {
    expect(isSystemGroup(chat({ auto_kind: 'general' }))).toBe(true)
    expect(isSystemGroup(chat({ auto_kind: 'department' }))).toBe(true)
    expect(isSystemGroup(chat())).toBe(false)
  })
})

describe('rozet ve önizleme (E-10-12, E-10-14)', () => {
  it('99 üstü "99+"', () => {
    expect(badgeCount(3)).toBe('3')
    expect(badgeCount(99)).toBe('99')
    expect(badgeCount(100)).toBe('99+')
  })

  it('son mesaj yoksa önizleme yok', () => {
    expect(previewOf(chat(), 'u1')).toBeNull()
  })

  it('kendi mesajım "Sen: ", grupta başkası ilk adıyla, birebirde öneksiz', () => {
    expect(previewOf(chat({ last_message: last({ sender_account_id: 'u1' }) }), 'u1')).toEqual({
      prefix: 'Sen: ',
      text: 'Merhaba',
    })
    expect(previewOf(chat({ last_message: last() }), 'u1')).toEqual({
      prefix: 'Ali: ',
      text: 'Merhaba',
    })
    expect(previewOf(chat({ kind: 'direct', last_message: last() }), 'u1')).toEqual({
      prefix: '',
      text: 'Merhaba',
    })
  })

  it('silinmiş → "silinmiş mesaj"; tür `last_message.kind`\'dan (BE-086): ek → "Dosya", anket → "Anket"', () => {
    expect(previewOf(chat({ last_message: last({ deleted: true, body: null }) }), 'u1')).toEqual({
      prefix: '',
      text: 'silinmiş mesaj',
    })
    expect(previewOf(chat({ last_message: last({ kind: 'attachment', body: '' }) }), 'u1')).toEqual(
      { prefix: 'Ali: ', text: 'Dosya' },
    )
    expect(
      previewOf(
        chat({ last_message: last({ kind: 'attachment', body: null, attachment_count: 3 }) }),
        'u1',
      )?.text,
    ).toBe('3 dosya')
    expect(
      previewOf(chat({ last_message: last({ kind: 'attachment', body: 'Şartname' }) }), 'u1')?.text,
    ).toBe('Şartname')
    expect(
      previewOf(chat({ last_message: last({ kind: 'poll', body: 'Hangi gün?' }) }), 'u1')?.text,
    ).toBe('Anket')
  })

  it('eski yol yok: kind=text iken boş gövde "Dosya" SAYILMAZ (gövde sezgisi kalktı)', () => {
    expect(previewOf(chat({ last_message: last({ kind: 'text', body: '' }) }), 'u1')?.text).toBe('')
  })

  it('oturum hesabı bilinmiyorsa kimse "Sen" sayılmaz', () => {
    expect(previewOf(chat({ last_message: last({ sender_account_id: 'u1' }) }), null)?.prefix).toBe(
      'Ali: ',
    )
  })
})

describe('son etkinlik zamanı (E-10-11)', () => {
  const now = new Date('2026-11-14T12:00:00Z') // İstanbul 15:00
  const tz = 'Europe/Istanbul'
  const t = (iso: string | null) => chatTime(iso, now, tz, 'Dün')

  it('boşsa çizilmez; geçersiz tarih de', () => {
    expect(t(null)).toBeNull()
    expect(t('bozuk')).toBeNull()
  })
  it('bugün "SS:dd" kurulum saat diliminde', () => {
    expect(t('2026-11-14T07:02:00Z')).toBe('10:02')
  })
  it('gün sınırı kurulum saat dilimindedir (UTC değil)', () => {
    // 13 Kasım 21:30 UTC = 14 Kasım 00:30 İstanbul → bugün
    expect(t('2026-11-13T21:30:00Z')).toBe('00:30')
    // 13 Kasım 20:59 UTC = 13 Kasım 23:59 İstanbul → dün
    expect(t('2026-11-13T20:59:00Z')).toBe('Dün')
  })
  it('aynı yıl "G Aaa", farklı yıl "G Aaa YYYY"', () => {
    expect(t('2026-10-19T09:00:00Z')).toBe('19 Eki')
    expect(t('2025-10-19T09:00:00Z')).toBe('19 Eki 2025')
  })
  it('geçersiz saat dilimi adı listeyi çökertmez', () => {
    expect(chatTime('2026-11-14T07:02:00Z', now, 'Yok/Zone', 'Dün')).toBe('10:02')
  })
})
