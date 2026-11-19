export function mount(root) {
  const byId = (id) => root.getRootNode().getElementById(id)
  const screen = byId('screen')
  const programs = { guz: 'Güz dönemi', bahar: 'Bahar dönemi' }
  const units = { ops: 'Operasyon', sales: 'Satış ve pazarlama', tech: 'Altyapı ve tesisat' }
  const people = {
    deniz: ['Deniz Arı', 'Koordinatör'],
    ece: ['Ece Kaya', 'Şirket yöneticisi'],
    mert: ['Mert Yıldız', 'Birim üyesi'],
    asya: ['Asya Güneş', 'Birim üyesi'],
    selin: ['Selin Akın', 'Koordinatör'],
  }
  const accounts = { coordinator: 'deniz', admin: 'ece', member: 'mert' }
  const roles = { editor: 'Düzenler', viewer: 'Görür', none: 'Kapalı' }
  const headers = ['Vardiya', 'Gün', 'Durum']
  const tables = [
    {
      id: 't1',
      program: 'guz',
      unit: 'ops',
      name: 'Fuar haftası vardiya planı',
      owner: 'deniz',
      team: 'none',
      grants: {},
      rows: [
        ['Kayıt masası', '22 Kas', 'Hazır'],
        ['Basın merkezi', '23 Kas', 'Planlandı'],
        ['Yönlendirme', '24 Kas', 'Hazır'],
      ],
    },
    {
      id: 't2',
      program: 'guz',
      unit: 'ops',
      name: 'Ekipman takibi',
      owner: 'deniz',
      team: 'viewer',
      grants: {},
      rows: [
        ['Ses sistemi', '22 Kas', 'Hazır'],
        ['Pano', '23 Kas', 'Bekliyor'],
      ],
    },
    {
      id: 't3',
      program: 'guz',
      unit: 'sales',
      name: 'Saha görüşmeleri',
      owner: 'selin',
      team: 'none',
      grants: { ece: 'editor' },
      rows: [
        ['Sponsor standı', '19 Kas', 'Planlandı'],
        ['Sunum alanı', '20 Kas', 'Hazır'],
      ],
    },
    {
      id: 't4',
      program: 'guz',
      unit: 'tech',
      name: 'Kurulum ve kontrol',
      owner: 'selin',
      team: 'viewer',
      grants: {},
      rows: [['Giriş aydınlatması', '21 Kas', 'Bekliyor']],
    },
    {
      id: 't5',
      program: 'guz',
      unit: null,
      name: 'Deniz’in kişisel notları',
      owner: 'deniz',
      team: 'none',
      grants: {},
      rows: [['Taslak', '18 Kas', 'Kişisel']],
    },
    {
      id: 't6',
      program: 'bahar',
      unit: 'ops',
      name: 'Bahar hazırlık listesi',
      owner: 'deniz',
      team: 'none',
      grants: {},
      rows: [['Katılım dosyası', '15 May', 'Hazır']],
    },
  ]
  let nextTable = 7
  let role = 'coordinator'
  let program = 'guz'
  let area = 'unit'
  let opened = ''
  let panel = ''
  let cell = null
  let pendingRemoval = ''
  let query = ''
  let unitFilter = ''
  let accessFilter = ''
  let message = ''

  function safe(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
    )
  }
  const action = (caption, verb, type = 'secondary', data = '') =>
    `<button type="button" class="t-btn t-btn--${type} t-btn--sm" data-action="${verb}" ${data}>${caption}</button>`
  const badge = (caption, active = false) =>
    `<span class="t-badge${active ? ' t-badge--accent' : ''}">${safe(caption)}</span>`
  const options = (values, selected = '') =>
    values
      .map(
        ([key, title]) =>
          `<option value="${safe(key)}"${key === selected ? ' selected' : ''}>${safe(title)}</option>`,
      )
      .join('')
  const roleOptions = (selected, all = false) =>
    options(
      all
        ? [
            ['none', 'Kapalı'],
            ['viewer', 'Görür'],
            ['editor', 'Düzenler'],
          ]
        : [
            ['viewer', 'Görür'],
            ['editor', 'Düzenler'],
          ],
      selected,
    )

  function permission(table) {
    if (table.program !== program) return ''
    const account = accounts[role]
    if (role === 'admin' && !table.unit) return ''
    if (table.owner === account) return 'owner'
    if (role === 'admin') return table.grants[account] === 'editor' ? 'editor' : 'admin-read'
    const team = role === 'member' && table.unit === 'ops' ? table.team : 'none'
    if (table.grants[account] === 'editor' || team === 'editor') return 'editor'
    if (table.grants[account] === 'viewer' || team === 'viewer') return 'viewer'
    return ''
  }

  function permissionLabel(table) {
    switch (permission(table)) {
      case 'owner':
        return 'Sahip'
      case 'editor':
        return role === 'admin' ? 'Doğrudan izin · Düzenler' : 'Düzenler'
      case 'viewer':
        return 'Görür'
      default:
        return 'Yönetici erişimi · Salt okunur'
    }
  }
  const current = () => tables.find((table) => table.id === opened && permission(table))
  const canWrite = (table) => ['owner', 'editor'].includes(permission(table))
  const coordinateSpace = () => role !== 'coordinator' || area === 'unit'
  const notice = () => (message ? `<p class="notice" role="status">${safe(message)}</p>` : '')
  const unitLabel = (table) => (table.unit ? units[table.unit] : 'Kişisel')
  const hasShare = (table) => table.team !== 'none' || Object.keys(table.grants).length > 0

  function tableCard(table) {
    const miniRows = table.rows.slice(0, 2)
    const sample = [headers, ...(miniRows.length ? miniRows : [['Henüz satır yok', '—', '—']])]
    const grid = sample
      .map(
        (row) =>
          `<span class="mini-row">${row.map((value) => `<span>${safe(value)}</span>`).join('')}</span>`,
      )
      .join('')
    return `<button type="button" class="t-card table-card" data-action="open" data-id="${table.id}" aria-label="${safe(table.name)} tablosunu aç">
      <span class="mini" aria-hidden="true">${grid}</span>
      <span class="card-body"><strong class="name">${safe(table.name)}</strong><span class="muted">${safe(unitLabel(table))} · ${safe(people[table.owner][0])}</span>
      <span class="chips">${badge(permissionLabel(table), permission(table) === 'owner' || canWrite(table))}</span></span>
    </button>`
  }

  function renderCards() {
    const container = byId('cards')
    if (!container) return
    const normalized = query.trim().toLocaleLowerCase('tr')
    const results = tables.filter(
      (table) =>
        permission(table) &&
        Boolean(table.unit) === coordinateSpace() &&
        (!unitFilter || table.unit === unitFilter) &&
        (!normalized ||
          [table.name, unitLabel(table)].some((text) =>
            text.toLocaleLowerCase('tr').includes(normalized),
          )) &&
        (accessFilter !== 'shared' || hasShare(table)) &&
        (accessFilter !== 'unshared' || !hasShare(table)) &&
        (accessFilter !== 'direct-edit' || table.grants.ece === 'editor'),
    )
    container.innerHTML = results.length
      ? results.map(tableCard).join('')
      : `<div class="t-card empty"><strong>Tablo bulunamadı</strong><p class="muted">${normalized || unitFilter || accessFilter ? 'Arama veya süzgeçleri değiştirebilirsiniz.' : 'Bu çalışma alanındaki erişilebilir tablolar burada görünür.'}</p></div>`
  }

  function listView() {
    const admin = role === 'admin'
    const title = admin ? 'Koordinatörlük tabloları' : 'Tablolar'
    const description = admin
      ? 'Seçili programdaki koordinatörlük tablolarını inceleyin.'
      : coordinateSpace()
        ? 'Operasyon koordinatörlüğü'
        : 'Kişisel çalışma alanı'
    const areas =
      role === 'coordinator'
        ? `<div class="segment" aria-label="Çalışma alanı">
      <button type="button" data-action="area" data-value="unit" aria-pressed="${area === 'unit'}">Koordinatörlük</button>
      <button type="button" data-action="area" data-value="personal" aria-pressed="${area === 'personal'}">Kişisel</button>
    </div>`
        : ''
    const filters = admin
      ? `<label>Koordinatörlük<select id="unit-filter" class="t-select">${options([['', 'Tüm koordinatörlükler'], ...Object.entries(units)], unitFilter)}</select></label>
      <label>Paylaşım<select id="access-filter" class="t-select">${options(
        [
          ['', 'Tüm tablolar'],
          ['shared', 'Paylaşılmış'],
          ['unshared', 'Paylaşılmamış'],
          ['direct-edit', 'Doğrudan düzenleyebildiklerim'],
        ],
        accessFilter,
      )}</select></label>`
      : ''
    return `<header class="head"><div><h1>${title}</h1><p class="muted">${description}</p></div>
      ${role === 'coordinator' ? action('+ Yeni tablo', 'create', 'primary') : ''}</header>
      ${areas}${notice()}
      <div class="filter"><label>Tablo ara<input id="search" class="t-input" type="search" placeholder="Tablo adını yazın" value="${safe(query)}"></label>${filters}</div>
      ${panel === 'create' ? createView() : ''}
      <div class="cards" id="cards" aria-label="Tablolar"></div>`
  }

  function createView() {
    return `<form class="t-card stack sheet" data-form="create">
      <h2>Boş tablo oluştur</h2><p class="muted">${coordinateSpace() ? 'Operasyon · ' : 'Kişisel · '}${programs[program]}</p>
      <label>Tablo adı<input id="new-name" class="t-input" name="title" required maxlength="200" placeholder="Örn. Karşılama ekibi"></label>
      <div class="actions">${action('Vazgeç', 'close')}<button class="t-btn t-btn--primary t-btn--sm" type="submit">Oluştur</button></div>
    </form>`
  }

  function gridView(table) {
    const writable = canWrite(table)
    const rows = table.rows
      .map(
        (entry, index) =>
          `<tr><th scope="row">${index + 1}</th>${entry
            .map(
              (value, col) =>
                `<td>${writable ? `<button type="button" data-action="edit" data-row="${index}" data-column="${col}" aria-label="${index + 1}. satır, ${headers[col]}: ${safe(value || 'Boş')}. Düzenle">${safe(value || '—')}</button>` : safe(value || '—')}</td>`,
            )
            .join('')}</tr>`,
      )
      .join('')
    if (!rows)
      return '<div class="t-card empty"><strong>Henüz satır yok</strong><p class="muted">Eklenen kayıtlar burada görünür.</p></div>'
    return `<div class="grid" role="region" tabindex="0" aria-label="Yatay kaydırılabilen tablo">
      <table aria-label="${safe(table.name)}"><thead><tr><th scope="col">#</th>${headers.map((title) => `<th scope="col">${title}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
    </div>`
  }

  function editor(table) {
    if (!canWrite(table) || !cell) return ''
    return `<form class="t-card stack sheet" data-form="cell">
      <h2>Hücreyi düzenle</h2><label>${headers[cell[1]]} · ${cell[0] + 1}. satır<input id="cell-value" class="t-input" name="value" value="${safe(table.rows[cell[0]][cell[1]])}" maxlength="200"></label>
      <div class="actions">${action('Vazgeç', 'close')}<button type="submit" class="t-btn t-btn--primary t-btn--sm">Kaydet</button></div>
    </form>`
  }

  function detailView(table) {
    const access = permission(table)
    const help =
      access === 'admin-read'
        ? `<div class="notice"><strong>Yönetici erişimi · Salt okunur</strong><p>Bu tabloyu program genelinde inceleyebilirsiniz. Hücre düzenleme için sahibin doğrudan “Düzenler” izni gerekir.</p></div>`
        : ''
    const side = panel === 'share' && access === 'owner' ? sharingView(table) : ''
    const content = `<div class="stack">${panel === 'cell' ? editor(table) : ''}${gridView(table)}</div>`
    return `<header class="head"><div>
      ${action('← Tablolar', 'back', 'ghost')}<h1>${safe(table.name)}</h1><p class="muted">${safe(unitLabel(table))} · Sahip ${safe(people[table.owner][0])}</p>
      </div><div class="actions">${canWrite(table) ? action('+ Satır ekle', 'row') : ''}${access === 'owner' ? action('Paylaş', 'share', 'primary') : ''}</div></header>
      <div class="chips">${badge(permissionLabel(table), canWrite(table))}${table.unit && table.team !== 'none' ? badge('Ekip · ' + roles[table.team]) : ''}</div>
      ${help}${notice()}${side ? `<div class="grid-row">${content}${side}</div>` : content}`
  }

  function sharingView(table) {
    const candidates = ['ece', 'mert', 'asya'].filter((id) => !Object.hasOwn(table.grants, id))
    const entries = Object.entries(table.grants)
      .map(([id, access]) => {
        const person = people[id][0]
        const initials = person
          .split(' ')
          .map((part) => part[0])
          .join('')
        return `<li class="share-line"><div class="group"><span class="avatar" aria-hidden="true">${safe(initials)}</span>
        <div><strong class="name">${safe(person)}</strong><p class="muted">${safe(people[id][1])} · ${roles[access]}</p></div></div>
        <form class="actions" data-form="change-grant" data-person="${id}">
          <select class="t-select" name="access" aria-label="${safe(person)} izin düzeyi">${roleOptions(access)}</select>
          <button class="t-btn t-btn--secondary t-btn--sm" type="submit">Kaydet</button>
          ${action('Erişimi kaldır', 'remove-ask', 'ghost', `data-person="${id}" id="remove-${id}"`)}
        </form></li>`
      })
      .join('')
    const nextGrant = candidates.length
      ? `<form class="stack" data-form="grant">
      <h3>Kişi ekle</h3>
      <div class="group"><label>Kişi<select class="t-select" id="share-person" name="person">${options(candidates.map((id) => [id, people[id].join(' · ')]))}</select></label>
      <label>İzin<select class="t-select" id="share-access" name="access">${roleOptions('viewer')}</select></label></div>
      <div class="actions"><button class="t-btn t-btn--primary t-btn--sm" type="submit">İzin ver</button></div>
    </form>`
      : ''
    const team = table.unit
      ? `<form class="stack" data-form="team"><h3>Birim ekibi</h3><p class="muted">Bu izin, ${safe(unitLabel(table))} ekibinin güncel üyelerine uygulanır.</p>
      <label>Ekip izni<select class="t-select" id="team-access" name="access">${roleOptions(table.team, true)}</select></label>
      <div class="actions"><button class="t-btn t-btn--secondary t-btn--sm" type="submit">Ekip iznini kaydet</button></div>
    </form>`
      : ''
    const confirm = pendingRemoval
      ? `<div class="stack confirm" role="alert">
      <strong>${safe(people[pendingRemoval][0])} için doğrudan erişim kaldırılsın mı?</strong>
      <p class="muted">${pendingRemoval === 'ece' && table.unit ? 'Yönetici bu birim tablosunu salt okunur incelemeye devam edebilir.' : 'Geçerli bir ekip izni varsa kişi tablodaki erişimini o izinle sürdürür.'}</p>
      <div class="actions">${action('Vazgeç', 'remove-cancel', 'ghost', 'id="remove-cancel"')}${action('Erişimi kaldır', 'remove-confirm', 'danger')}</div>
    </div>`
      : ''
    return `<section class="t-card stack" aria-labelledby="share-title">
      <header class="head"><h2 id="share-title" tabindex="-1">Tabloyu paylaş</h2>${action('Kapat', 'close', 'ghost')}</header>
      ${team}<h3>Doğrudan erişimi olanlar</h3>
      <ul class="share-list" aria-label="Doğrudan erişimi olanlar"><li class="share-line"><div><strong>${safe(people[table.owner][0])}</strong><p class="muted">Sahip</p></div></li>${entries}</ul>
      ${confirm}${nextGrant}
    </section>`
  }

  function render(focusId = '') {
    const account = people[accounts[role]]
    byId('identity').textContent = account.join(' · ')
    const table = current()
    if (!table) {
      opened = ''
      if (panel !== 'create') panel = ''
    }
    screen.innerHTML = table ? detailView(table) : listView()
    renderCards()
    if (focusId) byId(focusId)?.focus()
  }

  function closePanel() {
    panel = ''
    cell = null
    pendingRemoval = ''
  }

  function resetFilters() {
    query = ''
    unitFilter = ''
    accessFilter = ''
  }

  function navigate(button) {
    const table = current()
    switch (button.dataset.action) {
      case 'area':
        area = button.dataset.value
        resetFilters()
        closePanel()
        break
      case 'open':
        opened = button.dataset.id
        closePanel()
        break
      case 'back':
        opened = ''
        closePanel()
        break
      case 'create':
        if (role !== 'coordinator') return
        panel = 'create'
        render('new-name')
        return
      case 'close':
        closePanel()
        break
      case 'share':
        if (!table || permission(table) !== 'owner') return
        panel = 'share'
        render('share-title')
        return
      case 'row':
        if (!table || !canWrite(table)) return
        table.rows.push(['', '', ''])
        cell = [table.rows.length - 1, 0]
        panel = 'cell'
        render('cell-value')
        return
      case 'edit':
        if (!table || !canWrite(table)) return
        cell = [Number(button.dataset.row), Number(button.dataset.column)]
        panel = 'cell'
        render('cell-value')
        return
      case 'remove-ask':
        if (!table || permission(table) !== 'owner') return
        pendingRemoval = button.dataset.person
        render('remove-cancel')
        return
      case 'remove-cancel': {
        const previous = pendingRemoval
        pendingRemoval = ''
        render('remove-' + previous)
        return
      }
      case 'remove-confirm':
        if (!table || permission(table) !== 'owner' || !pendingRemoval) return
        delete table.grants[pendingRemoval]
        message = people[pendingRemoval][0] + ' için doğrudan erişim kaldırıldı.'
        pendingRemoval = ''
        render('share-title')
        return
      default:
        return
    }
    render()
  }

  screen.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]')
    if (button) {
      message = ''
      navigate(button)
    }
  })

  screen.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = event.target
    const data = new FormData(form)
    const kind = form.dataset.form
    if (kind === 'create' && role === 'coordinator') {
      const name = data.get('title').trim()
      if (!name) return
      opened = 't' + nextTable++
      tables.push({
        id: opened,
        program,
        unit: coordinateSpace() ? 'ops' : null,
        name,
        owner: accounts[role],
        team: 'none',
        grants: {},
        rows: [],
      })
      closePanel()
      message = 'Tablo oluşturuldu.'
      render()
      return
    }
    const table = current()
    if (!table) return
    if (kind === 'cell' && canWrite(table) && cell) {
      table.rows[cell[0]][cell[1]] = data.get('value')
      closePanel()
      message = 'Hücre kaydedildi.'
    } else if (permission(table) === 'owner' && kind === 'team' && table.unit) {
      table.team = data.get('access')
      message = table.team === 'none' ? 'Ekip erişimi kapatıldı.' : 'Ekip erişimi güncellendi.'
    } else if (permission(table) === 'owner' && (kind === 'grant' || kind === 'change-grant')) {
      const person = kind === 'grant' ? data.get('person') : form.dataset.person
      table.grants[person] = data.get('access')
      message = people[person][0] + ' için doğrudan erişim güncellendi.'
    } else return
    render()
  })

  screen.addEventListener('input', (event) => {
    if (event.target.id !== 'search') return
    query = event.target.value
    renderCards()
  })
  screen.addEventListener('change', (event) => {
    if (event.target.id === 'unit-filter') unitFilter = event.target.value
    else if (event.target.id === 'access-filter') accessFilter = event.target.value
    else return
    renderCards()
  })

  byId('role').addEventListener('change', (event) => {
    role = event.target.value
    const previous = current()
    area = previous && !previous.unit ? 'personal' : 'unit'
    closePanel()
    resetFilters()
    message = ''
    render()
  })
  byId('program').addEventListener('change', (event) => {
    program = event.target.value
    opened = ''
    closePanel()
    resetFilters()
    message = ''
    render()
  })
  byId('width').addEventListener('change', (event) => {
    byId('frame').dataset.width = event.target.value
  })
  byId('theme').addEventListener('click', (event) => {
    const dark = root.dataset.theme === 'dark'
    root.dataset.theme = dark ? 'light' : 'dark'
    event.target.textContent = dark ? 'Koyu tema' : 'Açık tema'
  })

  render()
}
