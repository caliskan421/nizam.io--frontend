import '../../../../../src/shared/tokens/tokens.gen.css'

const pages = [
  ['own.html', 'Kendi SVG (Vue)'],
  ['svar.html', 'SVAR Vue Gantt (MIT)'],
  ['frappe.html', 'Frappe Gantt (MIT)'],
  ['dhtmlx.html', 'DHTMLX Gantt Community (MIT)'],
  ['baseline.html', 'Taban: yalnız kabuk (paket boyutu farkı için)'],
]
const ul = document.createElement('ul')
for (const [href, text] of pages) {
  const li = document.createElement('li')
  const a = document.createElement('a')
  a.href = href!
  a.textContent = text!
  li.append(a)
  ul.append(li)
}
document.getElementById('app')!.append(ul)
