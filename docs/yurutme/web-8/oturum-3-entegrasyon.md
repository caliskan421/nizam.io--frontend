# O3 — W176 zorunlu entegrasyon turu (iskelet)

**Durum (2026-11-15):** başlamadı. Girdi: O2b W171–W175 birleşik main + `TASLAK:` satırları (KESİN 16). Yöntem [web-7 O3](../web-7/oturum-3-entegrasyon.md) kalıbıdır: gerçek router/AppShell/oturum, durumlu sahte sunucu, gerçek bileşenler; sunucu görünürlüğü **süzmeden** döner, süzme istemcide sınanır.

## Zorunlu senaryolar

1. **Yetki:** yönetici arşivi S2 yolu (P33 geçici yolu **yok**: `listProgramDepartments` + `archiveTasks` ∩ görev kesişimi çağrılmaz); koordinatör/üye S3 başlığı (`X-Nizamio-Department`) kapsamı; kapsam dışı erişim 403/404; yönetici merceği ≠ yetki (P1); `actor` `sirket_yoneticisi` geçişleri; `MyDepartment.role` daralması.
2. **Bilet hedefleri:** ZIP (dönem, seçimli, `include_reports`), silinenler CSV, kullanıcı CSV (`exportUsersCsv`, 10000 satır bütçesi, `organization.export_*`), dosya indirme — bilet alınıp hedefe yönlendirilir; kesinti/aşım hata kodu → i18n.
3. **Arşiv:** klasör özeti, süzülmüş toplam ("‹i› / ‹N›"), etiket değiştirme (`retagFile`), dosyasız göreve ilk yükleme (`include_empty`).
4. **Raporlar:** `sections` + `department_ids`, 429/503 `Retry-After` geri sayımı (BE-135), kapalı dağılım şeması, ZIP raporları.
5. **K1/Ü1 + görev kodu:** kod 03 satırı/panel/Gantt'ta; dosya sayısı, onaya sunuş, bağımlılık özeti, iade sebebi, tarih talebi zamanları, birim koordinatör adı.
6. **Silinenler:** süzgeç/sıra/imleç, tür sayaçları, toplu geri yükle/kalıcı sil kısmi başarı, çöpü boşalt onayı, CSV.
7. **Toplantılar:** `tab_counts`, `when`/`sort`, not süzgeçleri, katılımcı adayları (kesilme uyarısı kalkar), `Idempotency-Key` (üç oluşturma ucu: aynı anahtarla yeniden gönder tek kayıt).
8. **Bildirim sözlüğü:** `work.task.reminder` 13. tür; diğer 12 tür ve sohbet/bildirim stub'ları **değişmez** (P74).
9. **Pin yokluk testleri:** kaldırılan her `designStub` için "eski yol yok" testi (KESİN 35).

Kanıt: entegrasyon test sayıları, `kusur` listesi (düzeltildi/sabitlendi), görsel duman satırı. Sonuç bu dosyaya O4'te W177 tarafından işlenir.
