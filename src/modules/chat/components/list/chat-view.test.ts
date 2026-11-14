import { describe, expect, it } from 'vitest'

import type { ChatSummary } from '../../model/types'
import {
  applyFilter,
  avatarOf,
  badgeCount,
  chatTime,
  chatTitle,
  isSystemGroup,
  parseFilter,
  previewOf,
} from './chat-view'

function chat(over: Partial<ChatSummary> = {}): ChatSummary {
  return {
    auto_kind: null,
    chat_id: 'c1',
    counterpart_account_id: null,
    counterpart_name: null,
    created_at: '2026-11-01T08:00:00Z',
    created_by_account_id: null,
    kind: 'group',
    last_message: null,
    last_message_at: null,
    last_seq: 0,
    mentioned: false,
    name: 'Fuar kurulum',
    source: 'none',
    source_department_id: null,
    unread_count: 0,
    ...over,
  }
}

const last = (over: Partial<NonNullable<ChatSummary['last_message']>> = {}) => ({
  body: 'Merhaba',
  created_at: '2026-11-14T08:00:00Z',
  deleted: false,
  message_id: 'm1',
  sender_account_id: 'u2',
  sender_name: 'Ali Veli',
  seq: 1,
  ...over,
})

describe('süzgeç (E-10-06)', () => {
  const items = [
    chat({ chat_id: 'a', kind: 'group', unread_count: 2 }),
    chat({ chat_id: 'b', kind: 'direct', name: null, counterpart_name: 'Ayşe', unread_count: 0 }),
    chat({ chat_id: 'c', kind: 'direct', name: null, counterpart_name: 'Can', unread_count: 5 }),
  ]
  const ids = (list: ChatSummary[]) => list.map((c) => c.chat_id)

  it('Tümü sıralamayı değiştirmez; diğerleri yalnız yüklenen satırları süzer', () => {
    expect(ids(applyFilter(items, 'all'))).toEqual(['a', 'b', 'c'])
    expect(ids(applyFilter(items, 'unread'))).toEqual(['a', 'c'])
    expect(ids(applyFilter(items, 'groups'))).toEqual(['a'])
    expect(ids(applyFilter(items, 'people'))).toEqual(['b', 'c'])
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

  it('silinmiş → "silinmiş mesaj"; gövde boş (ek) → "Dosya"', () => {
    expect(previewOf(chat({ last_message: last({ deleted: true, body: null }) }), 'u1')).toEqual({
      prefix: '',
      text: 'silinmiş mesaj',
    })
    expect(previewOf(chat({ last_message: last({ body: '' }) }), 'u1')).toEqual({
      prefix: 'Ali: ',
      text: 'Dosya',
    })
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
