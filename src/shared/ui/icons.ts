/**
 * Çizgi (stroke) simge seti — 24×24 görünüm kutusu, `t-icon` sınıfıyla çizilir. Yollar tasarım
 * kaynağından birebir alınmıştır (docs/tasarim/kaynak: Sidebar `D` haritası, Kenar-Secici, Main
 * üst çubuğu ve hızlı işlemler, Gorevler-Liste). Yeni simge yalnız tasarımda kullanıldığında eklenir.
 */
export const ICONS = {
  // Marka ve kenar menüsü (Sidebar.dc.html)
  rocket:
    'M5 19c1-4 3-6 6-7M13 11c2-4 5-6 8-7-1 3-3 6-7 8M9 15l-3 3M11 8 8 7 5 9l3 1M16 13l1 3-2 3-1-3',
  'panel-collapse': 'M4 4h16v16H4zM9 4v16M15 10l-2 2 2 2',
  'panel-expand': 'M4 4h16v16H4zM9 4v16M13 10l2 2-2 2',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  tasks: 'M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9',
  gantt: 'M4 5h9M7 10h11M5 15h7M10 20h10',
  dates: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M12 13v3l2 1',
  archive: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  meetings: 'M15 10l5-3v10l-5-3zM3 7h12v10H3z',
  messages: 'M3 6h18v12H3zM3 7l9 6 9-6',
  sheets: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14',
  'calendar-grid': 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M12 14h2M16 14h2M8 17h2M12 17h2',
  memory:
    'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  users:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3',
  coords:
    'M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M15 9h4a1 1 0 0 1 1 1v11M3 21h18M9 7h2M9 11h2M9 15h2',
  season: 'M5 21V4M5 4h11l-2 4 2 4H5',
  sim: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 14h9',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  'meeting-note': 'M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5',
  'meeting-person': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0',
  // Yön ve onay
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-up-right': 'M7 17 17 7M9 7h8v8',
  check: 'M5 12.5l4.5 4.5L19 7',
  // Üst çubuk (Main.dc.html)
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  assistant:
    'M12 2.5v3M8 6h8a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM9.5 11.5v1M14.5 11.5v1M9.5 16h5M2.5 11v4M21.5 11v4',
  // Ana sayfa göstergeleri ve hızlı işlemler (Main.dc.html)
  'user-plus': 'M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21a7 7 0 0 1 13-3.5M19 14v6M16 17h6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  bolt: 'M13 3 4 14h7l-1 7 9-11h-7z',
  document: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  // Görevler › Liste (Gorevler-Liste.dc.html)
  list: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M12 5v14M5 12h14',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  'calendar-check': 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  file: 'M14 3H6v18h12V7zM14 3v4h4',
  'file-upload': 'M14 3H6v18h12V7zM14 3v4h4M12 18v-7M9 14l3-3 3 3',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  /** Üyeler dahil (Toplanti-Detay.dc.html). */
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  external: 'M14 4h6v6M20 4l-8 8M10 4H4v16h16v-6',
  close: 'M6 6l12 12M18 6 6 18',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  /** Düzenle (Koordinatorluk-Detay.dc.html "Hakkında › Düzenle"). */
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  /** İndir (Kullanicilar.dc.html "Dışa aktar"). */
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  /** Zarf (Kullanicilar.dc.html "Şifre sıfırlama bağlantısı"). */
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  /** Kilit (Kullanicilar.dc.html "Hesabı kilitle"). */
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  /**
   * Açık kilit ("Giriş kilidini kaldır", 05 satır dışı eylem; tasarımda çizilmedi, P3): `lock`
   * gövdesi + sağ kolu açık halka.
   */
  unlock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 7.5-2',
  // Zaman çizelgesi (Gorevler-Zaman.dc.html): uzaklaştır, tam ekran, tarih değişimi bildirimi
  minus: 'M5 12h14',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  'step-forward': 'M4 12h12M12 8l4 4-4 4M20 5v14',
} as const

export type IconName = keyof typeof ICONS
