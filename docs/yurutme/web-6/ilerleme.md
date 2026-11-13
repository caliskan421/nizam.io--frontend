# WEB-6 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F6 AÇILDI 2026-11-13** (kullanıcı onayı; pin `v0.15.0-api` yeterli — eksikler kayıt; backend paketi açılmaz). Kararlar P46–P53 ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)).

## Durum

| Oturum                | Durum                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| O1 tespit + kararlar  | W134 ‖ W135 çalışıyor (W135 belge tamam; W134 13 Raporlar tespiti ayrı dal) |
| O2a W136              | Başlamadı (O1 MERGED bekler)                                              |
| O2b W137–W141         | Başlamadı                                                                 |
| O3 W142               | Başlamadı                                                                 |
| O4 kapanış            | Başlamadı                                                                 |

## Kayıtlar

### İskelet (2026-11-12)

W131 (WEB-5 O4) bu klasörü hazırlık olarak açtı. Açılış kapısı [oturum-1-hazirlik.md](oturum-1-hazirlik.md)'de.

### F6 açıldı — O1 (2026-11-13)

- **Kararlar:** P46 (kapsam), P47 (raporlar ayrı sayfa değil, menü öğesi yok), P48 (dönem PDF bölüm seçimi, varsayılan hepsi), P49 (ZIP iki yerde, BE-120 stub), P50 (toplantı raporu içeriği), P51 (01f tek artboard; [BE] statikler), P52 (sekme/listeler uygulanmaz), P53 (K1/Ü1, rol menüleri).
- **Snapshot:** tasarım kopyası `1794590338-3fe0` (v85) — kullanıcı `Bildirimler`, `Asistan`, `Takvim`, `Kurumsal-Hafiza`, `Takvim-Hafiza`'yı ekledi; Raporlar ailesi (`Raporlar`, `Rapor-Donem`, `Rapor-Toplanti`, `Rapor-Pencereler`, `Rapor-Noktalar`, `Raporlar-Acik`); `Sidebar`, `theme.css`, `Koord-Gorevler` değişti ([tasarım README](../../tasarim/README.md)).
- **W135** (`web6/o1-kararlar`): tasarım kopyası, ortak-kurallar §12 P46–P53 + §5 F6 eki, 01 kabul tablosu F6 satırları (E-01-12, 19–39) kapatıldı, K1/Ü1 tespiti (01 README/özellikler/mekanizma/backend/eksikler), 00-ortak rol menüleri, web-6 belgeleri.
- **W134** (`13-raporlar` tespiti + `kayit.md` BE-122…): ayrı dal; sahiplik 13-raporlar, 03/05/06/09 ekleri, `kayit.md`.
- **Geçici kabuller (koordinatör varsayılanları, P53'ün içeriği):** E-01-19 `total_admins` ipucu; E-01-20 rol kartı → 05 rol süzgeci; E-01-26 eşitlikte ad A→Z, "Son yükleme" ölçütü BE-025'e dek devre dışı; E-01-28 koordinatör merceğinde kartlar program geneli; E-01-31 koordinatörler + "+N üye" (BE-079); E-01-33/34 artık dilim nötr "onayda/iade" (BE-078); E-01-37 `archiveFolders` ikinci istek, yönetici P33 kapsamı; E-01-38 satır gizli (BE-025). 01b F6 dışı.
- **Açık / izlenen:** (1) K1/Ü1 sayfa seçimi ve Ü1 "program geneli" kapsamı W135 varsayımıdır, ürün/koordinatör teyidi bekler ([01 README K1/Ü1](../../ekranlar/01-ana-sayfa/README.md)). (2) **Açık tema v85 borcu — KAPANDI HASH_YER (ürün sahibi kararı 2026-11-13)**; aşağısı tarihsel kayıttır (theme.css v85 kopyalandı, pin e641d2e; kaynak zaten v85 değerlerini taşıyordu): `docs/tasarim/kaynak/theme.css` önceki sürümde (`1794501200-387f`) bırakıldı; `design/web-tokens.json` ve `src/shared/tokens` main ile aynı. Neden: v85 açık tema pinli tasarım sistemi kaynağındaki (`tokens/design-system.tokens.json`) 35 değeri değiştiriyor (aşağıdaki tablo) ve 10 yeni değişken getiriyor (`--glass`, `--glass-line`, `--hi`, `--hi-ink`, `--hi-ink-2`, `--chart-done`, `--av-neutral`, `--av-neutral-ink`, `--nav-on`, `--bar-done`); kaynak + `designTokens` pini güncellenmeden web'e alınamaz. *(Karar verildi, kapandı.)*

| Değişken (açık tema) | Önceki (pinli kaynak) | v85 |
| --- | --- | --- |
| `--bg-base` | `#f6f6f3` | `#eceef1` |
| `--bg-raised` | `#f1f1ed` | `#f2f3f5` |
| `--bg-overlay` | `#e7e7e2` | `#e6e8ec` |
| `--border-subtle` | `#e5e5df` | `#e2e5e9` |
| `--border-strong` | `#d0d0c9` | `#cfd3d9` |
| `--border-control` | `#96968f` | `#bfc4cb` |
| `--ink` | `#161615` | `#121316` |
| `--ink-muted` | `#5c5c57` | `#555a63` |
| `--ink-faint` | `#71716b` | `#70757e` |
| `--accent` | `#c8f53c` | `#cbe83c` |
| `--accent-top` | `#d8f866` | `#d8f05e` |
| `--accent-ink` | `#161615` | `#121316` |
| `--accent-text` | `#4a6a00` | `#4f6e00` |
| `--focus-ring` | `#4a6a00` | `#121316` |
| `--violet` | `#7a26c1` | `#7334d9` |
| `--gold` | `#a86f00` | `#c27400` |
| `--danger` | `#d02b2b` | `#e0441c` |
| `--btn-bottom` | `#f4f4f0` | `#f6f7f8` |
| `--btn-border` | `#d5d5ce` | `#d9dde2` |
| `--scrim` | `#16161566` | `#12131659` |
| `--gp-todo` | `#d3d6dc` | `#bfc4cc` |
| `--gp-doing` | `#d2a2ee` | `#a675f2` |
| `--gp-review` | `#ffdc85` | `#ffbf2e` |
| `--gp-back` | `#ffb4a4` | `#ff8c6e` |
| `--gp-done` | `#d6f56f` | `#c3e33a` |
| `--gp-late` | `#ffa0a0` | `#ff7d5c` |
| `--gp-late-line` | `#d02b2b` | `#e0441c` |
| `--gp-ink` | `#17181c` | `#121316` |
| `--gp-ink-muted` | `#4a4d55` | `#3f434a` |
| `--shadow-card` | `0 1px 2px rgba(22,22,21,0.05), 0 6px 20px rgba(22,22,21,0.06)` | `0 1px 2px rgba(18,19,22,.05),0 6px 18px rgba(18,19,22,.06)` |
| `--shadow-sheet` | `0 24px 64px rgba(22,22,21,0.14)` | `0 24px 64px rgba(18,19,22,.16)` |
| `--role-admin` | `#e57a9a` | `#ec4f86` |
| `--role-uye` | `#73a9e3` | `#3c82ea` |
| `--avatar-1` | `#c8f53c` | `#bfe02f` |
| `--glass-ink` | `#161615` | `#121316` |

(3) v85 `Sidebar`'da Zaman çizelgesi öğesi yok (Takvim geldi); 03c girişi menüde korunur ([00-ortak mekanizma §9.5](../../ekranlar/00-ortak/mekanizma.md)). (4) W134 kayıt bloğuna aday notlar: [01 eksikler §6](../../ekranlar/01-ana-sayfa/eksikler.md).
