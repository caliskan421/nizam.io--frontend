export function mount(root) {
  const selectScene = root.querySelector('#scenario')
  const width = root.querySelector('#width')
  const preview = root.querySelector('#preview')
  const theme = root.querySelector('#theme')
  const button = (text, next, tone = 'secondary') =>
    `<button class="t-btn t-btn--${tone}" type="button"${next ? ` data-next="${next}"` : ''}>${text}</button>`
  const actions = (...buttons) => `<div class="actions">${buttons.join('')}</div>`
  const badge = (text, tone = '') =>
    `<span class="t-badge${tone ? ' t-badge--' + tone : ''}">${text}</span>`
  const field = (title, control) => `<label class="field">${title}${control}</label>`
  const input = (value = '', attrs = '') => `<input class="t-input" value="${value}" ${attrs}>`
  const select = (options, attrs = '') =>
    `<select class="t-select" ${attrs}>${options.map((option) => `<option>${option}</option>`).join('')}</select>`
  const card = (title, html, extra = '') =>
    `<section class="t-card stack ${extra}"><h4>${title}</h4>${html}</section>`
  const tip = (title, text, tone = '', extra = '') =>
    `<div class="tip" data-tone="${tone}" role="status"><strong>${title}</strong><p>${text}</p>${extra}</div>`
  const state = (title, text, ...buttons) =>
    card(title, `<p class="muted">${text}</p>${actions(...buttons)}`, 'state')
  const heading = (title, desc, ...buttons) =>
    `<header class="app-head"><div><h3>${title}</h3><p>${desc}</p></div>${actions(...buttons)}</header>`
  const exampleTable = 'Fuar haftası vardiya planı'

  const collaboration = (content, label = 'Tablolar / Kişisel') =>
    heading(exampleTable, label) + content
  const advancedScenes = {
    project: [
      'Proje bağı',
      () =>
        collaboration(
          card(
            'Projeye bağla',
            field('Proje', select(['Proje bağı yok', 'Fuar hazırlığı'])) +
              tip('Proje tabloları gruplar', 'Tabloya erişimi mevcut paylaşım ayarları belirler.') +
              actions(button('Bağı kaydet', 'project-saved', 'primary')),
            'sheet',
          ),
        ),
    ],
    'project-saved': [
      'Proje bağı · Sonuç',
      () => collaboration(tip('✓ Proje bağı güncellendi', 'Tablo paylaşımı aynı kaldı.')),
    ],
    template: [
      'Şablon olarak işaretleme',
      () =>
        collaboration(
          card(
            'Şablon',
            '<label class="choice"><input type="checkbox"> Bu tabloyu şablon olarak kullan</label>' +
              '<p class="muted">Tabloya zaten erişebilen kişiler yapıyı şablondan kopyalayabilir.</p>' +
              actions(button('Kaydet', 'template-saved', 'primary')),
            'sheet',
          ),
        ),
    ],
    'template-saved': [
      'Şablon · Sonuç',
      () =>
        collaboration(
          tip('✓ Şablon ayarı kaydedildi', 'Ayarı Şablon bölümünde değiştirebilirsiniz.'),
        ),
    ],
    copy: [
      'Tablo kopyalama',
      () =>
        collaboration(
          card(
            'Tabloyu kopyala',
            field('Yeni tablo adı', input('Fuar haftası vardiya planı — kopya')) +
              '<fieldset><legend>Kopyalanacak içerik</legend><label class="choice"><input type="radio" name="copy" checked> Yalnız sütun yapısı</label><label class="choice"><input type="radio" name="copy"> Yapı, satırlar ve erişilebilen veriler</label></fieldset>' +
              tip(
                'Paylaşım yeniden ayarlanır',
                'Kopyanın sahibi siz olursunuz. Kaynak tablonun paylaşım ayarları kopyaya taşınmaz.',
              ) +
              actions(button('Kopyala', 'copy-done', 'primary')),
            'sheet',
          ),
        ),
    ],
    'copy-done': [
      'Kopya · Sonuç',
      () => collaboration(tip('✓ Kopya oluşturuldu', 'Fuar haftası vardiya planı — kopya')),
    ],
    'copy-stale': [
      'Kopya · Kaynak değişti',
      () =>
        collaboration(
          state(
            'Kopya oluşturulamadı',
            'Kaynak tablo değişti. Güncel tabloyu okuyup kopya seçeneklerini yeniden gözden geçirin.',
            button('Kopya seçeneklerine dön', 'copy', 'primary'),
          ),
        ),
    ],
    move: [
      'Tabloyu taşı',
      () =>
        collaboration(
          card(
            'Bu tablo taşınsın mı?',
            field('Hedef çalışma alanı', select(['Altyapı ve tesisat'])) +
              tip(
                'Paylaşım ve proje bağı',
                'Doğrudan erişimler, ekip paylaşımı ve mevcut proje bağı kaldırılır. Hedefte paylaşımı yeniden ayarlayabilirsiniz.',
                'warn',
              ) +
              actions(button('Vazgeç', 'project'), button('Tabloyu taşı', 'move-done', 'primary')),
            'sheet',
          ),
        ),
    ],
    'move-done': [
      'Taşıma · Sonuç',
      () =>
        collaboration(
          tip('✓ Tablo taşındı', 'Altyapı ve tesisat'),
          'Tablolar / Altyapı ve tesisat',
        ),
    ],
    proposal: [
      'Koordinatörlüğe öner',
      () =>
        collaboration(
          card(
            'Tablo önerisi',
            field('Hedef koordinatörlük', select(['Altyapı ve tesisat'])) +
              field('Öneri türü', select(['Taşıma', 'Kopyalama'])) +
              field(
                'Hedefte ekip erişimi',
                select(['Kapalı', 'Görüntüleyebilir', 'Düzenleyebilir']),
              ) +
              tip(
                'Karar beklenir',
                'Öneri onaylanana kadar kişisel tablonuz mevcut çalışma alanında kalır.',
              ) +
              actions(button('Öneriyi gönder', 'proposal-pending', 'primary')),
            'sheet',
          ),
        ),
    ],
    'proposal-pending': [
      'Öneri · Bekliyor',
      () =>
        collaboration(
          card(
            'Altyapı ve tesisat',
            badge('Karar bekliyor', 'gold') +
              '<p>Bu tablo için bir öneri beklemede.</p>' +
              actions(button('Öneriyi geri çek', 'proposal-withdraw', 'ghost')),
            'sheet',
          ),
        ),
    ],
    'proposal-withdraw': [
      'Öneri · Geri çekildi',
      () => collaboration(tip('✓ Öneri geri çekildi', 'Tablo mevcut çalışma alanında kalır.')),
    ],
    'proposal-review': [
      'Öneri · Koordinatör kararı',
      () =>
        collaboration(
          card(
            'Gelen taşıma önerisi',
            '<p>Fuar haftası vardiya planı</p><p class="muted">8 satır · Görev, Saat, Hazır</p>' +
              '<p>Ekip erişimi: Görüntüleyebilir</p>' +
              actions(
                button('Reddet', 'proposal-rejected'),
                button('Taşımayı onayla', 'proposal-done', 'primary'),
              ),
            'sheet',
          ),
          'Tablolar / Altyapı ve tesisat',
        ),
    ],
    'proposal-rejected': [
      'Öneri · Reddedildi',
      () => collaboration(tip('Öneri reddedildi', 'Tablonun yeri değişmedi.')),
    ],
    'proposal-done': [
      'Öneri · Onaylandı',
      () =>
        collaboration(
          tip('✓ Öneri onaylandı', 'Tablo Altyapı ve tesisat alanına taşındı.'),
          'Tablolar / Altyapı ve tesisat',
        ),
    ],
    'proposal-stale': [
      'Öneri · Güncel değil',
      () =>
        collaboration(
          card(
            'Öneri artık güncel değil',
            tip(
              'Onay uygulanmadı',
              'Kaynak tablo veya erişim koşulları değişti. Yeni bir öneri isteyebilirsiniz.',
              'warn',
            ) +
              actions(
                button('Reddet', 'proposal-rejected'),
                button('Öneriyi yeniden incele', 'proposal-review'),
              ),
            'sheet',
          ),
        ),
    ],
    'proposal-decided': [
      'Öneri · Karar verilmiş',
      () =>
        collaboration(
          state(
            'Bu öneri sonuçlandı',
            'Güncel durum için önerileri yenileyin.',
            button('Önerilere dön', 'proposal-review'),
          ),
        ),
    ],
    presence: [
      'Birlikte çalışma · Bağlı',
      () =>
        collaboration(
          card(
            'Birlikte çalışma',
            '<div class="chips">' +
              badge('● Bağlı', 'accent') +
              badge('Deniz · Kurulum / Saat') +
              '</div>' +
              '<p class="muted">Bu oturumda görünen düzenleyiciler.</p>' +
              actions(button('Yorumları aç', 'comments')),
          ),
        ),
    ],
    disconnected: [
      'Birlikte çalışma · Yeniden bağlanıyor',
      () =>
        collaboration(
          tip(
            'Bağlantı yeniden kuruluyor',
            'Bağlantı durumu ve aktif düzenleyiciler güncelleniyor.',
            'warn',
            actions(button('Güncel tabloyu yükle', 'presence', 'primary')),
          ),
        ),
    ],
    comments: ['Yorumlar · Düzenleyebilir', () => collaboration(comments(false))],
    'comments-viewer': ['Yorumlar · Görüntüleyebilir', () => collaboration(comments(true))],
    'comment-saved': ['Yorumlar · Gönderildi', () => collaboration(comments(false, true))],
    undo: [
      'Kendi hücre düzenlememi geri al',
      () =>
        collaboration(
          card(
            'Son hücre düzenlemeniz',
            '<p>Kurulum satırındaki saat ve hazır bilgisi</p>' +
              tip(
                'Yalnız uygun hücreler geri alınır',
                'Daha sonra değişen veya artık kullanılamayan hücreler atlanır.',
                'warn',
              ) +
              actions(
                button('Vazgeç', 'presence'),
                button('Düzenlememi geri al', 'undo-partial', 'primary'),
              ),
            'sheet',
          ),
        ),
    ],
    'undo-partial': [
      'Geri alma · Kısmi sonuç',
      () =>
        collaboration(
          tip(
            '1 hücre geri alındı',
            'Saat hücresi daha sonra değiştiği için atlandı.',
            'warn',
            actions(button('Tabloyu yenile', 'presence', 'primary')),
          ),
        ),
    ],
    'undo-unsuitable': [
      'Geri alma · Kaynak uygun değil',
      () =>
        collaboration(
          tip(
            'Bu düzenleme geri alınamıyor',
            'Kendi uygun hücre düzenlemelerinizi güncel tablodan yeniden inceleyin.',
            'warn',
            actions(button('Tabloya dön', 'presence')),
          ),
        ),
    ],
    'undo-conflict': [
      'Geri alma · Uygun hücre kalmadı',
      () =>
        collaboration(
          tip(
            'Hücreler geri alınamadı',
            'Güncel tabloda geri alınabilecek bir hücre kalmadı.',
            'warn',
            actions(button('Tabloyu yenile', 'presence')),
          ),
        ),
    ],
  }

  function comments(readOnly, saved = false) {
    return card(
      'Kurulum · Yorumlar',
      '<ul class="card-list"><li><strong>Deniz</strong><p>Kurulum ekibi girişte buluşacak.</p></li><li><strong>Yazar bilgisi yok</strong><p>Yerleşim notları güncellendi.</p></li>' +
        (saved ? '<li><strong>Siz</strong><p>Teşekkürler, not aldım.</p></li>' : '') +
        '</ul>' +
        (readOnly
          ? badge('Görüntüleyebilir')
          : field(
              'Yorumunuz',
              '<textarea class="t-input" maxlength="4000" placeholder="Yorum yazın"></textarea>',
            ) + actions(button('Yorum gönder', 'comment-saved', 'primary'))),
      'sheet',
    )
  }

  function showScene(key, moveFocus = false) {
    if (!Object.hasOwn(advancedScenes, key)) return
    selectScene.value = key
    preview.innerHTML = `<div class="frame" data-width="${width.value}">
    <aside class="app-nav" aria-label="Örnek kenar menüsü">
      <div class="brand"><span aria-hidden="true" class="brand-mark">R</span><strong>RoketPortal</strong></div>
      <ul><li>Ana sayfa</li><li>Görevler</li><li class="active">Tablolar</li></ul>
    </aside>
    <div class="app-main">
      <header class="app-bar"><span class="phone-brand">RoketPortal</span><span class="context">Güz dönemi</span><span>Tablolar</span></header>
      <div class="app-content">${advancedScenes[key][1]()}</div>
    </div>
  </div>`
    if (!moveFocus) return
    const heading = preview.querySelector('h3')
    heading.tabIndex = -1
    heading.focus()
  }

  selectScene.replaceChildren(
    ...Object.entries(advancedScenes).map(([key, [title]]) => new Option(title, key)),
  )
  selectScene.addEventListener('change', () => showScene(selectScene.value))
  width.addEventListener('change', () => {
    preview.querySelector('.frame').dataset.width = width.value
    preview.scrollLeft = 0
  })
  preview.addEventListener('click', (event) => {
    const node = event.target.closest('button[data-next]')
    if (node) showScene(node.dataset.next, true)
  })
  theme.addEventListener('click', () => {
    const dark = root.dataset.theme === 'dark'
    root.dataset.theme = dark ? 'light' : 'dark'
    theme.textContent = dark ? 'Koyu tema' : 'Açık tema'
  })
  showScene('project')
}
