# 03c — Backend eksikleri (ne yok)

Her satır bir tasarım öğesidir; backend'de karşılığı yoksa burada durur. Kimlik verme ve `../../backend-eksikleri/kayit.md`'ye taşıma **koordinatöre** aittir; burada mevcut BE-NNN'ye bağlanır ya da `yeni-N` geçici adı kullanılır.

## 1. Mevcut kayıtla eşleşenler
| Kimlik (E-) | Öğe | BE-NNN | Kayıttaki tanım yeterli mi? | Düzeltme önerisi |
|---|---|---|---|---|
| E-03C-82, E-03C-02, E-03C-15 | Tavan uyarısı; sayaçlar ve histogramın tamlığı | BE-019 | Kısmen | "Eksik" sütununa ekle: tarih/atama/bağımlılık okuma hatası yutulur (tarihi okunamayan kalem düşer, `links` boş gelir; GAP-053); başlık sayaçları ve histogram bu yüzden yaklaşıktır. "Tasarım öğesi"ne `N görev · N bitti · N gecikmede` eklenmeli |
| E-03C-33, 44–53, 73 | 03d alt görev çubukları, ilerleme çizgisi, elmaslar, `b/t` çipi, ipucu, "ana görevin dışına taşmaz" | BE-020 | Kısmen | Üç parçaya ayrılmalı: (a) `GanttTask`'ta `subtask_counts` yok (S; liste/tekil uçta zaten var — ilerleme çizgisi ve çip için yeter); (b) Gantt yanıtında tarihli alt görevler yok (M; ADR-0024 kararının değişmesi gerekir); (c) alt görev tarihinin ana görev aralığında kalma doğrulaması yok (S; `createWorkItemSubtask` / `updateWorkItemSubtask`). Şimdilik sütununa: seçili tek görevde `listWorkItemSubtasks` + `getWorkItem.subtask_counts` ile gerçek veri gösterilebilir; "Tümünü aç" fan-out olacağı için yapılmaz |
| E-03C-30, 54, 34 | Görev kodu (`ABC-7`) | BE-005 | Evet | Ekran sütununa "03c Zaman çizelgesi" eklenmeli; `GanttTask`'ta `Department.code` de yok (adla birlikte `listProgramDepartments.code` bütün yüzlerde okunabilir, isteğe bağlı; `MyDepartment`'ta `code` yok — CX-T-03) |
| E-03C-65 | Atanana hatırlat | BE-008 | Evet; **BE-008 açık kalır** (Codex BE-008 reddi) | "Hatırlat" 03c seçili görev panelinde çizili (`Gorevler-Zaman.dc.html:168`); ekran sütunu "03 ayrıntı paneli, 03c seçili görev paneli" olmalı. "Ana sayfadan çıkarıldı" ≠ "üründen vazgeçildi" |
| E-03C-79 | Kanıt zorunlu (alt görev düzeyi, 03d kartı) | BE-006 | Evet | — (03 grubu sahibi) |

## 2. Yeni eksik önerileri
| Geçici ad | Kimlik (E-) | Öğe | Eksik (uç/alan/kural; mümkünse operationId + alan) | Şimdilik (statik / devre dışı / istemcide hesap) | Bağ (GAP/KR/ADR ya da `yeni`) | Boyut | Gerekçe |
|---|---|---|---|---|---|---|---|
| yeni-1 | E-03C-42 | Bekleyen tarih talebi uzantısı (her satırda) | `GanttTask`'ta `pending_date_request` yok (`adminGantt`/`coordinatorGantt`); WORK-K82 kuralıyla liste uçlarındaki gibi `LEFT JOIN` | Seçili görevde `getWorkItem.pending_date_request`'ten çizilir; diğer satırlarda uzantı yok | WORK-K82, GAP-053 | S | Açıklamada var; §6 fan-out yasağı ek talep listesiyle birleştirmeyi engelliyor |
| yeni-2 | E-03C-58, 59, 47 | Sürükleme/panelde sürümlü tarih yazımı | `GanttTask`'ta `dates_revision` yok; `updateWorkItem` `expected_dates_revision` ister | Panel açılışında `getWorkItem` okuması; sürükleme bırakılınca sürüm yoksa önce `getWorkItem` | ADR-0027 | S | Her sürüklemede ek okuma; bayat sürüm riski |
| yeni-3 | E-03C-28, 34, 54 | Koordinatörlük adı | `GanttTask`'ta departman adı yok — **yeni BE açılmaz; mevcut sözlükten çözülür** (CX-T-03) | Bütün yüzlerde `listProgramDepartments.display_name` ile `department_id` birleşimi (gerçek veri); ad çözümü ≠ kapsam seçimi (`myDepartments` yalnız seçim listesi) | yeni | 0 | Mevcut uç yeter; kayda girmez |
| yeni-4 | E-03C-14, 16, 17 | Sezon aralığı (şerit; **ÜRÜN kararı**, görev aralığı ≠ sezon) | `Program`'da sezon başlangıç/bitiş alanı yok (yalnız `year`) | Yüklü görevlerin en erken başlangıç – en geç bitişi; etiket **"görev aralığı"** (görev tarih aralığına "sezon" denmez; `Program.year` ayrıca yıl bilgisi olarak gösterilebilir) | yeni | koşullu S | **ÜRÜN kararı:** gerçek sezon sınırı ayrıca belirlenir; karar çıkarsa `Program`'a alan eklenir (CX `03c:yeni-3/4`) |
| yeni-5 | E-03C-70 | "İptal et" — bekleyen talebi geri çekme | Talebi açanın bekleyen talebi geri çekeceği uç yok (`deleteDateChangeRequest` bekleyende 409 `work.date_request_pending_undeletable`, yalnız yönetici) | İstemcide 5 sn gecikmeli gönderim (istek gitmeden iptal) — ürün onayıyla; ya da düğme devre dışı | GAP-204 | S–M (ayrı BE; önce ÜRÜN) | Tasarım geri almayı her değişiklikte vaat ediyor |
| yeni-6 | E-03C-70, 68 | Uzatmanın geri alınması / zincir | `extendWorkItem` negatif gün almaz; ters `updateWorkItem` bağımlı zincirini geri almaz | Garantili undo yok: `cascade_count == 0` olsa bile araya giren değişiklik, yan etkiler ve sürüm ters `updateWorkItem`'i güvensiz yapar (CX reddi: "cascade_count=0 ise ters güncelleme güvenli geri aldır" kabul edilmedi). "İptal et" için güvenli yol: **5 sn gecikmeli gönderim** (ürün kararı, istek gitmeden iptal) ya da düğme devre dışı | WORK-K40 | L (ayrı BE; önce ÜRÜN) | Geri alma tam olmazsa veri tutarsızlaşır; zincirli geri alma sunucu işi |
| yeni-7 | E-03C-47 (sonuç bilinmiyor) | Uzatma/talep yazımlarında tekrar güvenliği | `extendWorkItem` ve `requestDateChange` ne `Idempotency-Key` ne `expected_dates_revision` alır | "Sonuç bilinmiyor"da kör tekrar yok; Gantt + `getWorkItem` yeniden okunur, kullanıcıya bırakılır | ADR-0027 | M (ayrı BE) | Ağ tekrarı çift uzatma yapabilir; K5 protokolü bu uçlarda uygulanamaz |
| yeni-8 | E-03C-10, 11 | Gantt PDF / görsel dışa aktarım | Gantt dışa aktarım ucu yok (`reportSeasonPdf` dönem raporu, yalnız yönetici) | İstemcide DOM/SVG'den üretim ya da devre dışı (v1 kararı) | yeni | S–M (koşullu) | Dışa aktarım istemcide üretilebilir; satır yalnız sunucu çıktısı istenirse geçerli, istemci üretimi seçilirse gereksiz |
| yeni-9 | E-03C-05, 28 | Koordinatörün birden çok departmanı tek Gantt'ta | `coordinatorGantt` S3, tek departman | Departman değişimi kenar menüsünden; süzgeç gizli | GAP-053 | M (ÜRÜN + BE) | Yetkiyi genişletmemeli (kapsam yalnız kullanıcının zaten erişebildiği departmanlar). Tasarım çoklu seçim sayacı gösteriyor |
| yeni-10 | E-03C-37 | Koordinatör yüzünde departmanlar arası bağ | `links` yalnız iki ucu listelenen görevler arasında (WORK-K36); koordinatör yüzünde başka departmana giden bağ hiç gelmez | Seçili görevde `listDependencies` ile ok yerine metin/simge | WORK-K36 | M (ÜRÜN + BE) | Yetkiyi genişletmemeli (görünürlük kuralı WORK-K36 korunur). K4 pilotu "departmanlar arası ok" istiyor; veri yalnız admin yüzünde |

## 3. Kısmi karşılıklar
- **Gantt ↔ ayrıntı alanları:** `GanttTask` dar bir şemadır; seçili görev paneli için `getWorkItem` + `listWorkItemFiles` iki tek-görev okumasıyla tamamlanır (sürüm, bekleyen talep, alt görev sayacı, atanan adları, kanıt bayrağı, dosya sayısı). Kullanıcıya ek bir şey söylenmez; panel kısa bir yükleniyor hali gösterir.
- **"Geciken" süzgeci:** `adminGantt?overdue=true` var ama tamamlanmış geç görevi de döndürür (GAP-053) → istemcide `lateness.is_overdue` ile süzülür; uç parametresi kullanılmaz.
- **Bekleyen talep ayrıntısı:** admin `listDateChangeRequests` (sayfasız, bütün programlar), kendi talebinde koordinatör `myDateChangeRequests`; başka koordinatörün talebinde yalnız önerilen tarihler (GAP-204).
- **Alt görevler (03d):** tek görev için `listWorkItemSubtasks` gerçek veri verir (tarihli alt görev, `done`); Gantt yanıtında yok. v1: statik (BE-020) — ancak ürün sahibi isterse açılan **tek** satır isteğe bağlı okumayla gerçek gösterilebilir ("Tümünü aç" hariç).
- **Bağımlılık okları:** veri var (`links`), çizim istemcide; tasarımda yalnız simge.
- **Atanan adları:** Gantt yalnız `assignee_account_ids`; tasarımda çizilmiyor, panelde gerekirse `getWorkItem.assignees`.

## 4. Yol haritası kararıyla çelişenler
- **K4 / tasarım tek yüz:** tasarım koordinatör izlenimli; admin yüzünde talep yerine doğrudan değişiklik + bekleyen talep onay/red arayüzü tasarımda yok → ürün sahibine: admin paneli "Kaydet" + "Onayla / Reddet" düğmeleri hangi biçimde?
- **Sürükleme → talep mi doğrudan mı (ürün sahibine soru):** sözleşme koordinatöre doğrudan `updateWorkItem`/`extendWorkItem` izni de veriyor (§4 satır 1, §6 madde 4); "Değişiklik onaya gider" bir ürün tercihidir, zorunluluk değildir. Seçenekler: (A) koordinatör sürüklemesi her zaman `requestDateChange`, admin sürüklemesi doğrudan; (B) ikisi de doğrudan (talep yalnız paneldeki düğmeyle); (C) koordinatörde bitiş ileri ≤ N gün doğrudan `extendWorkItem`, diğerleri talep. Bildirim metni ("süresi uzatıldı") yalnız doğrudan yolda doğrudur.
- **K5 etkili işlem onayı:** yol haritası K5 409 `organization.confirmation_required` → onay diyaloğu der; tarih yazan hiçbir uçta (`updateWorkItem`, `extendWorkItem`, `requestDateChange`, `reviewDateChangeRequest`) bu kod yoktur. Bağımlı kayması sessizdir ve sonradan `cascade_count` / `affected_tasks_count` ile bildirilir; Gantt için diyalog gerekmez (yol haritası K5 metnine "yalnız organization uçları" notu eklenmesi koordinatöre).
- **"İptal et":** talep yolunda sözleşmede geri alma yok (yeni-5); K5 "aynı anahtarla tekrar" ilkesi bu uçlarda uygulanamaz (yeni-7).
- **Üye yüzünde bağımlılık simgesi:** §3 bağımlılıkları üyeye kapalı sayıyor ama `memberGantt.links` dolu gelir → üye yüzünde simge gösterilsin mi?
- **ADR-0024 / 03d:** alt görev Gantt dışı; v1'de statik gösterim (yol haritası §6) — tamamen gizleme seçeneği ürün sahibinde.
- **K3:** "Tümünü aç" için görev başına alt görev isteği fan-out sayılır, yapılmaz.

## 5. Önerilen backend iş paketleri
1. **Gantt şemasını zenginleştir (S):** `GanttTask`'a `pending_date_request` (yeni-1), `dates_revision` (yeni-2), `subtask_counts` (BE-020a), isteğe bağlı departman adı/kod (yeni-3, BE-005). Tek sorgu, mevcut liste üretimini yeniden kullanır.
2. **Gantt tavanı ve hata yutma (S–M):** imleç + kesilme sinyali + okuma hatasının yüzeye çıkması (BE-019, GAP-053); `overdue` anlamının düzeltilmesi.
3. **Tarih yazım güvenliği — ayrı BE'ler, önce ÜRÜN:** `extendWorkItem`/`requestDateChange`'e `Idempotency-Key` ve/veya `expected_dates_revision` (yeni-7, M); bekleyen talebi açanın geri çekmesi (yeni-5, S–M); uzatmanın zincirle geri alınması (yeni-6, L, ürün kararına bağlı).
4. **Alt görev Gantt'ı (M, ADR değişikliği):** tarihli alt görevlerin Gantt yanıtına girmesi + ana görev aralığı doğrulaması (BE-020b/c).
5. **Program sezon aralığı (S):** `Program`'a sezon tarihleri (yeni-4).
6. **Koordinatör çoklu departman Gantt'ı ve departmanlar arası bağ (M):** yeni-9, yeni-10 — birlikte ele alınmalı.
7. Hatırlatma (BE-008) ve Gantt dışa aktarımı (yeni-8, yalnız sunucu çıktısı istenirse).

Sıra önerisi: 1 → 3 → 2 (F3 açılmadan), 4–7 sonra.
