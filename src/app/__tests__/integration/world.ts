// W82a entegrasyon dünyası: kişiler, programlar, katalog, bağlar, ekipler, görevler. Harness'ten
// ayrı (vitest bağımlılığı yok): üretim paketi görsel dumanı da aynı veri kümesini sunar.
import { item, type OrgDb } from './fake-org'

/** Hesaplar (e-posta = giriş). */
export const PEOPLE = {
  admin: { account_id: 'acc-admin', full_name: 'Yasemin Yönetici', email: 'yonetici@example.test' },
  coord: { account_id: 'acc-coord', full_name: 'Kerem Kaya', email: 'koord@example.test' },
  member: { account_id: 'acc-member', full_name: 'Ayşe Demir', email: 'ayse@example.test' },
  second: { account_id: 'acc-cem', full_name: 'Cem Tan', email: 'cem@example.test' },
  free: { account_id: 'acc-bora', full_name: 'Bora Yılmaz', email: 'bora@example.test' },
} as const

/**
 * Ortak dünya: iki program, üç katalog birimi (p1'e Mekanik + Yazılım bağlı, p2'ye Fuar), dört
 * kişilik yetki (yönetici aynı zamanda Mekanik koordinatörü — Koordinatör merceği için), açık
 * görevler. Testler gerektiğinde `db`'yi değiştirir.
 */
export function seedWorld(db: OrgDb): void {
  const p = PEOPLE
  db.accounts = [
    { ...p.admin, admin: true },
    { ...p.coord, admin: false },
    { ...p.member, admin: false },
    { ...p.second, admin: false },
    { ...p.free, admin: false },
  ]
  db.programs = [
    { program_id: 'p1', name: 'Teknofest 2026', year: 2026 },
    { program_id: 'p2', name: 'Teknofest 2027', year: 2027 },
  ]
  db.catalog = [
    { department_id: 'd1', name: 'Mekanik', kind: 'koordinatorluk', code: 'MEK' },
    { department_id: 'd2', name: 'Yazılım', kind: 'koordinatorluk', code: 'YAZ' },
    { department_id: 'd3', name: 'Fuar', kind: 'koordinatorluk', code: 'FUA' },
  ]
  db.links = [
    { program_id: 'p1', department_id: 'd1', display_name: 'Mekanik' },
    { program_id: 'p1', department_id: 'd2', display_name: 'Yazılım' },
    { program_id: 'p2', department_id: 'd3', display_name: 'Fuar' },
  ]
  const row = (
    account: string,
    department: string,
    team: 'coordinator' | 'member',
    program = 'p1',
  ) => ({
    program_id: program,
    department_id: department,
    account_id: account,
    team,
    membership_id: `m-${account}-${program}-${department}`,
  })
  db.memberships = [
    row(p.admin.account_id, 'd1', 'coordinator'),
    row(p.coord.account_id, 'd1', 'coordinator'),
    row(p.member.account_id, 'd1', 'member'),
    row(p.member.account_id, 'd2', 'member'),
    row(p.second.account_id, 'd2', 'member'),
    row(p.second.account_id, 'd3', 'member', 'p2'),
  ]
  const acc = (id: string) => db.accounts.find((a) => a.account_id === id)!
  db.items = [
    item('w1', 'p1', 'd1', acc(p.member.account_id), { title: 'Motor testi' }),
    item('w2', 'p1', 'd1', acc(p.coord.account_id), { title: 'Şasi çizimi' }),
    item('w3', 'p1', 'd2', acc(p.member.account_id), { title: 'Yazılım planı' }),
    item('w4', 'p1', 'd2', acc(p.second.account_id), { title: 'Arayüz taslağı' }),
  ]
}
