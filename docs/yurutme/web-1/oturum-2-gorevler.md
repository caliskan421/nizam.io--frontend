# O2 — Görevler (W41 → W42–W47)

## Açılış istemi

```
WEB-1 O2 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-1/README.md → ortak-sozlesme.md → oturum-2-gorevler.md → ilerleme.md
→ docs/ekranlar/ortak-kurallar.md (tamamı, §12) → docs/ekranlar/03-gorevler-liste/ (README kabul tablosu → mekanizma → backend → eksikler → ozellikler)
→ docs/backend-eksikleri/rapor-F0.md.
Giriş: WEB-0 kapalı (#25, #26 main'de, WEB-0-codex hükmü), CI yeşil.
O2a: W41'i başlat; dönüşte kapı, PR, birleştir. Ardından koordinatör imzası (aşağıda), sonra O2b: W42–W47 paralel.
Kod yazma (imza hariç). Dönüşte kapıları worktree'de koş, YENİ-EKSİK'e BE kimliği ver ve kayit.md'ye işle, her W için ayrı PR,
CI yeşilse birleştir (O2b sırası: W42 → W43 → W44 → W45 → W46 → W47). Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

**Koordinatör imzası (W41 birleştikten sonra, O2b'den önce, tek commit):** `src/modules/work/components/index.ts` — O2b bileşenlerinin adları ve prop/emit tipleri, boş gövdeli yer tutucularla: `WorkDetailPanel` (W43; prop `workItemId`), `SubtaskBlock` / `SubtaskTab` (W44), `NewTaskDialog`, `StatusMenu`, `DeleteTaskAction` (W45), `FileUploadDialog`, `FilesTab`, `SubtaskFileSlot` (W46), `NotesTab` (W47). Her W yalnız kendi bileşeninin gövdesini doldurur; `index.ts`'e satır ekleyemez.

**Hepsi için ortak kabul kaynağı:** `docs/ekranlar/03-gorevler-liste/README.md` uygulama kararı tablosu — W bloğundaki E-kimliklerinin **`kabul`** satırlarındaki "Kabul kanıtı" sütunu, o W'nin kabul ölçütüdür (burada tekrar yazılmaz). Satır dışı varsayımlar tablosu bütün O2b W'lerini bağlar.

## W41 — `modules/work` veri katmanı (O2a)

- **Sahip:** `src/modules/work/api/**` (yeni), `src/modules/work/model/**` (mevcut `capabilities.ts` genişler), `src/modules/work/routes.ts`, `src/modules/work/public.ts` (yeni), `src/app/routes.catalog.ts` yalnız `work.tasks` faz satırı (F0 `devre_disi` → F1 canlı) ve `home` F1 notu, `src/app/shell/side/badges.ts` yalnız Görevler rozetlerini F1'de etkinleştirme, `src/shared/ui/conflict/**` (yeni).
- **Tespit:** `03-gorevler-liste/backend.md` §1 (okuma uçları), §2 (yazma uçları), §3 (eylem görünürlüğü, `istemci-akislari.md` §4 satırları), §5 (sorgu anahtarları); `ortak-kurallar.md` §6 (anahtar tablosu), §7 (yazma protokolü), §9–§10 (fan-out, sayfa tavanı). Rozetler: `00-ortak/README.md` E-00-14/15 (W21 kararı: F0'da hesaplanmaz → F1'de Admin canlı).
- **İş:** Her okuma ucu için TanStack sorgu composable'ı (`listProgramWorkItems` imleçli sonsuz sorgu, `limit` 200; `getWorkItem`; `listWorkItemSubtasks`; `listWorkItemFiles`; `listWorkItemNotes`; `listProgramDepartments`/`myDepartments` süzgeç seçenekleri; indirme bileti), her yazma ucu için `useProtectedMutation` sarmalayıcısı (`createWorkItem`+`addAssignments` kısmi başarı modeli, `updateWorkItem`, `transitionWorkItem`/`ownStatusWorkItem`, `deleteWorkItem`, alt görev CRUD, `attachFile` multipart, `renameFile`, `deleteFile`, not CRUD); başarı → `query-keys.ts` geçersizleme listesi, iyimser yok. `capabilities.ts`: `backend.md` §3 tablosunun tamamı (s.139–152) saf işlem + tablo testi; P1 (mercek değil `company_admin`/`role`). `shared/ui/conflict`: 409 `edit_conflict` alan alan seçim diyaloğu (W22'nin F1'e bıraktığı; W44/W47 tüketir). Rota kataloğu `/gorevler` parametreleri satır dışı varsayım tablosundaki kabul kümesiyle (`kisi` yok, imleç URL'de yok).
- **Eksikler (BE):** veri katmanında stub yok; BE-003/004/038/040 kapanana dek sayım/arama/süzme/sıralama istemcide yapılır (W42).
- **Kabul:** her uç için msw testi (gerçek istemci, kapsam başlıkları S2/S3 doğru); fan-out yok (tek `department_id`, §9); `next_cursor` dolu/boş sonsuz sorgu testi; kısmi başarı testi ("görev oluşturuldu, ek atama yapılamadı"); capability tablo testi (mercek × rol × `company_admin`); çakışma diyaloğu klavye + seçim testi; Görevler öğesi F1'de canlı, Admin rozetleri `reportDashboard`'dan, K/Ü `designStub('BE-003')`.

## W42 — Görev listesi sayfası (O2b)

- **Sahip:** `src/modules/work/pages/TasksPage.vue` (+ parçaları `src/modules/work/pages/tasks/**`), `src/modules/work/components/list/**`.
- **Tespit:** E-03-03…13, E-03-15…29, E-03-38…40 (+ E-03-05 "Zaman çizelgesi" devre dışı "F3'te", E-03-14 devre dışı); `mekanizma.md` §1–§2, §5–§6; `backend.md` §4 (türetilen değerler). Tasarım: `Gorevler-Liste.dc.html`, `Gorevler-Liste-Acik.dc.html`.
- **İş:** Tablo + satır; Tümü + 5 durum sekmesi (`iade_edildi` "Geri gönderildi") + "Geciken" (P5); talep bandı ve `talep` süzgeci (üyede gizli); istemci araması (`tr` katlama, ~300 ms); koordinatörlük tek seçim (yalnız Admin merceği, P4/K3); kişi süzgeci statik `designStub('BE-038')`; istemci sıralaması (BE-040); "Daha fazla yükle" (numaralı sayfalayıcı ve "sayfa başına" gizli, P4); her sayaçta "yüklenen kayıtlar içinde" etiketi (§10); toplu seçim kutuları gizli (P7); URL parametreleri katalogdan; boş/yükleniyor/hata (K7); "Yeni görev" düğmesi `NewTaskDialog`'u, satır tıklaması `WorkDetailPanel`'i (URL `gorev`) açar.
- **Eksikler (BE):** BE-003, BE-004, BE-005 (kısa kod: önek `ProgramDepartment.code`, sıra `—`), BE-036 (1), BE-038, BE-039, BE-040.
- **Kabul:** E-kimliklerinin kabul kanıtları + satır dışı varsayımlar (kapsam değişince arama/sekme korunur, süzgeç/panel/imleç sıfırlanır; tek açılır).

## W43 — Ayrıntı paneli (O2b)

- **Sahip:** `src/modules/work/components/detail/**` (`WorkDetailPanel` gövdesi).
- **Tespit:** E-03-19 (URL `gorev`), E-03-41…51, E-03-53…55, E-03-43; `mekanizma.md` §4; `backend.md` §1 `getWorkItem` satırı.
- **İş:** Üst bilgi (kod · koordinatörlük, başlık), kapat; sekme kabı Özet · Alt görevler · Dosyalar · Notlar (sayılar panel açıkken ayrıntı uçlarından; içerikleri W44/W46/W47 bileşenleri); Özet: atanan listesi, oluşturan, tarihler, son dosya adı (Arşiv bağlantısı devre dışı "F5'te"); ilerleme çizgisi statik (BE-007/BE-091, sahte olay yok); "Kopyala" = bağlantı panoya + toast (P7); "Hatırlat" devre dışı `designStub('BE-008')`; "Tarih değişikliği iste" devre dışı "F3'te" (P5); durum seçici yeri `StatusMenu`, silme `DeleteTaskAction` (W45); 404 `work.item_not_found` → panel kapanır + bildirim.
- **Eksikler (BE):** BE-005, BE-007, BE-008, BE-091.
- **Kabul:** E-kimliklerinin kabul kanıtları; yönetici salt okunur etiketi (E-03-44); sekme klavye gezinmesi.

## W44 — Alt görevler (O2b)

- **Sahip:** `src/modules/work/components/subtasks/**` (`SubtaskBlock`, `SubtaskTab`).
- **Tespit:** E-03-21 (blok açma), E-03-30…37, E-03-60; `mekanizma.md` §3–§4; `backend.md` §2 alt görev satırları; ADR-0024 sınırı.
- **İş:** Satır içi blok ve panel sekmesi **aynı sorgu**; ekle (IK Enter/Ekle başına, sonuç bilinmiyorsa taslak korunur), tamamla/geri aç (`done`, iyimser yok), kişi (yalnız ana göreve atananlar), tarih aralığı, başlık; 409 `edit_conflict` → `shared/ui/conflict`; sil → istemci onayı; "zorunlu alanlar" kutuları devre dışı `designStub('BE-006')` (P5: yeni bayrak yok); kanıt yuvası `SubtaskFileSlot` (W46).
- **Eksikler (BE):** BE-006, BE-020 (tarih sınırı doğrulaması F3).
- **Kabul:** E-kimliklerinin kabul kanıtları; satır içi ↔ panel aynı sorgu testi.

## W45 — Yeni görev, durum geçişi, silme (O2b; K5 tüketicisi)

- **Sahip:** `src/modules/work/components/forms/**` (`NewTaskDialog`, `StatusMenu`, `DeleteTaskAction`).
- **Tespit:** E-03-06, E-03-56…58, E-03-64; `backend.md` §2 `createWorkItem`, `transitionWorkItem`/`ownStatusWorkItem`, `deleteWorkItem`; `istemci-akislari.md` §5 (geçiş hedefleri); `ortak-kurallar.md` §7.
- **İş:** P3 minimum form (vee-validate + zod, K11): başlık, koordinatörlük (kapsamdan), tek atanan (koordinatöre ek `addAssignments`), tarih aralığı, öncelik, kanıt bayrağı (varsayılan `true`); başarıda liste yenilenir ve yeni görev panelde açılır; kısmi başarı metni. Durum menüsü: geçiş matrisi, geri almada `reason`, 409 `work.subtasks_open` → onay → `close_subtasks: true`, 422 `work.attachment_required` → "Önce kanıt dosyası yükleyin" + `FileUploadDialog`. Silme: `shared/ui/confirm` → `deleteWorkItem` → panel kapanır (`confirmation_required` yok).
- **Eksikler (BE):** yok.
- **Kabul:** E-kimliklerinin kabul kanıtları; IK gönder başına (düzeltip yeniden gönderme yeni anahtar); geçiş matrisi tablo testi.

## W46 — Dosyalar (O2b)

- **Sahip:** `src/modules/work/components/files/**` (`FileUploadDialog`, `FilesTab`, `SubtaskFileSlot`).
- **Tespit:** E-03-35 (alt görev yuvası), E-03-50 (dosya adı), E-03-52, E-03-61; `backend.md` §1 `listWorkItemFiles`, indirme bileti; §2 `attachFile`, `renameFile`, `deleteFile`.
- **İş:** `attachFile` multipart (`tag` kapalı küme etiket seçici — P5; `subtask_id` isteğe bağlı; IK; görev durumu değişmez); liste; indirme `issueDownloadTicket` → `redeemDownloadTicket`; ad değiştir (s.149; 409 `records.name_taken`); sil (yalnız yükleyen, s.150; kalıcı → istemci onayı). `files` anahtarı 03c/06 ile ortak (§6).
- **Eksikler (BE):** yok (BE-006 kanıt bayrağı W44'te).
- **Kabul:** E-kimliklerinin kabul kanıtları; anahtar paylaşımı testi; belirteç/bilet URL'si depolanmaz.

## W47 — Notlar (O2b)

- **Sahip:** `src/modules/work/components/notes/**` (`NotesTab`).
- **Tespit:** E-03-62; `backend.md` §1 `listWorkItemNotes`, §2 not satırları.
- **İş:** Not listesi; yazma alanı (s.144; yönetici gizli; uzunluk sınırı openapi şemasından, uydurulmaz); `addWorkItemNote` IK zorunlu; kendi notunu düzenle (`expected_revision`, 409 `edit_conflict` → `shared/ui/conflict`) / sil (onay).
- **Eksikler (BE):** yok.
- **Kabul:** E-03-62 kabul kanıtı (yönetici gizli; `edit_conflict` alan seçimi); 403 `work.not_assigned` metni i18n'den.
