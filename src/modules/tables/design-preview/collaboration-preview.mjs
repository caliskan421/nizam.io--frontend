export function mount(root) {
  const byId = (id) => root.getRootNode().getElementById(id)
  const make = (tag, content, className) => {
    const node = document.createElement(tag)
    node.textContent = content
    if (className) node.className = className
    return node
  }

  const schedule = [
    ['Kayıt masası · sabah', '22 Kas', 'Bahar Kılıç', 'İdari işler', '4.500 ₺', true],
    ['Kayıt masası · öğleden sonra', '22 Kas', 'Merve Koçoğlu', 'İdari işler', '4.500 ₺', false],
    ['Salon A sahne yönetimi', '24 Kas', 'Yunus Çiftçioğlu', 'Operasyon', '7.200 ₺', false],
    ['Basın merkezi', '23 Kas', 'Büşra Çiftçioğlu', 'Satış ve pazarlama', '3.800 ₺', false],
    ['Jeneratör nöbeti', '24 Kas', 'Salih Özer', 'Elektrik ve enerji', '2.400 ₺', true],
    ['Ziyaretçi yönlendirme', '24 Kas', 'Gökçe Nur Usta', 'Operasyon', '5.100 ₺', false],
    ['Ödül töreni sahne', '27 Kas', 'Melek Yaşar', 'Operasyon', '6.000 ₺', false],
  ]
  const labels = ['Vardiya', 'Tarih', 'Sorumlu', 'Koordinatörlük', 'Bütçe', 'Tamam']
  const comments = new Map([
    [
      '3:0',
      [
        ['Yunus Çiftçioğlu', 'Basın merkezi iki kişiyle mi kurulacak?'],
        ['Büşra Çiftçioğlu', 'Evet, ikinci kişiyi öğleden sonraya ekliyorum.'],
      ],
    ],
  ])
  const history = [
    { title: 'Kayıt masası · sabah / Tamam', before: false, after: true, row: 0, version: 1 },
    { title: 'Tablo yenilendi', detail: 'Satırlarda güncelleme alındı.' },
    { title: 'Yorumlar yenilendi', detail: 'Seçili hücrenin yorumları güncellendi.' },
    { title: 'Tablo açıldı', detail: 'Güncel tablo okundu.' },
  ]

  const versions = [1, 0, 0, 0, 0, 0, 0]
  let selected = [3, 0]
  let editor = true
  let connected = true
  let reconnecting = false
  let reconnectTimer
  let mine = false
  let pendingUndo = null
  let lastGridButton = null

  function renderRows() {
    byId('rows').replaceChildren(
      ...schedule.map((values, row) => {
        const line = make('tr', '')
        const index = make('th', String(row + 1))
        index.scope = 'row'
        line.append(index)

        values.forEach((value, col) => {
          const key = row + ':' + col
          const cell = make('td', '', 'cell')
          const selectedCell = selected && selected[0] === row && selected[1] === col
          const control = make('button', col === 5 ? (value ? '✓ Evet' : 'Hayır') : value)
          control.type = 'button'
          control.dataset.cell = key
          control.setAttribute(
            'aria-label',
            values[0] + ' / ' + labels[col] + ': ' + control.textContent,
          )
          control.setAttribute('aria-pressed', String(Boolean(selectedCell)))
          if (comments.has(key)) {
            cell.classList.add('note')
            control.setAttribute('aria-label', control.getAttribute('aria-label') + ', yorum var')
          }
          if (
            connected &&
            !reconnecting &&
            ((row === 2 && col === 1) || (row === 4 && col === 2))
          ) {
            const who = row === 2 ? 'Bahar K.' : 'Salih Ö.'
            cell.classList.add('remote', row === 2 ? 'bahar' : 'salih')
            control.append(make('span', who, 'cursor'))
          }
          control.addEventListener('click', () => {
            selected = [row, col]
            lastGridButton = key
            byId('comment').value = ''
            renderRows()
            renderComments()
            byId('comment-title').tabIndex = -1
            byId('comment-title').focus()
          })
          cell.append(control)
          line.append(cell)
        })
        return line
      }),
    )
  }

  const displayCheck = (value) => (value ? 'Evet' : 'Hayır')

  function renderComments() {
    byId('comments').hidden = selected === null
    if (!selected) return
    const [row, col] = selected
    const key = row + ':' + col
    const records = comments.get(key) || []
    byId('comment-title').textContent = schedule[row][0] + ' · ' + labels[col]
    byId('comment-error').hidden = true
    byId('comment-empty').hidden = records.length > 0
    byId('comment-form').hidden = !editor
    byId('comment-list').replaceChildren(
      ...records.map(([author, copy]) => {
        const item = make('li', '')
        const text = make('div', '')
        item.append(
          make(
            'span',
            author
              ? author
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
              : '—',
            'person',
          ),
        )
        text.append(make('strong', author || 'Yazar bilgisi yok'), make('p', copy))
        item.append(text)
        return item
      }),
    )

    const existing = byId('edit-check')
    if (existing) existing.remove()
    if (col !== 5 || !editor || !connected) return
    const edit = make(
      'button',
      schedule[row][5] ? 'Tamam işaretini kaldır' : 'Tamam olarak işaretle',
      't-btn t-btn--secondary t-btn--sm',
    )
    edit.id = 'edit-check'
    edit.type = 'button'
    edit.addEventListener('click', () => {
      const previous = schedule[row][5]
      schedule[row][5] = !previous
      versions[row] += 1
      history.unshift({
        title: schedule[row][0] + ' / Tamam',
        before: previous,
        after: !previous,
        row,
        version: versions[row],
      })
      announce('Değişiklik bu oturumda kaydedildi.')
      renderRows()
      renderComments()
      renderHistory()
      byId('edit-check').focus()
    })
    byId('comments').append(edit)
  }

  function renderHistory() {
    const visibleItems = mine ? history.filter((item) => item.row !== undefined) : history
    byId('all').setAttribute('aria-pressed', String(!mine))
    byId('own').setAttribute('aria-pressed', String(mine))
    byId('history').replaceChildren(
      ...visibleItems.map((item) => {
        const local = item.row !== undefined
        const line = make('li', '')
        const text = make('div', '')
        line.append(make('span', local ? 'S' : '↻', local ? 'person mine' : 'person'))
        text.append(make('strong', item.title))
        if (local) {
          const diff = make('p', '', 'diff')
          diff.append(
            make('s', displayCheck(item.before)),
            make('span', '→'),
            make('strong', displayCheck(item.after)),
          )
          text.append(diff)
          if (editor && connected && !item.undone && versions[item.row] === item.version) {
            const undo = make('button', 'Geri al', 't-btn t-btn--ghost t-btn--sm')
            undo.type = 'button'
            undo.addEventListener('click', () => {
              pendingUndo = item
              byId('undo-confirm').hidden = false
              byId('confirm-undo').focus()
            })
            text.append(undo)
          }
        } else {
          text.append(make('p', item.detail, 'subtle'))
        }
        line.append(text)
        return line
      }),
    )
  }

  function announce(message) {
    const result = byId('result')
    result.hidden = false
    result.textContent = message
  }

  function renderConnection() {
    const status = byId('status')
    status.dataset.warn = String(!connected || reconnecting)
    status.textContent = reconnecting
      ? 'Güncel tablo okunuyor…'
      : connected
        ? '● Bağlı'
        : 'Bağlantı kesildi'
    byId('presence').hidden = !connected || reconnecting
    byId('reconnect').hidden = connected || reconnecting
    renderRows()
    renderComments()
    renderHistory()
  }

  byId('width').addEventListener('change', (event) => {
    byId('artboard').dataset.width = event.target.value
  })
  byId('theme').addEventListener('click', () => {
    const isDark = root.dataset.theme === 'dark'
    root.dataset.theme = isDark ? 'light' : 'dark'
    byId('theme').textContent = isDark ? 'Koyu tema' : 'Açık tema'
  })
  byId('mode').addEventListener('change', (event) => {
    editor = event.target.value !== 'viewer'
    connected = event.target.value !== 'offline'
    reconnecting = false
    pendingUndo = null
    byId('undo-confirm').hidden = true
    byId('result').hidden = true
    renderConnection()
  })

  byId('reconnect').addEventListener('click', () => {
    reconnecting = true
    renderConnection()
    reconnectTimer = window.setTimeout(() => {
      if (!reconnecting) return
      byId('mode').value = 'editor'
      reconnecting = false
      connected = true
      renderConnection()
    }, 500)
  })

  byId('close-comments').addEventListener('click', () => {
    selected = null
    renderRows()
    renderComments()
    byId('rows')
      .querySelector('[data-cell="' + (lastGridButton || '3:0') + '"]')
      .focus()
  })

  byId('comment-form').addEventListener('submit', (event) => {
    event.preventDefault()
    if (!selected || !editor) return
    const input = byId('comment')
    const body = input.value.trim()
    if (!connected || !body) {
      const error = byId('comment-error')
      error.textContent = connected
        ? 'Yorum yazın.'
        : 'Bağlantı kesildi. Yorumunuz bu ekranda duruyor.'
      error.hidden = false
      return
    }
    const key = selected.join(':')
    const items = comments.get(key) || []
    comments.set(key, [...items, ['Siz', body]])
    input.value = ''
    renderRows()
    renderComments()
    input.focus()
  })

  byId('toggle-history').addEventListener('click', (event) => {
    const panel = byId('history-panel')
    panel.hidden = !panel.hidden
    event.target.setAttribute('aria-expanded', String(!panel.hidden))
    byId('artboard').querySelector('.workspace').classList.toggle('workspace--single', panel.hidden)
  })

  for (const filter of ['all', 'own']) {
    byId(filter).addEventListener('click', () => {
      mine = filter === 'own'
      renderHistory()
    })
  }

  byId('cancel-undo').addEventListener('click', () => {
    pendingUndo = null
    byId('undo-confirm').hidden = true
    byId('own').focus()
  })

  byId('confirm-undo').addEventListener('click', () => {
    const item = pendingUndo
    pendingUndo = null
    byId('undo-confirm').hidden = true
    if (!item || !connected || !editor) return
    const mode = byId('mode').value
    if (mode === 'conflict' || versions[item.row] !== item.version) {
      announce('Hücreler geri alınamadı. Güncel tabloda geri alınabilecek hücre kalmadı.')
    } else {
      schedule[item.row][5] = item.before
      versions[item.row] += 1
      item.undone = true
      announce(
        mode === 'partial'
          ? '1 hücre geri alındı. Daha sonra değişen örnek hücre atlandı.'
          : 'Değişiklik geri alındı.',
      )
      renderRows()
      renderComments()
      renderHistory()
    }
    byId('result').tabIndex = -1
    byId('result').focus()
  })

  renderConnection()
  return () => window.clearTimeout(reconnectTimer)
}
