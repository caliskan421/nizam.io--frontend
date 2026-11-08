/**
 * 409 `organization.confirmation_required` zarfındaki görev başlıkları (ORGANIZATION-K17).
 *
 * Sözleşme: başlıklar `fields[]` girdilerinde `field = "work_item"`, `code =
 * "organization.task_title"` ve başlık metni `message` alanındadır (backend docs/api/README.md
 * §12: bu kod zarf değil alan kodudur). Bu `message` bir hata metni değil **veri**dir (görev
 * başlığı); yalnız bu alan koduyla okunur. Başka her `message` kullanıcıya gösterilmez.
 */
export const CONFIRMATION_REQUIRED_CODE = 'organization.confirmation_required'
export const TASK_TITLE_FIELD_CODE = 'organization.task_title'

export function extractTaskTitles(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) return []
  const fields = (body as { fields?: unknown }).fields
  if (!Array.isArray(fields)) return []
  const titles: string[] = []
  for (const entry of fields as unknown[]) {
    if (typeof entry !== 'object' || entry === null) continue
    const { code, message } = entry as { code?: unknown; message?: unknown }
    if (code !== TASK_TITLE_FIELD_CODE || typeof message !== 'string') continue
    const title = message.trim()
    if (title !== '') titles.push(title)
  }
  return titles
}
