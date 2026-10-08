## Ne değişti

- Faz / dilim: <!-- ör. F09 WEB-1b -->
- Değişen modül(ler): <!-- ör. src/modules/identity, src/shared/http -->

## Backend sözleşmesi

- Kullanılan backend etiketi (`api-pin.json`): <!-- ör. v0.1.0-api -->
- Dokunulan uçlar: <!-- METOT /yol listesi; yoksa "yok" -->
- Spec veya üretilen dosyalar değişti mi? <!-- hayır / evet: pin yükseltildi (eski → yeni etiket), `pnpm gen:api` çıktısı; nedeni -->
- Spec'te eksik/yanlış uç bulundu mu? <!-- hayır / evet: backend'de iş açıldı (istemci uydurmaz) -->

## Kanıt

- [ ] CI yeşil: tsc, lint (sınır kuralı dahil), vitest, üretim kapısı (gen:api + gen:tokens diff = 0), build, `pnpm audit --prod`, Playwright duman (gerçek backend)
- [ ] Belirteç yalnız bellekte; kapsam (S2/S3) ve CSRF başlıkları doğru
- [ ] Yeni hata kodu / kullanıcı metni varsa `src/shared/i18n/tr/errors.ts` güncel
- Test kanıtı: <!-- eklenen/değişen testler, CI run bağlantısı -->
- Ekran görüntüsü: <!-- UI değiştiyse; CI "playwright" artefaktı da kullanılabilir -->

## Açık kalan / riskler
