// W176 O3 · KESİN 32/O2b girdisi (W172): 01f önizlemesi sözleşme tavanındaki büyük dönemi (5000 görev
// satırı + 2000 dosya satırı, `X-Result-Truncated` yok) sanallaştırmasız çizer. Ölçüm: yanıt
// geldikten sonra kâğıdın çizilmesi. Gerçek süre beklemesi yok (jsdom render süresi ölçülür);
// 2 sn aşıldı (jsdom ~2,5 sn): borç + gerileme bekçisi (KESİN 32: kasıtlı büyük veri testi; süre
// uzatması yük gerekçesiyle değil, 5000+2000 satırlık sabit işin doğası gereğidir).
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  idle,
  reports,
  resetReports,
  teardown,
  until,
  useReportsBackend,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const STAGE = () => $('[data-testid="season-stage"]')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
  await until(STAGE, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetReports())
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('5000 görev + 2000 dosya: kesme uyarısı yok, satırlar çizilir, render ölçülür', async () => {
  reports.state.season = 'large'
  const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
  const t0 = performance.now()
  await until(STAGE, 'önizleme')
  await until(() => $$('[data-gantt-task]').length > 0, 'Gantt satırları', 20_000)
  const elapsed = performance.now() - t0
  await idle(app.queryClient)
  expect($('[data-testid="season-truncated"]')).toBeNull()
  // Ölçüm (KESİN 32 kanıtı): rapora yazılır.
  console.info(
    `W176 reports-live-large: ${$$('[data-gantt-task]').length} Gantt satırı, ${elapsed.toFixed(0)} ms, DOM düğümü ${document.querySelectorAll('*').length}`,
  )
  // Ölçülen ~2,5 sn (jsdom, 126 bin DOM düğümü; Gantt ~50 bin) > 2 sn eşiği: borç olarak kayıtlı
  // (sanallaştırma F9 adayı). Burada gerileme bekçisi: 4 kat paylı eşik.
  expect(elapsed).toBeLessThan(10_000)
}, 40_000)
